import { type NextRequest, NextResponse } from "next/server";
import { HorsePayService } from "@/lib/horsepay";
import { Database, RaffleDatabase } from "@/lib/database";
import { XtrackyService } from "@/lib/xtracky";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");

    if (!hash) {
      console.error("❌ ID da transação não fornecido na requisição");
      return NextResponse.json({
        erro: true,
        mensagem: "ID da transação não fornecido",
      });
    }

    console.log("🔍 Verificando status da transação:", hash);

    // Consultar status diretamente via HorsePay
    const paymentResult = await HorsePayService.getDepositStatus(hash);

    if ("error" in paymentResult && paymentResult.error) {
      console.error("❌ Erro ao consultar status:", paymentResult.message);
      return NextResponse.json({
        erro: true,
        mensagem:
          paymentResult.message || "Erro ao verificar status da transação",
        success: false,
        status: "ERROR",
        debug: paymentResult.details,
      });
    }

    const payment = paymentResult as any; // Type assertion

    console.log("📊 Status obtido da HorsePay:", payment.status);
    console.log("📊 End-to-End recebido:", payment.end_to_end);

    // ⚡ CORREÇÃO: Se tem end_to_end, significa que o PIX foi PAGO
    // O end_to_end só é gerado quando há uma transação PIX concluída
    const isPaid =
      payment.status === "paid" ||
      (payment.end_to_end && payment.end_to_end.trim() !== "");

    // Mapear status HorsePay para status interno
    const internalStatus = isPaid ? "APPROVED" : "PENDING";

    console.log("📊 Pagamento considerado como PAGO?", isPaid);

    // Atualizar banco interno apenas se status não for PENDING
    if (isPaid) {
      try {
        // Apenas ATUALIZAR status, não inserir novo registro
        await Database.updateStatus(hash, internalStatus);
        console.log("💾 Status atualizado no banco interno");
      } catch (dbError) {
        console.warn("⚠️ Erro ao atualizar banco:", dbError);
      }

      // 🎟️ MARCAR BILHETES COMO PAGOS
      try {
        const ticketsMarked = await RaffleDatabase.markTicketsAsPaid(hash);
        if (ticketsMarked) {
          console.log("🎟️ Bilhetes marcados como PAGOS para:", hash);
        } else {
          console.log(
            "⚠️ Nenhum bilhete encontrado para marcar como pago:",
            hash,
          );
        }
      } catch (ticketError) {
        console.warn("⚠️ Erro ao marcar bilhetes como pagos:", ticketError);
      }

      // Enviar evento para Xtracky se pagamento foi aprovado (apenas para front, não upsells)
      try {
        // Recuperar dados do banco de dados
        const paymentRecord = await Database.findByPaymentId(hash);
        const isUpsell = paymentRecord?.action?.includes("ROLETA") || false;

        // Só enviar para Xtracky se não for um upsell
        if (!isUpsell) {
          const utm_source = paymentRecord?.utm_source;
          const utmSourceForXtracky =
            utm_source && utm_source.trim() !== "" ? utm_source : undefined;

          console.log("🔔 UTM Source recuperado do banco:", utm_source);
          console.log("🔔 UTM Source para Xtracky:", utmSourceForXtracky);

          await XtrackyService.sendPaid(
            hash,
            payment.value || 0,
            utmSourceForXtracky,
          );
          console.log("🔔 Evento 'paid' enviado para Xtracky");
        } else {
          console.log("🔔 Pagamento de upsell - não enviando para Xtracky");
        }
      } catch (xtrackyError) {
        console.warn("⚠️ Erro ao enviar evento para Xtracky:", xtrackyError);
        // Não falhar a requisição por erro na Xtracky
      }
    }

    // Mapear status para o formato esperado pelo frontend
    const paymentStatus = isPaid ? "paid" : "pending";

    console.log("📌 Status processado:", payment.status, "→", paymentStatus);
    console.log("📌 Status final retornado:", {
      status: internalStatus,
      payment_status: paymentStatus,
      approved: isPaid,
    });

    // 🎟️ BUSCAR NÚMEROS DOS BILHETES
    let ticketNumbers: number[] = [];
    try {
      const tickets = await RaffleDatabase.getTicketsByPaymentId(hash);
      ticketNumbers = tickets.map((t) => t.ticket_number);
      console.log("🎟️ Números dos bilhetes encontrados:", ticketNumbers);
    } catch (ticketError) {
      console.warn("⚠️ Erro ao buscar números dos bilhetes:", ticketError);
    }

    // Retornar resposta no formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      status: internalStatus,
      payment_status: paymentStatus, // Campo principal que o frontend procura
      transaction_id: payment.id || hash,
      amount: payment.value,
      tax: payment.tax,
      payment_method: "PIX",
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      end_to_end: payment.end_to_end,
      ticket_numbers: ticketNumbers, // Números dos bilhetes
      // Campos adicionais para compatibilidade
      erro: isPaid ? false : undefined,
      approved: isPaid,
    });
  } catch (error) {
    console.error("❌ Erro geral na verificação:", error);
    return NextResponse.json({
      erro: true,
      mensagem: "Erro interno ao verificar status da transação",
      success: false,
      status: "ERROR",
      debug: error instanceof Error ? error.message : String(error),
    });
  }
}
