// Verificar se as variáveis de ambiente estão configuradas
if (
  !process.env.HORSEPAY_CLIENT_KEY ||
  !process.env.HORSEPAY_CLIENT_SECRET ||
  !process.env.HORSEPAY_BASE_URL
) {
  throw new Error(
    "HORSEPAY_CLIENT_KEY, HORSEPAY_CLIENT_SECRET e HORSEPAY_BASE_URL devem estar configurados no arquivo .env.local",
  );
}

// Configuração da API HorsePay
const HORSEPAY_CONFIG = {
  clientKey: process.env.HORSEPAY_CLIENT_KEY,
  clientSecret: process.env.HORSEPAY_CLIENT_SECRET,
  baseUrl: process.env.HORSEPAY_BASE_URL,
};

// Cache do token de acesso
let accessToken: string | null = null;
let tokenExpiry: number = 0;

export interface HorsePayCustomer {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

export interface HorsePayPaymentRequest {
  payer_name: string;
  amount: number;
  callback_url?: string;
  client_reference_id?: string;
  phone?: string;
  split?: Array<{ user: string; percent: number }>;
}

export interface HorsePayPaymentResponse {
  copy_past: string;
  external_id: number;
  payer_name: string;
  payment: string; // base64 QR code image
  status: number;
}

export interface HorsePayDepositStatus {
  id: number;
  value: number;
  tax: number;
  end_to_end: string;
  status: "pending" | "paid";
  created_at: string;
  updated_at: string;
}

export interface HorsePayWithdrawRequest {
  amount: number;
  pix_key: string;
  pix_type: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";
  callback_url?: string;
  client_reference_id?: string;
}

export interface HorsePayBalanceResponse {
  balance: number;
}

export interface HorsePayError {
  error: boolean;
  message: string;
  details?: any;
}

// Callback V2 types
export interface HorsePayDepositCallback {
  amount: number;
  document: string;
  end_to_end: string;
  external_id: number;
  name: string;
  status: boolean;
  client_reference_id: string;
}

export interface HorsePayWithdrawCallback {
  amount: number;
  document: string;
  endtoendid: string;
  external_id: number;
  name: string;
  status: boolean;
  client_reference_id: string;
}

export interface HorsePayInfractionCallback {
  amount: number;
  blocked_at: string;
  document: string;
  end_to_end: string;
  external_id: number;
  infraction_status: "pending_defense" | "rejected" | "accepted";
  name: string;
  status: boolean;
}

export class HorsePayService {
  /**
   * Obtém o token de acesso (com cache)
   */
  private static async getAccessToken(): Promise<string> {
    // Verificar se o token ainda é válido (com margem de 60 segundos)
    if (accessToken && Date.now() < tokenExpiry - 60000) {
      return accessToken;
    }

    console.log("🔑 Obtendo novo token HorsePay...");

    const response = await fetch(`${HORSEPAY_CONFIG.baseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_key: HORSEPAY_CONFIG.clientKey,
        client_secret: HORSEPAY_CONFIG.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na autenticação: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error("Token não retornado pela API");
    }

    accessToken = data.access_token;
    // Token expira em 1 hora (assumindo, ajuste se necessário)
    tokenExpiry = Date.now() + 3600000;

    console.log("✅ Token HorsePay obtido com sucesso");
    return accessToken as string;
  }

  /**
   * Faz requisição autenticada para a API
   */
  private static async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    const token = await this.getAccessToken();

    let url = `${HORSEPAY_CONFIG.baseUrl}${endpoint}`;

    // Adicionar query params (para UTM tracking)
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    };

    if (method === "POST" && body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Criar pedido de depósito via PIX
   */
  static async createPayment(
    amount: number,
    customer: HorsePayCustomer,
    productTitle: string = "PIX DO MILHAO",
    callbackUrl?: string,
    clientReferenceId?: string,
    utmParams?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_term?: string;
      utm_content?: string;
    },
  ): Promise<HorsePayPaymentResponse | HorsePayError> {
    try {
      // Converter de centavos para reais
      const amountInReais = amount / 100;

      console.log("🔄 Criando pagamento HorsePay...");
      console.log("- Pagador:", customer.name);
      console.log("- Valor recebido (centavos):", amount);
      console.log("- Valor enviado (reais):", amountInReais);
      console.log("- Telefone:", customer.phone);
      console.log("- Referência:", clientReferenceId);

      const paymentData: HorsePayPaymentRequest = {
        payer_name: customer.name,
        amount: amountInReais,
        callback_url: callbackUrl,
        client_reference_id:
          clientReferenceId ||
          `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phone: customer.phone,
      };

      console.log(
        "📤 Payload enviado para HorsePay:",
        JSON.stringify(paymentData, null, 2),
      );

      // Preparar UTM params para query string
      const queryParams: Record<string, string> = {};
      if (utmParams) {
        if (utmParams.utm_source) queryParams.utm_source = utmParams.utm_source;
        if (utmParams.utm_medium) queryParams.utm_medium = utmParams.utm_medium;
        if (utmParams.utm_campaign)
          queryParams.utm_campaign = utmParams.utm_campaign;
        if (utmParams.utm_term) queryParams.utm_term = utmParams.utm_term;
        if (utmParams.utm_content)
          queryParams.utm_content = utmParams.utm_content;
      }

      const response = await this.makeRequest<HorsePayPaymentResponse>(
        "/transaction/neworder",
        "POST",
        paymentData,
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
      );

      console.log("📥 Resposta HorsePay:", JSON.stringify(response, null, 2));
      console.log("✅ PIX gerado com sucesso - ID:", response.external_id);

      return response;
    } catch (error) {
      console.error("❌ Erro ao criar pagamento HorsePay:", error);
      return {
        error: true,
        message: "Erro ao gerar o PIX",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Consultar status de um depósito
   */
  static async getDepositStatus(
    depositId: string | number,
  ): Promise<HorsePayDepositStatus | HorsePayError> {
    try {
      console.log("🔍 Consultando status do depósito:", depositId);

      const response = await this.makeRequest<HorsePayDepositStatus>(
        `/api/orders/deposit/${depositId}`,
        "GET",
      );

      console.log("📊 Status do depósito:", response.status);

      return response;
    } catch (error) {
      console.error("❌ Erro ao consultar depósito:", error);
      return {
        error: true,
        message: "Erro ao verificar status do pagamento",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Consultar saldo da conta
   */
  static async getBalance(): Promise<HorsePayBalanceResponse | HorsePayError> {
    try {
      const response = await this.makeRequest<HorsePayBalanceResponse>(
        "/user/balance",
        "GET",
      );
      return response;
    } catch (error) {
      console.error("❌ Erro ao consultar saldo:", error);
      return {
        error: true,
        message: "Erro ao consultar saldo",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Solicitar saque via PIX
   * IMPORTANTE: O IP do servidor precisa estar autorizado no painel HorsePay
   */
  static async requestWithdraw(
    amount: number,
    pixKey: string,
    pixType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM",
    callbackUrl?: string,
    clientReferenceId?: string,
  ): Promise<any | HorsePayError> {
    try {
      console.log("💸 Solicitando saque HorsePay...");
      console.log("- Valor:", amount);
      console.log("- Chave PIX:", pixKey);
      console.log("- Tipo:", pixType);

      const withdrawData: HorsePayWithdrawRequest = {
        amount,
        pix_key: pixKey,
        pix_type: pixType,
        callback_url: callbackUrl,
        client_reference_id: clientReferenceId,
      };

      const response = await this.makeRequest<any>(
        "/transaction/withdraw",
        "POST",
        withdrawData,
      );

      console.log("✅ Saque solicitado - ID:", response.external_id);

      return response;
    } catch (error) {
      console.error("❌ Erro ao solicitar saque:", error);
      return {
        error: true,
        message: "Erro ao solicitar saque",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Consultar depósitos bloqueados
   */
  static async checkBlockedDeposit(
    depositId: string | number,
  ): Promise<any | HorsePayError> {
    try {
      const response = await this.makeRequest<any>(
        `/api/orders/checkmed/${depositId}`,
        "GET",
      );
      return response;
    } catch (error) {
      console.error("❌ Erro ao consultar depósito bloqueado:", error);
      return {
        error: true,
        message: "Erro ao consultar depósito bloqueado",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Verifica se o callback é de uma infração
   */
  static isInfractionCallback(
    callback: any,
  ): callback is HorsePayInfractionCallback {
    return "infraction_status" in callback;
  }

  /**
   * Formata valor de centavos para reais
   */
  static formatAmountFromCents(cents: number): number {
    return cents / 100;
  }

  /**
   * Formata valor de reais para centavos
   */
  static formatAmountToCents(reais: number): number {
    return Math.round(reais * 100);
  }
}
