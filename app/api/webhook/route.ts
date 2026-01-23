import { type NextRequest, NextResponse } from "next/server";
import { Database, RaffleDatabase, WebhookLogger } from "@/lib/database";
import { XtrackyService } from "@/lib/xtracky";
import { HorsePayService } from "@/lib/horsepay";

// Webhook handler para callbacks V2 da HorsePay
export async function POST(request: NextRequest) {
  try {
    // Capturar o payload JSON da HorsePay
    const webhookData = await request.json();

    console.log(
      "📬 Webhook HorsePay recebido:",
      JSON.stringify(webhookData, null, 2),
    );

    // Verificar se é um callback de infração
    if (HorsePayService.isInfractionCallback(webhookData)) {
      return handleInfractionCallback(webhookData);
    }

    // Extrair dados do webhook V2 (Depósito ou Saque)
    const {
      amount,
      document,
      end_to_end,
      endtoendid, // Para saques
      external_id,
      name,
      status,
      client_reference_id,
    } = webhookData;

    const paymentId = String(external_id);
    const endToEndId = end_to_end || endtoendid || "";
    const isPaid = status === true;

    if (!paymentId) {
      console.warn("⚠️ Webhook sem external_id:", webhookData);
      return NextResponse.json({
        success: false,
        error: "external_id não fornecido",
      });
    }

    // 📝 SALVAR LOG DO WEBHOOK (SEMPRE, ANTES DE QUALQUER PROCESSAMENTO)
    await WebhookLogger.logWebhook(
      paymentId,
      isPaid ? "PAYMENT_APPROVED" : "PAYMENT_PENDING",
      isPaid ? "APPROVED" : "PENDING",
      HorsePayService.formatAmountToCents(amount),
      webhookData,
      endToEndId,
    );

    // Contar quantos webhooks já recebemos para este payment_id
    const webhookCount =
      await WebhookLogger.countWebhooksByPaymentId(paymentId);
    console.log(
      `📊 Total de webhooks recebidos para ${paymentId}: ${webhookCount}`,
    );

    // Salvar no banco interno
    const db = Database;

    if (isPaid) {
      console.log("✅ Pagamento APROVADO - ID:", paymentId, "- Valor:", amount);

      // Verificar se o pagamento já foi processado como APPROVED
      const existingPayment = await db.findByPaymentId(paymentId);

      if (existingPayment && existingPayment.status === "APPROVED") {
        console.log(
          `⚠️ Pagamento ${paymentId} já foi processado como APPROVED anteriormente (webhook #${webhookCount})`,
        );
        return NextResponse.json({
          success: true,
          message: "Pagamento já processado anteriormente",
          paymentId: paymentId,
          webhookNumber: webhookCount,
        });
      }

      // Atualizar status no banco interno (não inserir duplicado)
      await db.updateStatus(paymentId, "APPROVED");

      // 🎟️ MARCAR BILHETES COMO PAGOS
      try {
        const ticketsMarked = await RaffleDatabase.markTicketsAsPaid(paymentId);
        if (ticketsMarked) {
          console.log("🎟️ Bilhetes marcados como PAGOS para:", paymentId);
        } else {
          console.log(
            "⚠️ Nenhum bilhete encontrado para marcar como pago:",
            paymentId,
          );
        }
      } catch (ticketError) {
        console.warn("⚠️ Erro ao marcar bilhetes como pagos:", ticketError);
      }

      // Enviar evento para Xtracky (pagamento aprovado - apenas para front, não upsells)
      try {
        // Tentar recuperar dados do banco de dados
        const paymentRecord = await db.findByPaymentId(paymentId);
        const isUpsell = paymentRecord?.action?.includes("ROLETA") || false;

        // Só enviar para Xtracky se não for um upsell
        if (!isUpsell) {
          const utm_source = paymentRecord?.utm_source;
          const utmSourceForXtracky =
            utm_source && utm_source.trim() !== "" ? utm_source : undefined;

          console.log(
            "🔔 UTM Source recuperado do banco (webhook):",
            utm_source,
          );
          console.log(
            "🔔 UTM Source para Xtracky (webhook):",
            utmSourceForXtracky,
          );

          await XtrackyService.sendPaid(
            paymentId,
            HorsePayService.formatAmountToCents(amount),
            utmSourceForXtracky,
          );
          console.log("🔔 Evento 'paid' enviado para Xtracky via webhook");
        } else {
          console.log(
            "🔔 Pagamento de upsell (webhook) - não enviando para Xtracky",
          );
        }
      } catch (xtrackyError) {
        console.warn("⚠️ Erro ao enviar evento para Xtracky:", xtrackyError);
        // Não falhar a requisição por erro na Xtracky
      }

      return NextResponse.json({
        success: true,
        message: "Webhook processado com sucesso",
        paymentId: paymentId,
        status: "APPROVED",
        end_to_end: endToEndId,
        client_reference_id: client_reference_id || "",
      });
    } else {
      // status === false indica falha ou estorno
      console.log(
        "📝 Webhook recebido - Status: FAILED/REFUNDED - ID:",
        paymentId,
      );

      // Salvar status de falha
      await db.updateStatus(paymentId, "FAILED");
      await db.insert({
        payment_id: paymentId,
        status: "FAILED",
        amount: HorsePayService.formatAmountToCents(amount),
        customer_name: name || "",
        customer_cpf: document || "",
        payment_method: "PIX",
        action: "WEBHOOK_FAILED",
      });

      return NextResponse.json({
        success: true,
        message: "Webhook de falha/estorno recebido",
        paymentId: paymentId,
        status: "FAILED",
        client_reference_id: client_reference_id || "",
      });
    }
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}

// Handler específico para callbacks de infração
async function handleInfractionCallback(data: any) {
  const {
    amount,
    blocked_at,
    document,
    end_to_end,
    external_id,
    infraction_status,
    name,
    status,
  } = data;

  const paymentId = String(external_id);

  console.log("⚠️ INFRAÇÃO DETECTADA - ID:", paymentId);
  console.log("- Status da infração:", infraction_status);
  console.log("- Bloqueado em:", blocked_at);
  console.log("- Documento:", document);
  console.log("- Nome:", name);

  // Salvar informação de infração no banco
  try {
    await Database.insert({
      payment_id: paymentId,
      status: `INFRACTION_${infraction_status.toUpperCase()}`,
      amount: HorsePayService.formatAmountToCents(amount),
      customer_name: name || "",
      customer_cpf: document || "",
      action: `INFRACTION_${infraction_status.toUpperCase()}`,
    });
    console.log("💾 Infração salva no banco interno");
  } catch (dbError) {
    console.warn("⚠️ Erro ao salvar infração no banco:", dbError);
  }

  return NextResponse.json({
    success: true,
    message: "Callback de infração processado",
    paymentId: paymentId,
    infraction_status: infraction_status,
    blocked_at: blocked_at,
  });
}
