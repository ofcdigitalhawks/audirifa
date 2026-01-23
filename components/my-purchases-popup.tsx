"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Ticket, Phone, Check, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MyPurchasesPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TicketData {
  ticket_number: number;
  formatted_number: string;
  customer_name: string;
  is_paid: boolean;
  status: string;
  amount: number;
  created_at: string;
  paid_at: string | null;
}

interface PurchasesResponse {
  success: boolean;
  phone: string;
  total: number;
  paid: number;
  pending: number;
  tickets: TicketData[];
  error?: string;
}

export default function MyPurchasesPopup({
  isOpen,
  onClose,
}: MyPurchasesPopupProps) {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [purchasesData, setPurchasesData] = useState<PurchasesResponse | null>(
    null,
  );
  const [filter, setFilter] = useState<"todos" | "pagos" | "pendentes">(
    "todos",
  );

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const limitedNumbers = numbers.slice(0, 11);

    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return limitedNumbers.replace(/(\d{2})(\d{0,4})/, "($1) $2");
    } else if (limitedNumbers.length <= 10) {
      return limitedNumbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else {
      return limitedNumbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }
  };

  const handleSearch = async () => {
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length < 10) {
      setPhoneError("Digite um telefone válido com DDD");
      return;
    }

    setPhoneError("");
    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/minhas-compras?phone=${encodeURIComponent(cleanPhone)}`,
      );
      const data = await response.json();

      if (data.success) {
        setPurchasesData(data);
      } else {
        setPhoneError(data.error || "Erro ao buscar");
        setPurchasesData(null);
      }
    } catch (error) {
      console.error("Erro ao buscar compras:", error);
      setPhoneError("Erro de conexão. Tente novamente.");
      setPurchasesData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPhone("");
    setPhoneError("");
    setHasSearched(false);
    setPurchasesData(null);
    setFilter("todos");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-900 rounded-2xl w-full max-w-md relative overflow-hidden border border-gray-800 shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-600 to-amber-500 p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Ticket className="w-6 h-6 text-black mr-2" />
                <h2 className="text-lg font-bold text-black">Minhas Compras</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-black/70 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Search Form */}
              <div className="mb-6">
                <label className="text-gray-300 text-sm font-medium mb-2 block">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Digite seu telefone para consultar
                </label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => {
                      setPhone(formatPhone(e.target.value));
                      setPhoneError("");
                    }}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500"
                    maxLength={15}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-4"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                {phoneError && (
                  <p className="text-red-400 text-xs mt-2">{phoneError}</p>
                )}
              </div>

              {/* Results */}
              {hasSearched && !isLoading && (
                <>
                  {purchasesData && purchasesData.tickets.length > 0 ? (
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 text-center border border-gray-700">
                          <div className="text-3xl font-bold text-white mb-1">
                            {purchasesData.total}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">
                            Total
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 rounded-lg p-4 text-center border border-green-700/50">
                          <div className="text-3xl font-bold text-green-400 mb-1">
                            {purchasesData.paid}
                          </div>
                          <div className="text-xs text-green-300 uppercase tracking-wide">
                            Pagos
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 rounded-lg p-4 text-center border border-yellow-700/50">
                          <div className="text-3xl font-bold text-yellow-400 mb-1">
                            {purchasesData.pending}
                          </div>
                          <div className="text-xs text-yellow-300 uppercase tracking-wide">
                            Pendentes
                          </div>
                        </div>
                      </div>

                      {/* Filtros */}
                      <div className="flex gap-2 mb-4">
                        <Button
                          onClick={() => setFilter("todos")}
                          className={`flex-1 py-2 text-sm font-medium transition-all ${
                            filter === "todos"
                              ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                          }`}
                        >
                          Todos ({purchasesData.total})
                        </Button>
                        <Button
                          onClick={() => setFilter("pagos")}
                          className={`flex-1 py-2 text-sm font-medium transition-all ${
                            filter === "pagos"
                              ? "bg-green-500 hover:bg-green-600 text-black"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                          }`}
                        >
                          Pagos ({purchasesData.paid})
                        </Button>
                        <Button
                          onClick={() => setFilter("pendentes")}
                          className={`flex-1 py-2 text-sm font-medium transition-all ${
                            filter === "pendentes"
                              ? "bg-yellow-600 hover:bg-yellow-700 text-black"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                          }`}
                        >
                          Pendentes ({purchasesData.pending})
                        </Button>
                      </div>

                      {/* Ticket List */}
                      <div>
                        <h3 className="text-gray-300 font-semibold mb-3 flex items-center">
                          <Ticket className="w-4 h-4 mr-2 text-yellow-500" />
                          Seus Números da Sorte
                        </h3>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                          {(() => {
                            const filteredTickets =
                              purchasesData.tickets.filter((ticket) => {
                                if (filter === "pagos") return ticket.is_paid;
                                if (filter === "pendentes")
                                  return !ticket.is_paid;
                                return true;
                              });

                            if (filteredTickets.length === 0) {
                              return (
                                <div className="text-center py-8">
                                  <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                  <p className="text-gray-400 text-sm">
                                    Nenhum bilhete{" "}
                                    {filter === "pagos"
                                      ? "pago"
                                      : filter === "pendentes"
                                        ? "pendente"
                                        : ""}{" "}
                                    encontrado
                                  </p>
                                </div>
                              );
                            }

                            return filteredTickets.map((ticket) => (
                              <div
                                key={ticket.ticket_number}
                                className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                                  ticket.is_paid
                                    ? "bg-gradient-to-r from-green-900/30 to-emerald-900/20 border-green-700/40"
                                    : "bg-gray-800/50 border-gray-700/50"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`text-black rounded-lg px-4 py-2 font-mono font-bold text-lg ${
                                      ticket.is_paid
                                        ? "bg-green-400"
                                        : "bg-yellow-500"
                                    }`}
                                  >
                                    {ticket.formatted_number}
                                  </div>
                                  <div>
                                    <div className="text-white font-medium text-sm">
                                      {ticket.customer_name}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-0.5">
                                      {ticket.created_at
                                        ? new Date(
                                            ticket.created_at,
                                          ).toLocaleString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "Data não disponível"}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {ticket.is_paid ? (
                                    <div className="flex flex-col items-end">
                                      <span className="flex items-center text-green-400 font-semibold text-sm mb-1">
                                        <Check className="w-4 h-4 mr-1" />
                                        PAGO
                                      </span>
                                      <span className="text-green-300 text-xs">
                                        R$ {(ticket.amount / 100).toFixed(2)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-end">
                                      <span className="flex items-center text-yellow-400 font-semibold text-sm mb-1">
                                        <Clock className="w-4 h-4 mr-1" />
                                        PENDENTE
                                      </span>
                                      <span className="text-yellow-300 text-xs">
                                        R$ {(ticket.amount / 100).toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="mt-5 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                        <p className="text-blue-300 text-xs text-center">
                          ℹ️ Apenas bilhetes{" "}
                          <span className="font-bold text-blue-400">PAGOS</span>{" "}
                          participam do sorteio
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        Nenhuma compra encontrada para este telefone
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Verifique se o número está correto
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Initial State */}
              {!hasSearched && !isLoading && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    Digite seu telefone acima para consultar seus bilhetes
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
