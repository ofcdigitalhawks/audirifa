import { type NextRequest, NextResponse } from "next/server"
import { RaffleDatabase } from "@/lib/database"

// GET: Listar bilhetes (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") // "paid", "unpaid", or "all"
    const paymentId = searchParams.get("payment_id")

    // Buscar por payment_id específico
    if (paymentId) {
      const tickets = await RaffleDatabase.getTicketsByPaymentId(paymentId)
      return NextResponse.json({
        success: true,
        payment_id: paymentId,
        tickets: tickets.map(t => ({
          ...t,
          formatted_number: t.ticket_number.toString().padStart(6, '0')
        })),
        count: tickets.length
      })
    }

    // Filtrar por status de pagamento
    let tickets
    if (filter === "paid") {
      tickets = await RaffleDatabase.getPaidTickets()
    } else {
      tickets = await RaffleDatabase.getAllTickets()
      if (filter === "unpaid") {
        tickets = tickets.filter(t => !t.is_paid)
      }
    }

    // Estatísticas
    const stats = await RaffleDatabase.countTickets()

    return NextResponse.json({
      success: true,
      filter: filter || "all",
      stats: {
        total: stats.total,
        paid: stats.paid,
        unpaid: stats.unpaid
      },
      tickets: tickets.map(t => ({
        ...t,
        formatted_number: t.ticket_number.toString().padStart(6, '0')
      })),
      count: tickets.length
    })

  } catch (error) {
    console.error("❌ Erro ao listar bilhetes:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    })
  }
}
