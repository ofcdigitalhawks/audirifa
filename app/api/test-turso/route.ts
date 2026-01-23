import { type NextRequest, NextResponse } from "next/server";
import { RaffleDatabase, Database } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testando conexão com Turso...");

    // Testar bilhetes
    const tickets = await RaffleDatabase.getAllTickets();
    console.log(`📊 Total de bilhetes no Turso: ${tickets.length}`);
    console.log("🎟️ Primeiros 3 bilhetes:", tickets.slice(0, 3));

    // Testar pagamentos
    const payments = await Database.getAllPayments();
    console.log(`💰 Total de pagamentos no Turso: ${payments.length}`);
    console.log("💳 Primeiros 3 pagamentos:", payments.slice(0, 3));

    return NextResponse.json({
      success: true,
      turso_connection: "OK",
      data: {
        tickets: {
          total: tickets.length,
          sample: tickets.slice(0, 3),
        },
        payments: {
          total: payments.length,
          sample: payments.slice(0, 3),
        },
      },
    });
  } catch (error) {
    console.error("❌ Erro ao testar Turso:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
