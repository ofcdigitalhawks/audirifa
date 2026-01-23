interface XtrackyPayload {
  orderId: string
  amount: number
  status: 'waiting_payment' | 'paid'
  utm_source?: string
}

export class XtrackyService {
  private static readonly API_URL = 'https://api.xtracky.com/api/integrations/api'

  static async sendEvent(payload: XtrackyPayload): Promise<void> {
    try {
      console.log('🔔 Enviando evento para Xtracky:', JSON.stringify(payload, null, 2))

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro HTTP da Xtracky:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const responseData = await response.json()
      console.log('✅ Evento enviado para Xtracky com sucesso:', responseData)
    } catch (error) {
      console.error('❌ Erro ao enviar evento para Xtracky:', error)
      // Não vamos falhar a requisição principal por erro na Xtracky
    }
  }

  static async sendWaitingPayment(orderId: string, amount: number, utm_source?: string): Promise<void> {
    const payload: XtrackyPayload = {
      orderId,
      amount,
      status: 'waiting_payment'
    }

    // Só incluir utm_source se não for undefined
    if (utm_source !== undefined) {
      payload.utm_source = utm_source
    }

    await this.sendEvent(payload)
  }

  static async sendPaid(orderId: string, amount: number, utm_source?: string): Promise<void> {
    const payload: XtrackyPayload = {
      orderId,
      amount,
      status: 'paid'
    }

    // Só incluir utm_source se não for undefined
    if (utm_source !== undefined) {
      payload.utm_source = utm_source
    }

    await this.sendEvent(payload)
  }
} 