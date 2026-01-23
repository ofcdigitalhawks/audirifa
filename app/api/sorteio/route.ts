import { type NextRequest, NextResponse } from "next/server"
import { RaffleDatabase } from "@/lib/database"

// GET: Realizar o sorteio (apenas bilhetes pagos)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    // Ação: Sortear vencedor
    if (action === "draw") {
      const winner = await RaffleDatabase.drawWinner()
      
      if (!winner) {
        return NextResponse.json({
          success: false,
          message: "Nenhum bilhete pago encontrado para sorteio"
        })
      }

      return NextResponse.json({
        success: true,
        message: "Sorteio realizado com sucesso!",
        winner: {
          ticket_number: winner.ticket_number,
          formatted_number: winner.ticket_number.toString().padStart(6, '0'),
          customer_name: winner.customer_name,
          customer_phone: winner.customer_phone,
          customer_email: winner.customer_email,
          paid_at: winner.paid_at
        }
      })
    }

    // Ação padrão: Listar estatísticas
    const stats = await RaffleDatabase.countTickets()
    const paidTickets = await RaffleDatabase.getPaidTickets()

    return NextResponse.json({
      success: true,
      stats: {
        total_tickets: stats.total,
        paid_tickets: stats.paid,
        unpaid_tickets: stats.unpaid,
        eligible_for_draw: stats.paid
      },
      message: `${stats.paid} bilhetes elegíveis para sorteio. Use ?action=draw para sortear.`
    })

  } catch (error) {
    console.error("❌ Erro no sorteio:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    })
  }
}
