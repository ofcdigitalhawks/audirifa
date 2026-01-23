import { type NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

// Desabilitar cache para dados em tempo real
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log("🔐 Admin: Buscando todos os pagamentos...");

    const payments = await Database.getAllPayments();

    console.log(`✅ Admin: ${payments.length} pagamentos encontrados`);

    const response = NextResponse.json({
      success: true,
      payments: payments.map((p) => ({
        id: p.id,
        payment_id: p.payment_id,
        status: p.status,
        amount: p.amount,
        customer_name: p.customer_name || "",
        customer_phone: p.customer_phone || "",
        created_at: p.created_at,
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
    console.error("❌ Admin: Erro ao buscar pagamentos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
