// Sistema de banco de dados usando Turso (libSQL)
import { createClient } from "@libsql/client";

// Verificar se as variáveis de ambiente estão configuradas
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error(
    "TURSO_DATABASE_URL e TURSO_AUTH_TOKEN devem estar configurados no arquivo .env.local",
  );
}

// Cliente Turso
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export interface PaymentRecord {
  id: string;
  payment_id: string;
  status: string;
  amount: number;
  customer_name?: string;
  customer_email?: string;
  customer_cpf?: string;
  customer_phone?: string;
  pix_code?: string;
  payment_method?: string;
  utm_source?: string;
  action: string;
  created_at: string;
  updated_at?: string;
}

export interface WebhookLog {
  id: string;
  payment_id: string;
  webhook_type: string;
  status: string;
  amount: number;
  end_to_end?: string;
  raw_payload: string;
  created_at: string;
}

// Inicializar tabela de pagamentos
async function initializeDatabase() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL,
        status TEXT NOT NULL,
        amount REAL NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        customer_cpf TEXT,
        customer_phone TEXT,
        pix_code TEXT,
        payment_method TEXT,
        utm_source TEXT,
        action TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT
      )
    `);

    // Criar índice para busca por payment_id
    await turso.execute(`
      CREATE INDEX IF NOT EXISTS idx_payment_id ON payments(payment_id)
    `);

    console.log("✅ Tabela payments inicializada no Turso");
  } catch (error) {
    console.error("❌ Erro ao inicializar tabela:", error);
  }
}

// Inicializar tabela de logs de webhook
async function initializeWebhookLogsTable() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL,
        webhook_type TEXT NOT NULL,
        status TEXT NOT NULL,
        amount REAL NOT NULL,
        end_to_end TEXT,
        raw_payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Criar índice para busca por payment_id
    await turso.execute(`
      CREATE INDEX IF NOT EXISTS idx_webhook_payment_id ON webhook_logs(payment_id)
    `);

    // Criar índice para busca por data
    await turso.execute(`
      CREATE INDEX IF NOT EXISTS idx_webhook_created_at ON webhook_logs(created_at)
    `);

    console.log("✅ Tabela webhook_logs inicializada no Turso");
  } catch (error) {
    console.error("❌ Erro ao inicializar tabela webhook_logs:", error);
  }
}

// Inicializar banco ao carregar o módulo
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

let webhookLogsInitialized = false;
async function ensureWebhookLogsInitialized() {
  if (!webhookLogsInitialized) {
    await initializeWebhookLogsTable();
    webhookLogsInitialized = true;
  }
}

export class Database {
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static async insert(
    record: Omit<PaymentRecord, "id" | "created_at">,
  ): Promise<string> {
    await ensureDbInitialized();

    const id = this.generateId();
    const createdAt = new Date().toISOString();

    try {
      await turso.execute({
        sql: `
          INSERT INTO payments (
            id, payment_id, status, amount, customer_name, customer_email,
            customer_cpf, customer_phone, pix_code, payment_method,
            utm_source, action, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          record.payment_id,
          record.status,
          record.amount,
          record.customer_name || null,
          record.customer_email || null,
          record.customer_cpf || null,
          record.customer_phone || null,
          record.pix_code || null,
          record.payment_method || null,
          record.utm_source || null,
          record.action,
          createdAt,
        ],
      });

      console.log(`💾 Registro salvo no Turso: ${id}`);
      return id;
    } catch (error) {
      console.error("❌ Erro ao inserir no Turso:", error);
      throw error;
    }
  }

  static async findByPaymentId(
    paymentId: string,
  ): Promise<PaymentRecord | null> {
    await ensureDbInitialized();

    try {
      const result = await turso.execute({
        sql: "SELECT * FROM payments WHERE payment_id = ? ORDER BY created_at DESC LIMIT 1",
        args: [paymentId],
      });

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id as string,
        payment_id: row.payment_id as string,
        status: row.status as string,
        amount: row.amount as number,
        customer_name: row.customer_name as string | undefined,
        customer_email: row.customer_email as string | undefined,
        customer_cpf: row.customer_cpf as string | undefined,
        customer_phone: row.customer_phone as string | undefined,
        pix_code: row.pix_code as string | undefined,
        payment_method: row.payment_method as string | undefined,
        utm_source: row.utm_source as string | undefined,
        action: row.action as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string | undefined,
      };
    } catch (error) {
      console.error("❌ Erro ao buscar no Turso:", error);
      return null;
    }
  }

  static async updateStatus(
    paymentId: string,
    status: string,
  ): Promise<boolean> {
    await ensureDbInitialized();

    try {
      const updatedAt = new Date().toISOString();

      const result = await turso.execute({
        sql: "UPDATE payments SET status = ?, updated_at = ? WHERE payment_id = ?",
        args: [status, updatedAt, paymentId],
      });

      const success = result.rowsAffected > 0;
      if (success) {
        console.log(`✅ Status atualizado no Turso: ${paymentId} -> ${status}`);
      }
      return success;
    } catch (error) {
      console.error("❌ Erro ao atualizar no Turso:", error);
      return false;
    }
  }

  static async getAll(): Promise<PaymentRecord[]> {
    await ensureDbInitialized();

    try {
      const result = await turso.execute(
        "SELECT * FROM payments ORDER BY created_at DESC",
      );

      return result.rows.map((row) => ({
        id: row.id as string,
        payment_id: row.payment_id as string,
        status: row.status as string,
        amount: row.amount as number,
        customer_name: row.customer_name as string | undefined,
        customer_email: row.customer_email as string | undefined,
        customer_cpf: row.customer_cpf as string | undefined,
        customer_phone: row.customer_phone as string | undefined,
        pix_code: row.pix_code as string | undefined,
        payment_method: row.payment_method as string | undefined,
        utm_source: row.utm_source as string | undefined,
        action: row.action as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string | undefined,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar todos no Turso:", error);
      return [];
    }
  }

  static async clearAll(): Promise<boolean> {
    await ensureDbInitialized();

    try {
      await turso.execute("DELETE FROM payments");
      console.log("🗑️ Todos os registros removidos do Turso");
      return true;
    } catch (error) {
      console.error("❌ Erro ao limpar Turso:", error);
      return false;
    }
  }

  // Alias para getAll (usado pelo admin panel)
  static async getAllPayments(): Promise<PaymentRecord[]> {
    return this.getAll();
  }

  // Método adicional para buscar por status
  static async findByStatus(status: string): Promise<PaymentRecord[]> {
    await ensureDbInitialized();

    try {
      const result = await turso.execute({
        sql: "SELECT * FROM payments WHERE status = ? ORDER BY created_at DESC",
        args: [status],
      });

      return result.rows.map((row) => ({
        id: row.id as string,
        payment_id: row.payment_id as string,
        status: row.status as string,
        amount: row.amount as number,
        customer_name: row.customer_name as string | undefined,
        customer_email: row.customer_email as string | undefined,
        customer_cpf: row.customer_cpf as string | undefined,
        customer_phone: row.customer_phone as string | undefined,
        pix_code: row.pix_code as string | undefined,
        payment_method: row.payment_method as string | undefined,
        utm_source: row.utm_source as string | undefined,
        action: row.action as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string | undefined,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar por status no Turso:", error);
      return [];
    }
  }

  // Método para contar pagamentos aprovados
  static async countApproved(): Promise<number> {
    await ensureDbInitialized();

    try {
      const result = await turso.execute(
        "SELECT COUNT(*) as count FROM payments WHERE status = 'APPROVED'",
      );
      return (result.rows[0]?.count as number) || 0;
    } catch (error) {
      console.error("❌ Erro ao contar aprovados no Turso:", error);
      return 0;
    }
  }

  // Método para calcular total de vendas aprovadas
  static async totalApprovedAmount(): Promise<number> {
    await ensureDbInitialized();

    try {
      const result = await turso.execute(
        "SELECT SUM(amount) as total FROM payments WHERE status = 'APPROVED'",
      );
      return (result.rows[0]?.total as number) || 0;
    } catch (error) {
      console.error("❌ Erro ao calcular total no Turso:", error);
      return 0;
    }
  }
}

// ==========================================
// SISTEMA DE SORTEIO - BILHETES
// ==========================================

export interface RaffleTicket {
  id: string;
  payment_id: string;
  ticket_number: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  amount_paid: number;
  is_paid: boolean;
  created_at: string;
  paid_at: string | null;
}

// Inicializar tabela de bilhetes
async function initializeRaffleTable() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS raffle_tickets (
        id TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL,
        ticket_number INTEGER NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_email TEXT,
        amount_paid REAL NOT NULL,
        is_paid INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        paid_at TEXT
      )
    `);

    // Criar índices
    await turso.execute(`
      CREATE INDEX IF NOT EXISTS idx_raffle_payment_id ON raffle_tickets(payment_id)
    `);
    await turso.execute(`
      CREATE INDEX IF NOT EXISTS idx_raffle_is_paid ON raffle_tickets(is_paid)
    `);
    await turso.execute(`
      CREATE INDEX IF NOT EXISTS idx_raffle_ticket_number ON raffle_tickets(ticket_number)
    `);

    console.log("✅ Tabela raffle_tickets inicializada no Turso");
  } catch (error) {
    console.error("❌ Erro ao inicializar tabela raffle_tickets:", error);
  }
}

let raffleTableInitialized = false;
async function ensureRaffleTableInitialized() {
  if (!raffleTableInitialized) {
    await initializeRaffleTable();
    raffleTableInitialized = true;
  }
}

export class RaffleDatabase {
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Obtém o próximo número de bilhete disponível
   */
  static async getNextTicketNumber(): Promise<number> {
    await ensureRaffleTableInitialized();

    try {
      const result = await turso.execute(
        "SELECT MAX(ticket_number) as max_num FROM raffle_tickets",
      );
      const maxNum = (result.rows[0]?.max_num as number) || 0;
      return maxNum + 1;
    } catch (error) {
      console.error("❌ Erro ao obter próximo número:", error);
      return 1;
    }
  }

  /**
   * Cria múltiplos bilhetes para um pagamento
   */
  static async createTickets(
    paymentId: string,
    quantity: number,
    customerName: string,
    customerPhone: string,
    customerEmail: string,
    amountPaid: number,
  ): Promise<number[]> {
    await ensureRaffleTableInitialized();

    const ticketNumbers: number[] = [];
    const createdAt = new Date().toISOString();

    try {
      // Obter o próximo número disponível
      let nextNumber = await this.getNextTicketNumber();

      for (let i = 0; i < quantity; i++) {
        const id = this.generateId();
        const ticketNumber = nextNumber + i;

        await turso.execute({
          sql: `
            INSERT INTO raffle_tickets (
              id, payment_id, ticket_number, customer_name, customer_phone,
              customer_email, amount_paid, is_paid, created_at, paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NULL)
          `,
          args: [
            id,
            paymentId,
            ticketNumber,
            customerName,
            customerPhone || null,
            customerEmail || null,
            amountPaid / quantity, // Valor por bilhete
            createdAt,
          ],
        });

        ticketNumbers.push(ticketNumber);
      }

      console.log(
        `🎟️ ${quantity} bilhetes criados para pagamento ${paymentId}:`,
        ticketNumbers,
      );
      return ticketNumbers;
    } catch (error) {
      console.error("❌ Erro ao criar bilhetes:", error);
      return [];
    }
  }

  /**
   * Marca bilhetes como pagos quando o webhook confirma
   */
  static async markTicketsAsPaid(paymentId: string): Promise<boolean> {
    await ensureRaffleTableInitialized();

    try {
      const paidAt = new Date().toISOString();

      const result = await turso.execute({
        sql: "UPDATE raffle_tickets SET is_paid = 1, paid_at = ? WHERE payment_id = ?",
        args: [paidAt, paymentId],
      });

      const success = result.rowsAffected > 0;
      if (success) {
        console.log(
          `✅ ${result.rowsAffected} bilhetes marcados como PAGOS para ${paymentId}`,
        );
      }
      return success;
    } catch (error) {
      console.error("❌ Erro ao marcar bilhetes como pagos:", error);
      return false;
    }
  }

  /**
   * Busca bilhetes por ID de pagamento
   */
  static async getTicketsByPaymentId(
    paymentId: string,
  ): Promise<RaffleTicket[]> {
    await ensureRaffleTableInitialized();

    try {
      const result = await turso.execute({
        sql: "SELECT * FROM raffle_tickets WHERE payment_id = ? ORDER BY ticket_number",
        args: [paymentId],
      });

      return result.rows.map((row) => ({
        id: row.id as string,
        payment_id: row.payment_id as string,
        ticket_number: row.ticket_number as number,
        customer_name: row.customer_name as string,
        customer_phone: row.customer_phone as string,
        customer_email: row.customer_email as string,
        amount_paid: row.amount_paid as number,
        is_paid: (row.is_paid as number) === 1,
        created_at: row.created_at as string,
        paid_at: row.paid_at as string | null,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar bilhetes:", error);
      return [];
    }
  }

  /**
   * Retorna apenas bilhetes pagos (elegíveis para sorteio)
   */
  static async getPaidTickets(): Promise<RaffleTicket[]> {
    await ensureRaffleTableInitialized();

    try {
      const result = await turso.execute(
        "SELECT * FROM raffle_tickets WHERE is_paid = 1 ORDER BY ticket_number",
      );

      return result.rows.map((row) => ({
        id: row.id as string,
        payment_id: row.payment_id as string,
        ticket_number: row.ticket_number as number,
        customer_name: row.customer_name as string,
        customer_phone: row.customer_phone as string,
        customer_email: row.customer_email as string,
        amount_paid: row.amount_paid as number,
        is_paid: true,
        created_at: row.created_at as string,
        paid_at: row.paid_at as string | null,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar bilhetes pagos:", error);
      return [];
    }
  }

  /**
   * Retorna todos os bilhetes (pagos e não pagos)
   */
  static async getAllTickets(): Promise<RaffleTicket[]> {
    await ensureRaffleTableInitialized();

    try {
      const result = await turso.execute(
        "SELECT * FROM raffle_tickets ORDER BY ticket_number",
      );

      return result.rows.map((row) => ({
        id: row.id as string,
        payment_id: row.payment_id as string,
        ticket_number: row.ticket_number as number,
        customer_name: row.customer_name as string,
        customer_phone: row.customer_phone as string,
        customer_email: row.customer_email as string,
        amount_paid: row.amount_paid as number,
        is_paid: (row.is_paid as number) === 1,
        created_at: row.created_at as string,
        paid_at: row.paid_at as string | null,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar todos os bilhetes:", error);
      return [];
    }
  }

  /**
   * Realiza o sorteio entre os bilhetes pagos
   */
  static async drawWinner(): Promise<RaffleTicket | null> {
    await ensureRaffleTableInitialized();

    try {
      const paidTickets = await this.getPaidTickets();

      if (paidTickets.length === 0) {
        console.log("⚠️ Nenhum bilhete pago para sortear");
        return null;
      }

      // Sortear aleatoriamente
      const randomIndex = Math.floor(Math.random() * paidTickets.length);
      const winner = paidTickets[randomIndex];

      console.log(
        `🎉 VENCEDOR SORTEADO: Bilhete #${winner.ticket_number} - ${winner.customer_name}`,
      );

      return winner;
    } catch (error) {
      console.error("❌ Erro ao sortear vencedor:", error);
      return null;
    }
  }

  /**
   * Conta bilhetes por status
   */
  static async countTickets(): Promise<{
    total: number;
    paid: number;
    unpaid: number;
  }> {
    await ensureRaffleTableInitialized();

    try {
      const totalResult = await turso.execute(
        "SELECT COUNT(*) as count FROM raffle_tickets",
      );
      const paidResult = await turso.execute(
        "SELECT COUNT(*) as count FROM raffle_tickets WHERE is_paid = 1",
      );

      const total = (totalResult.rows[0]?.count as number) || 0;
      const paid = (paidResult.rows[0]?.count as number) || 0;

      return {
        total,
        paid,
        unpaid: total - paid,
      };
    } catch (error) {
      console.error("❌ Erro ao contar bilhetes:", error);
      return { total: 0, paid: 0, unpaid: 0 };
    }
  }
}

/**
 * Classe para gerenciar logs de webhook
 */
export class WebhookLogger {
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Registra um webhook recebido
   */
  static async logWebhook(
    paymentId: string,
    webhookType: string,
    status: string,
    amount: number,
    rawPayload: any,
    endToEnd?: string,
  ): Promise<boolean> {
    await ensureWebhookLogsInitialized();

    try {
      const id = this.generateId();
      const createdAt = new Date().toISOString();

      await turso.execute({
        sql: `
          INSERT INTO webhook_logs (
            id, payment_id, webhook_type, status, amount, 
            end_to_end, raw_payload, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          paymentId,
          webhookType,
          status,
          amount,
          endToEnd || null,
          JSON.stringify(rawPayload),
          createdAt,
        ],
      });

      console.log(`📝 Webhook registrado: ${webhookType} - ${paymentId}`);
      return true;
    } catch (error) {
      console.error("❌ Erro ao registrar webhook:", error);
      return false;
    }
  }

  /**
   * Busca logs de webhook por payment_id
   */
  static async getLogsByPaymentId(paymentId: string): Promise<WebhookLog[]> {
    await ensureWebhookLogsInitialized();

    try {
      const result = await turso.execute({
        sql: "SELECT * FROM webhook_logs WHERE payment_id = ? ORDER BY created_at DESC",
        args: [paymentId],
      });

      return result.rows.map((row) => ({
        id: row.id as string,
        payment_id: row.payment_id as string,
        webhook_type: row.webhook_type as string,
        status: row.status as string,
        amount: row.amount as number,
        end_to_end: row.end_to_end as string | undefined,
        raw_payload: row.raw_payload as string,
        created_at: row.created_at as string,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar logs de webhook:", error);
      return [];
    }
  }

  /**
   * Busca todos os logs de webhook
   */
  static async getAllLogs(limit: number = 100): Promise<WebhookLog[]> {
    await ensureWebhookLogsInitialized();

    try {
      const result = await turso.execute({
        sql: "SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT ?",
        args: [limit],
      });

      return result.rows.map((row) => ({
        id: row.id as string,
        payment_id: row.payment_id as string,
        webhook_type: row.webhook_type as string,
        status: row.status as string,
        amount: row.amount as number,
        end_to_end: row.end_to_end as string | undefined,
        raw_payload: row.raw_payload as string,
        created_at: row.created_at as string,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar todos os logs de webhook:", error);
      return [];
    }
  }

  /**
   * Conta quantos webhooks foram recebidos para um payment_id
   */
  static async countWebhooksByPaymentId(paymentId: string): Promise<number> {
    await ensureWebhookLogsInitialized();

    try {
      const result = await turso.execute({
        sql: "SELECT COUNT(*) as count FROM webhook_logs WHERE payment_id = ?",
        args: [paymentId],
      });

      return (result.rows[0]?.count as number) || 0;
    } catch (error) {
      console.error("❌ Erro ao contar webhooks:", error);
      return 0;
    }
  }
}
