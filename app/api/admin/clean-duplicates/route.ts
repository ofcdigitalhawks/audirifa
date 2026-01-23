import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    console.log("🧹 Iniciando limpeza de pagamentos duplicados...");

    // Primeiro, identificar duplicatas
    const duplicatesQuery = await turso.execute(`
      SELECT payment_id, COUNT(*) as count
      FROM payments 
      GROUP BY payment_id 
      HAVING COUNT(*) > 1
    `);

    console.log(
      `📊 Encontrados ${duplicatesQuery.rows.length} payment_ids com duplicatas`,
    );

    // Deletar duplicatas mantendo apenas o registro com action='GENERATED' ou o mais antigo
    const result = await turso.execute(`
      DELETE FROM payments 
      WHERE id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (
                   PARTITION BY payment_id 
                   ORDER BY 
                     CASE WHEN action = 'GENERATED' THEN 0 ELSE 1 END,
                     CASE WHEN customer_name IS NOT NULL AND customer_name != 'null' THEN 0 ELSE 1 END,
                     created_at ASC
                 ) as rn
          FROM payments
        ) 
        WHERE rn > 1
      )
    `);

    console.log(`✅ ${result.rowsAffected} pagamentos duplicados removidos`);

    return NextResponse.json({
      success: true,
      message: `${result.rowsAffected} pagamentos duplicados removidos`,
      rowsAffected: result.rowsAffected,
      duplicatePaymentIds: duplicatesQuery.rows.length,
    });
  } catch (error) {
    console.error("❌ Erro ao limpar duplicatas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
