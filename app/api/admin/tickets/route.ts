import { type NextRequest, NextResponse } from "next/server";
import { RaffleDatabase } from "@/lib/database";

// Desabilitar cache para dados em tempo real
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log("🔐 Admin: Buscando todos os bilhetes...");

    const tickets = await RaffleDatabase.getAllTickets();

    console.log(`✅ Admin: ${tickets.length} bilhetes encontrados`);

    const response = NextResponse.json({
      success: true,
      tickets: tickets.map((t) => ({
        id: t.id,
        ticket_number: t.ticket_number,
        payment_id: t.payment_id,
        customer_name: t.customer_name,
        customer_phone: t.customer_phone,
        customer_email: t.customer_email,
        amount_paid: t.amount_paid,
        is_paid: t.is_paid,
        created_at: t.created_at,
        paid_at: t.paid_at,
      })),
    });

    // Headers para evitar cache
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("❌ Admin: Erro ao buscar bilhetes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
