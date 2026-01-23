import { type NextRequest, NextResponse } from "next/server";
import { WebhookLogger } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id");
    const limit = parseInt(searchParams.get("limit") || "100");

    console.log("🔐 Admin: Buscando logs de webhook...");

    let logs;
    if (paymentId) {
      logs = await WebhookLogger.getLogsByPaymentId(paymentId);
    } else {
      logs = await WebhookLogger.getAllLogs(limit);
    }

    console.log(`✅ Admin: ${logs.length} logs de webhook encontrados`);

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        payment_id: log.payment_id,
        webhook_type: log.webhook_type,
        status: log.status,
        amount: log.amount,
        end_to_end: log.end_to_end,
        raw_payload: JSON.parse(log.raw_payload),
        created_at: log.created_at,
      })),
    });
  } catch (error) {
    console.error("❌ Admin: Erro ao buscar logs de webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
