import { type NextRequest, NextResponse } from "next/server";
import { HorsePayService, type HorsePayPaymentResponse } from "@/lib/horsepay";
import { generateCustomerData } from "@/lib/fake-data";
import { Database, RaffleDatabase } from "@/lib/database";
import { XtrackyService } from "@/lib/xtracky";

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`🆔 Nova requisição gerar-pix iniciada: ${requestId}`);
  try {
    const body = await request.json();
    const {
      nome,
      telefone,
      amount,
      quantity, // Quantidade de números/cotas
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      click_id,
      CampaignID,
      CreativeID,
      product_hash,
      offer_hash,
    } = body;

    // Debug logs
    console.log(`[${requestId}] 🔍 Dados recebidos na API:`);
    console.log(`[${requestId}] Nome recebido:`, nome);
    console.log(`[${requestId}] Quantidade de cotas recebida:`, quantity);
    console.log(`[${requestId}] Valor recebido (centavos):`, amount);
    console.log(`[${requestId}] Product hash recebido:`, product_hash);
    console.log(`[${requestId}] Offer hash recebido:`, offer_hash);

    console.log("Received UTM data in API:", {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      click_id,
      CampaignID,
      CreativeID,
    });

    // Verifica valor mínimo
    if (amount < 100) {
      return NextResponse.json({
        erro: true,
        mensagem: "O valor mínimo permitido é R$ 1,00",
      });
    }

    // ⚡ LÓGICA DE QUANTIDADE E VALIDAÇÃO
    // SEMPRE usar a quantidade enviada pelo frontend quando disponível
    let ticketQuantity = quantity;

    // Validação: se a quantidade foi enviada, ela deve ser válida
    if (ticketQuantity && ticketQuantity >= 1) {
      console.log(
        "✅ Usando quantidade enviada pelo frontend:",
        ticketQuantity,
      );
    } else {
      // Fallback: calcular baseado no valor apenas se quantity não foi enviada
      console.log("⚠️ Quantidade não enviada, calculando baseado no valor...");

      // 10 números = R$ 19,99 (1999 centavos)
      // A partir de 11: cada número adicional = R$ 1,99 (199 centavos)
      if (amount <= 1999) {
        ticketQuantity = 10;
      } else {
        const extraAmount = amount - 1999;
        const extraTickets = Math.floor(extraAmount / 199);
        ticketQuantity = 10 + extraTickets;
      }
      console.log("📊 Quantidade calculada:", ticketQuantity);
    }

    console.log("🎟️ Quantidade FINAL de bilhetes:", ticketQuantity);
    console.log("💰 Valor total (centavos):", amount);

    if (ticketQuantity < 1) {
      return NextResponse.json({
        erro: true,
        mensagem: "Quantidade mínima é 1 número",
      });
    }

    // Gerar dados complementares do cliente (usando 4Devs + fallback local)
    const fakeData = await generateCustomerData(true);

    // Combinar dados reais com dados gerados
    const customer = {
      name: nome || fakeData.name,
      email: fakeData.email,
      cpf: fakeData.cpf,
      phone: telefone?.replace(/\D/g, "") || fakeData.phone,
    };

    // Gerar ID de referência único
    const clientReferenceId = `pixmilhao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Preparar UTM params
    const utmParams = {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    };

    // URL de Callback (configurar depois no painel HorsePay)
    const callbackUrl = `https://${request.headers.get("host")}/api/webhook`;

    console.log("📦 Dados do cliente processados:");
    console.log("- Nome:", customer.name);
    console.log("- Email:", customer.email);
    console.log("- CPF:", customer.cpf);
    console.log("- Telefone:", customer.phone);
    console.log("- Valor:", amount);
    console.log("- Quantidade de números:", ticketQuantity);

    console.log("🔄 Criando pagamento via HorsePay...");

    // Criar pagamento via HorsePay
    const paymentResult = await HorsePayService.createPayment(
      amount,
      customer,
      "PIX DO MILHAO",
      callbackUrl,
      clientReferenceId,
      utmParams,
    );

    // Verificar se houve erro na criação
    if ("error" in paymentResult && paymentResult.error) {
      console.error("❌ Erro na geração do PIX:", paymentResult.message);
      return NextResponse.json({
        error: true,
        message: paymentResult.message || "Erro ao gerar o PIX",
        details: paymentResult.details,
      });
    }

    const payment = paymentResult as HorsePayPaymentResponse;

    console.log("✅ PIX gerado com sucesso:", payment.external_id);

    // Salvar no banco interno (pagamentos)
    try {
      console.log(`[${requestId}] 💾 Salvando pagamento no banco...`);
      await Database.insert({
        payment_id: String(payment.external_id),
        status: "PENDING",
        amount: amount,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_cpf: customer.cpf,
        customer_phone: customer.phone,
        pix_code: payment.copy_past,
        utm_source: utm_source || "",
        action: "GENERATED",
      });
      console.log(`[${requestId}] ✅ Pagamento salvo no banco interno`);
    } catch (dbError) {
      console.warn(`[${requestId}] ⚠️ Erro ao salvar no banco:`, dbError);
      // Não falhar a requisição por erro no banco
    }

    // 🎟️ CRIAR BILHETES DO SORTEIO (não pagos ainda)
    let ticketNumbers: number[] = [];
    try {
      ticketNumbers = await RaffleDatabase.createTickets(
        String(payment.external_id),
        ticketQuantity,
        customer.name,
        customer.phone,
        customer.email,
        amount,
      );
      console.log("🎟️ Bilhetes criados:", ticketNumbers);
    } catch (ticketError) {
      console.warn("⚠️ Erro ao criar bilhetes:", ticketError);
      // Não falhar a requisição por erro nos bilhetes
    }

    // Enviar evento para Xtracky (PIX gerado = waiting_payment)
    try {
      const utmSourceForXtracky =
        utm_source && utm_source.trim() !== "" ? utm_source : undefined;
      console.log("🔔 UTM Source para Xtracky:", utmSourceForXtracky);

      await XtrackyService.sendWaitingPayment(
        String(payment.external_id),
        amount,
        utmSourceForXtracky,
      );
      console.log("🔔 Evento 'waiting_payment' enviado para Xtracky");
    } catch (xtrackyError) {
      console.warn("⚠️ Erro ao enviar evento para Xtracky:", xtrackyError);
      // Não falhar a requisição por erro na Xtracky
    }

    // Formatar números dos bilhetes para exibição
    const formattedTickets = ticketNumbers.map((num) =>
      num.toString().padStart(6, "0"),
    );

    // Retornar dados formatados para o frontend (mantendo compatibilidade)
    return NextResponse.json({
      error: false,
      pix_code: payment.copy_past,
      pix_qr_code: payment.copy_past,
      qr_code: payment.copy_past,
      qr_code_base64: payment.payment, // QR code como imagem base64
      transaction_id: String(payment.external_id),
      hash: String(payment.external_id),
      amount: amount,
      quantity: ticketQuantity,
      ticket_numbers: ticketNumbers, // Números dos bilhetes (inteiros)
      formatted_tickets: formattedTickets, // Números formatados (strings com 6 dígitos)
      pix: {
        pix_qr_code: payment.copy_past,
        pix_code: payment.copy_past,
        transaction_id: String(payment.external_id),
      },
      customer: {
        name: customer.name,
        email: customer.email,
        cpf: customer.cpf,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("❌ Erro geral:", error);
    return NextResponse.json({
      error: true,
      message: "Erro interno do servidor",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
