import { type NextRequest, NextResponse } from "next/server"
import { HorsePayService, type HorsePayPaymentResponse } from "@/lib/horsepay"
import { generateCustomerData } from "@/lib/fake-data"
import { Database } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nome,
      telefone,
      amount,
      prize_name,
      shipping_option,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      click_id,
      CampaignID,
      CreativeID,
    } = body

    console.log("🏍️ Gerando PIX para Roleta 2")
    console.log("- Nome:", nome)
    console.log("- Telefone:", telefone)
    console.log("- Prêmio:", prize_name)
    console.log("- Frete:", shipping_option)
    console.log("- Valor:", amount)

    // Verificar valor mínimo
    if (amount < 500) {
      return NextResponse.json({
        error: true,
        message: "O valor mínimo permitido é R$ 5,00"
      })
    }

    // Gerar dados complementares do cliente (usando 4Devs + fallback local)
    const fakeData = await generateCustomerData(true)
    
    // Combinar dados reais com dados gerados
    const customer = {
      name: nome || fakeData.name,
      email: fakeData.email,
      cpf: fakeData.cpf,
      phone: telefone?.replace(/\D/g, '') || fakeData.phone
    }

    // Gerar ID de referência único
    const clientReferenceId = `roleta2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Preparar UTM params
    const utmParams = {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content
    }

    // URL de Callback
    const callbackUrl = `https://${request.headers.get('host')}/api/webhook`
    const productTitle = shipping_option ? `Frete Honda Biz 2025 - ${shipping_option}` : 'Frete Honda Biz 2025'

    console.log("🔄 Criando pagamento via HorsePay para Roleta 2...")

    // Criar pagamento via HorsePay
    const paymentResult = await HorsePayService.createPayment(
      amount,
      customer,
      productTitle,
      callbackUrl,
      clientReferenceId,
      utmParams
    )

    // Verificar se houve erro na criação
    if ('error' in paymentResult && paymentResult.error) {
      console.error("❌ Erro na geração do PIX:", paymentResult.message)
      return NextResponse.json({
        error: true,
        message: paymentResult.message || "Erro ao gerar o PIX",
        details: paymentResult.details
      })
    }

    const payment = paymentResult as HorsePayPaymentResponse

    console.log("✅ PIX gerado com sucesso para Roleta 2:", payment.external_id)

    // Salvar no banco interno
    try {
      await Database.insert({
        payment_id: String(payment.external_id),
        status: 'PENDING',
        amount: amount,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_cpf: customer.cpf,
        customer_phone: customer.phone,
        pix_code: payment.copy_past,
        utm_source: '', // Não usado para upsells
        action: 'GENERATED_ROLETA2'
      })
      console.log("💾 Pagamento da Roleta 2 salvo no banco interno")
    } catch (dbError) {
      console.warn("⚠️ Erro ao salvar no banco:", dbError)
    }

    // Retornar dados formatados para o frontend
    return NextResponse.json({
      error: false,
      pix_code: payment.copy_past,
      pix_qr_code: payment.copy_past,
      qr_code: payment.copy_past,
      qr_code_base64: payment.payment,
      transaction_id: String(payment.external_id),
      hash: String(payment.external_id),
      amount: amount,
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
    console.error("❌ Erro geral na geração do PIX da Roleta 2:", error)
    return NextResponse.json({
      error: true,
      message: "Erro interno ao gerar PIX da Roleta 2",
      debug: error instanceof Error ? error.message : String(error)
    })
  }
}
