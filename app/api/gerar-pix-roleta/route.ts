import { type NextRequest, NextResponse } from "next/server"
import { HorsePayService, type HorsePayPaymentResponse } from "@/lib/horsepay"
import { generateCustomerData } from "@/lib/fake-data"
import { Database } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { name, phone, amount, prize_name, utm_source, utm_medium, utm_campaign, utm_term, utm_content, click_id } = await request.json()
    
    // Validar dados obrigatórios
    if (!name || !phone || !amount || !prize_name) {
      return NextResponse.json({
        error: true,
        message: 'Dados incompletos. Nome, telefone, valor e prêmio são obrigatórios.'
      }, { status: 400 })
    }
    
    // Valor mínimo de R$ 10,00
    if (amount < 1000) {
      return NextResponse.json({
        error: true,
        message: 'O valor mínimo é R$ 10,00'
      }, { status: 400 })
    }
    
    // Gerar dados do cliente
    const customerData = await generateCustomerData(true)
    
    const customer = {
      name: name,
      email: customerData.email,
      cpf: customerData.cpf?.replace(/\D/g, ''),
      phone: phone?.replace(/\D/g, '')
    }

    // Gerar ID de referência único
    const clientReferenceId = `roleta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // URL de Callback
    const callbackUrl = `https://${request.headers.get('host')}/api/webhook`
    
    // Criar pagamento via HorsePay
    const paymentResult = await HorsePayService.createPayment(
      amount,
      customer,
      `ROLETA DA SORTE - ${prize_name}`,
      callbackUrl,
      clientReferenceId
    )
    
    // Verificar se houve erro
    if ('error' in paymentResult && paymentResult.error) {
      return NextResponse.json({
        error: true,
        message: paymentResult.message || "Erro ao gerar PIX"
      })
    }
    
    const payment = paymentResult as HorsePayPaymentResponse
    
    // Salvar no banco interno
    try {
      await Database.insert({
        payment_id: String(payment.external_id),
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_cpf: customer.cpf,
        amount: amount,
        status: 'PENDING',
        pix_code: payment.copy_past,
        payment_method: 'PIX',
        utm_source: '', // Não usado para upsells
        action: 'GENERATED_ROLETA'
      })
    } catch (dbError) {
      // Não falhar a requisição
    }
    
    // Retornar resposta
    return NextResponse.json({
      error: false,
      pix_code: payment.copy_past,
      pix_qr_code: payment.copy_past,
      qr_code: payment.copy_past,
      qr_code_base64: payment.payment,
      transaction_id: String(payment.external_id),
      hash: String(payment.external_id),
      amount: amount,
      prize_name: prize_name,
      pix: {
        pix_qr_code: payment.copy_past,
        pix_code: payment.copy_past,
        transaction_id: String(payment.external_id)
      },
      customer: {
        name: customer.name,
        email: customer.email,
        cpf: customer.cpf,
        phone: customer.phone
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: true,
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
