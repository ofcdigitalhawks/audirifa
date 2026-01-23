import { type NextRequest, NextResponse } from "next/server"
import { RaffleDatabase } from "@/lib/database"

// GET: Buscar bilhetes por telefone (minhas compras)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json({
        success: false,
        error: "Telefone é obrigatório"
      }, { status: 400 })
    }

    // Limpar telefone (apenas números)
    const cleanPhone = phone.replace(/\D/g, "")

    if (cleanPhone.length < 10) {
      return NextResponse.json({
        success: false,
        error: "Telefone inválido"
      }, { status: 400 })
    }

    console.log("🔍 Buscando bilhetes para telefone:", cleanPhone)

    // Buscar todos os bilhetes
    const allTickets = await RaffleDatabase.getAllTickets()

    // Filtrar por telefone (busca parcial)
    const userTickets = allTickets.filter(ticket => {
      const ticketPhone = ticket.customer_phone?.replace(/\D/g, "") || ""
      return ticketPhone.includes(cleanPhone) || cleanPhone.includes(ticketPhone)
    })

    // Separar pagos e não pagos
    const paidTickets = userTickets.filter(t => t.is_paid)
    const pendingTickets = userTickets.filter(t => !t.is_paid)

    console.log(`📱 Encontrados ${userTickets.length} bilhetes para ${cleanPhone}`)

    return NextResponse.json({
      success: true,
      phone: cleanPhone,
      total: userTickets.length,
      paid: paidTickets.length,
      pending: pendingTickets.length,
      tickets: userTickets.map(t => ({
        ticket_number: t.ticket_number,
        formatted_number: t.ticket_number.toString().padStart(6, '0'),
        customer_name: t.customer_name,
        is_paid: t.is_paid,
        status: t.is_paid ? 'PAGO' : 'PENDENTE',
        amount: t.amount_paid,
        created_at: t.created_at,
        paid_at: t.paid_at
      }))
    })

  } catch (error) {
    console.error("❌ Erro ao buscar bilhetes:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 })
  }
}
