"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  Users,
  Ticket,
  DollarSign,
  TrendingUp,
  Search,
  Download,
  Shuffle,
  Trophy,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface TicketData {
  id: string;
  ticket_number: number;
  payment_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  amount_paid: number;
  is_paid: boolean;
  created_at: string;
  paid_at: string | null;
}

interface PaymentData {
  id: string;
  payment_id: string;
  status: string;
  amount: number;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

interface StatsData {
  totalTickets: number;
  paidTickets: number;
  pendingTickets: number;
  totalRevenue: number;
  uniqueCustomers: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "tickets" | "payments" | "sorteio"
  >("dashboard");
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalTickets: 0,
    paidTickets: 0,
    pendingTickets: 0,
    totalRevenue: 0,
    uniqueCustomers: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">(
    "all",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnTicket, setDrawnTicket] = useState<TicketData | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setPassword("");
        // loadData() será chamado automaticamente pelo useEffect
      } else {
        setLoginError("Senha incorreta!");
        setPassword("");
      }
    } catch (error) {
      setLoginError("Erro ao validar senha. Tente novamente.");
      console.error("Erro no login:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Cache-buster para garantir dados frescos
      const timestamp = Date.now();

      // Buscar todos os bilhetes
      console.log("🔄 Carregando bilhetes...");
      const ticketsRes = await fetch(`/api/admin/tickets?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const ticketsData = await ticketsRes.json();
      console.log("📊 Resposta bilhetes:", ticketsData);

      if (ticketsData.success) {
        setTickets(ticketsData.tickets);
        calculateStats(ticketsData.tickets);
        console.log(`✅ ${ticketsData.tickets.length} bilhetes carregados`);
      } else {
        console.error("❌ Erro ao buscar bilhetes:", ticketsData.error);
      }

      // Buscar todos os pagamentos
      console.log("🔄 Carregando pagamentos...");
      const paymentsRes = await fetch(`/api/admin/payments?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const paymentsData = await paymentsRes.json();
      console.log("📊 Resposta pagamentos:", paymentsData);

      if (paymentsData.success) {
        setPayments(paymentsData.payments);
        console.log(`✅ ${paymentsData.payments.length} pagamentos carregados`);
      } else {
        console.error("❌ Erro ao buscar pagamentos:", paymentsData.error);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (ticketsData: TicketData[]) => {
    const paid = ticketsData.filter((t) => t.is_paid);
    const pending = ticketsData.filter((t) => !t.is_paid);
    const totalRevenue = paid.reduce((sum, t) => sum + t.amount_paid, 0);
    const uniqueCustomers = new Set(ticketsData.map((t) => t.customer_phone))
      .size;

    const newStats = {
      totalTickets: ticketsData.length,
      paidTickets: paid.length,
      pendingTickets: pending.length,
      totalRevenue,
      uniqueCustomers,
    };

    console.log("📈 Stats calculadas:", newStats);
    setStats(newStats);
  };

  // Carregar dados quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const performDraw = () => {
    const paidTickets = tickets.filter((t) => t.is_paid);

    if (paidTickets.length === 0) {
      alert("Não há bilhetes pagos para sortear!");
      return;
    }

    setIsDrawing(true);

    // Animação de sorteio
    let currentIndex = 0;
    const drawInterval = setInterval(() => {
      currentIndex = Math.floor(Math.random() * paidTickets.length);
      setDrawnTicket(paidTickets[currentIndex]);
    }, 100);

    // Parar após 3 segundos e escolher o vencedor final
    setTimeout(() => {
      clearInterval(drawInterval);
      const winner =
        paidTickets[Math.floor(Math.random() * paidTickets.length)];
      setDrawnTicket(winner);
      setIsDrawing(false);
    }, 3000);
  };

  const exportToCSV = () => {
    const csvData = tickets.map((t) => ({
      Número: t.ticket_number.toString().padStart(6, "0"),
      Nome: t.customer_name,
      Telefone: t.customer_phone,
      Email: t.customer_email,
      Valor: (t.amount_paid / 100).toFixed(2),
      Status: t.is_paid ? "PAGO" : "PENDENTE",
      "Data Criação": new Date(t.created_at).toLocaleString("pt-BR"),
      "Data Pagamento": t.paid_at
        ? new Date(t.paid_at).toLocaleString("pt-BR")
        : "-",
    }));

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(",")).join("\n");
    const csv = headers + "\n" + rows;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bilhetes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer_phone.includes(searchTerm) ||
      ticket.ticket_number.toString().includes(searchTerm);

    const matchesFilter =
      filterStatus === "all"
        ? true
        : filterStatus === "paid"
          ? ticket.is_paid
          : !ticket.is_paid;

    return matchesSearch && matchesFilter;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900 rounded-2xl w-full max-w-md p-8 border border-gray-800"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={40} className="text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Área Administrativa
            </h1>
            <p className="text-gray-400 text-sm">Digite a senha para acessar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha de administrador"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError("");
                }}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {loginError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm"
              >
                {loginError}
              </motion.p>
            )}

            <Button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3"
            >
              Entrar
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-[#1e1e1e] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="PIX DO MILHÃO"
                width={120}
                height={24}
                className="object-contain"
              />
              <span className="text-yellow-500 font-bold text-sm bg-yellow-500/10 px-3 py-1 rounded-full">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={loadData}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={16}
                  className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Carregando..." : "Atualizar"}
              </Button>
              <Button
                onClick={() => setIsAuthenticated(false)}
                variant="outline"
                size="sm"
                className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 rounded-lg p-4 border border-blue-700/50">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="text-blue-400" size={24} />
              <TrendingUp className="text-blue-400" size={16} />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.totalTickets}
            </div>
            <div className="text-xs text-blue-300">Total de Bilhetes</div>
          </div>

          <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 rounded-lg p-4 border border-green-700/50">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.paidTickets}
            </div>
            <div className="text-xs text-green-300">Bilhetes Pagos</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 rounded-lg p-4 border border-yellow-700/50">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-400" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.pendingTickets}
            </div>
            <div className="text-xs text-yellow-300">Pendentes</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/20 rounded-lg p-4 border border-emerald-700/50">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-emerald-400" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">
              R$ {(stats.totalRevenue / 100).toFixed(2)}
            </div>
            <div className="text-xs text-emerald-300">Receita Total</div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 rounded-lg p-4 border border-purple-700/50">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-purple-400" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.uniqueCustomers}
            </div>
            <div className="text-xs text-purple-300">Clientes Únicos</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === "dashboard"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === "tickets"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Bilhetes ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === "payments"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Pagamentos ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab("sorteio")}
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === "sorteio"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Trophy size={16} className="inline mr-2" />
            Realizar Sorteio
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4">
                  Últimos Bilhetes Pagos
                </h2>
                <div className="space-y-2">
                  {tickets
                    .filter((t) => t.is_paid)
                    .slice(0, 10)
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500 text-black font-mono font-bold px-3 py-1 rounded">
                            {ticket.ticket_number.toString().padStart(6, "0")}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {ticket.customer_name}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {ticket.customer_phone}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-semibold">
                            R$ {(ticket.amount_paid / 100).toFixed(2)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {ticket.paid_at
                              ? new Date(ticket.paid_at).toLocaleString("pt-BR")
                              : "-"}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "tickets" && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <Input
                      placeholder="Buscar por nome, telefone ou número..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setFilterStatus("all")}
                      variant={filterStatus === "all" ? "default" : "outline"}
                      className={
                        filterStatus === "all"
                          ? "bg-yellow-500 text-black"
                          : "bg-gray-800 border-gray-700"
                      }
                    >
                      Todos
                    </Button>
                    <Button
                      onClick={() => setFilterStatus("paid")}
                      variant={filterStatus === "paid" ? "default" : "outline"}
                      className={
                        filterStatus === "paid"
                          ? "bg-green-500 text-black"
                          : "bg-gray-800 border-gray-700"
                      }
                    >
                      Pagos
                    </Button>
                    <Button
                      onClick={() => setFilterStatus("pending")}
                      variant={
                        filterStatus === "pending" ? "default" : "outline"
                      }
                      className={
                        filterStatus === "pending"
                          ? "bg-yellow-600 text-black"
                          : "bg-gray-800 border-gray-700"
                      }
                    >
                      Pendentes
                    </Button>
                    <Button
                      onClick={exportToCSV}
                      variant="outline"
                      className="bg-gray-800 border-gray-700"
                    >
                      <Download size={16} className="mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-3 text-gray-400 font-semibold">
                          Número
                        </th>
                        <th className="text-left p-3 text-gray-400 font-semibold">
                          Cliente
                        </th>
                        <th className="text-left p-3 text-gray-400 font-semibold">
                          Contato
                        </th>
                        <th className="text-left p-3 text-gray-400 font-semibold">
                          Valor
                        </th>
                        <th className="text-left p-3 text-gray-400 font-semibold">
                          Status
                        </th>
                        <th className="text-left p-3 text-gray-400 font-semibold">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center p-8 text-gray-400"
                          >
                            Carregando dados...
                          </td>
                        </tr>
                      ) : filteredTickets.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center p-8 text-gray-400"
                          >
                            {tickets.length === 0
                              ? "Nenhum bilhete encontrado no banco de dados"
                              : "Nenhum bilhete encontrado com os filtros aplicados"}
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map((ticket) => (
                          <tr
                            key={ticket.id}
                            className="border-b border-gray-800 hover:bg-gray-800/50"
                          >
                            <td className="p-3">
                              <span
                                className={`font-mono font-bold px-3 py-1 rounded ${
                                  ticket.is_paid
                                    ? "bg-green-500 text-black"
                                    : "bg-yellow-500 text-black"
                                }`}
                              >
                                {ticket.ticket_number
                                  .toString()
                                  .padStart(6, "0")}
                              </span>
                            </td>
                            <td className="p-3 text-white">
                              {ticket.customer_name}
                            </td>
                            <td className="p-3">
                              <div className="text-gray-300 text-sm">
                                {ticket.customer_phone}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {ticket.customer_email}
                              </div>
                            </td>
                            <td className="p-3 text-white font-semibold">
                              R$ {(ticket.amount_paid / 100).toFixed(2)}
                            </td>
                            <td className="p-3">
                              {ticket.is_paid ? (
                                <span className="flex items-center text-green-400 text-sm">
                                  <CheckCircle size={16} className="mr-1" />
                                  PAGO
                                </span>
                              ) : (
                                <span className="flex items-center text-yellow-400 text-sm">
                                  <Clock size={16} className="mr-1" />
                                  PENDENTE
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-gray-400 text-sm">
                              {new Date(ticket.created_at).toLocaleDateString(
                                "pt-BR",
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4">
                  Histórico de Pagamentos
                </h2>
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center p-8 text-gray-400">
                      Carregando pagamentos...
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center p-8 text-gray-400">
                      Nenhum pagamento encontrado
                    </div>
                  ) : (
                    payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                      >
                        <div>
                          <div className="text-white font-medium">
                            {payment.customer_name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {payment.customer_phone}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            ID: {payment.payment_id}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              payment.status === "APPROVED"
                                ? "text-green-400"
                                : "text-yellow-400"
                            }`}
                          >
                            R$ {(payment.amount / 100).toFixed(2)}
                          </div>
                          <div
                            className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                              payment.status === "APPROVED"
                                ? "bg-green-900/30 text-green-400"
                                : "bg-yellow-900/30 text-yellow-400"
                            }`}
                          >
                            {payment.status}
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            {new Date(payment.created_at).toLocaleString(
                              "pt-BR",
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "sorteio" && (
            <motion.div
              key="sorteio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 rounded-lg p-8 border border-yellow-700/50 text-center">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Realizar Sorteio</h2>
                <p className="text-gray-400 mb-6">
                  {stats.paidTickets} bilhetes pagos elegíveis para o sorteio
                </p>

                {drawnTicket && !isDrawing && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-2 border-green-500 rounded-lg p-6 mb-6"
                  >
                    <div className="text-yellow-500 text-sm mb-2">
                      🎉 BILHETE SORTEADO 🎉
                    </div>
                    <div className="text-6xl font-mono font-bold text-white mb-4">
                      {drawnTicket.ticket_number.toString().padStart(6, "0")}
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">
                      {drawnTicket.customer_name}
                    </div>
                    <div className="text-gray-300">
                      {drawnTicket.customer_phone}
                    </div>
                    <div className="text-gray-400 text-sm mt-2">
                      {drawnTicket.customer_email}
                    </div>
                  </motion.div>
                )}

                {isDrawing && drawnTicket && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="bg-gray-800 rounded-lg p-6 mb-6"
                  >
                    <div className="text-yellow-500 text-sm mb-2">
                      SORTEANDO...
                    </div>
                    <div className="text-6xl font-mono font-bold text-white">
                      {drawnTicket.ticket_number.toString().padStart(6, "0")}
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={performDraw}
                  disabled={isDrawing || stats.paidTickets === 0}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shuffle size={24} className="mr-2" />
                  {isDrawing ? "Sorteando..." : "Sortear Bilhete Vencedor"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
