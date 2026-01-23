"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  Clock,
  AlertCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useUrlParams } from "@/hooks/use-url-params";

interface CheckoutPopupProps {
  isOpen: boolean;
  onClose: () => void;
  quantity: number;
  totalPrice: string;
}

export default function CheckoutPopup({
  isOpen,
  onClose,
  quantity,
  totalPrice,
}: CheckoutPopupProps) {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: "",
    phone: "",
  });
  const [orderBump, setOrderBump] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentCheckInterval, setPaymentCheckInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(577); // 9:37 em segundos
  const [phoneError, setPhoneError] = useState("");

  const { redirectWithParams } = useUrlParams();

  const transactionId = "62767";

  const [pixData, setPixData] = useState<any>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  // Função para formatar telefone (máscara)
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");

    // Limite de 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);

    // Aplica a máscara conforme o tamanho
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

  // Função para validar telefone brasileiro
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, "");

    // Deve ter 10 ou 11 dígitos
    if (numbers.length < 10 || numbers.length > 11) {
      return "Telefone deve ter 10 ou 11 dígitos";
    }

    // Primeiro dígito deve ser 1-9
    if (numbers[0] === "0") {
      return "DDD não pode começar com 0";
    }

    // Se tem 11 dígitos, o terceiro deve ser 9 (celular)
    if (numbers.length === 11 && numbers[2] !== "9") {
      return "Celular deve ter 9 como terceiro dígito";
    }

    // Se tem 10 dígitos, o terceiro não pode ser 9 (fixo)
    if (numbers.length === 10 && numbers[2] === "9") {
      return "Telefone fixo não pode ter 9 como terceiro dígito";
    }

    return "";
  };

  // Função para limpar telefone (apenas números)
  const cleanPhone = (phone: string) => {
    return phone.replace(/\D/g, "");
  };

  // Função para resetar todos os estados ao fechar
  const handleClose = () => {
    // Limpar intervalo de verificação de pagamento
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
      setPaymentCheckInterval(null);
    }

    // Resetar todos os estados
    setStep(1);
    setUserData({ name: "", phone: "" });
    setOrderBump(false);
    setPixCopied(false);
    setPaymentConfirmed(false);
    setTimeLeft(577);
    setPhoneError("");
    setPixData(null);
    setIsGeneratingPix(false);

    // Chamar a função onClose do componente pai
    onClose();
  };

  // Timer para contagem regressiva
  useEffect(() => {
    if (step === 3 && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  // Formatar tempo restante
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleContinue = () => {
    if (!userData.name.trim()) {
      alert("Por favor, informe seu nome completo");
      return;
    }

    const phoneValidation = validatePhone(userData.phone);
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return;
    }

    setPhoneError("");
    setStep(2);
  };

  const handleGeneratePix = async () => {
    // Prevenir múltiplas chamadas
    if (isGeneratingPix) {
      console.warn(
        "⚠️ Geração de PIX já em andamento, ignorando clique duplicado",
      );
      return;
    }

    setIsGeneratingPix(true);
    console.log("🚀 Iniciando geração de PIX...");

    try {
      let finalAmount = orderBump
        ? Number.parseFloat(totalPrice) + 9.9
        : Number.parseFloat(totalPrice);

      const amount = Math.round(finalAmount * 100); // Converte para centavos

      // Calcular quantidade total de números
      // Se tiver order bump, adiciona 20 números
      const additionalTickets = orderBump ? 20 : 0;
      const totalQuantity = quantity + additionalTickets;

      console.log("💳 DETALHES DA COMPRA:");
      console.log("- Quantidade base:", quantity);
      console.log("- Order Bump ativo?", orderBump);
      console.log("- Números adicionais (Order Bump):", additionalTickets);
      console.log("- Quantidade TOTAL:", totalQuantity);
      console.log("- Preço base:", totalPrice);
      console.log("- Preço Order Bump:", orderBump ? "R$ 9,90" : "R$ 0,00");
      console.log("- Preço FINAL:", finalAmount);
      console.log("- Valor em centavos:", amount);

      // Capturar UTMs do localStorage ou da URL atual
      let utmData = {};
      try {
        // Recuperar dados UTM do localStorage
        let utmData = {};
        try {
          const storedUTMs = localStorage.getItem("utmData");
          if (storedUTMs) {
            utmData = JSON.parse(storedUTMs);
          } else {
            // Fallback: capturar da URL atual
            const urlParams = new URLSearchParams(window.location.search);
            utmData = {
              utm_source: urlParams.get("utm_source") || "",
              utm_medium: urlParams.get("utm_medium") || "",
              utm_campaign: urlParams.get("utm_campaign") || "",
              utm_term: urlParams.get("utm_term") || "",
              utm_content: urlParams.get("utm_content") || "",
              click_id: urlParams.get("click_id") || "",
              CampaignID: urlParams.get("CampaignID") || "",
              CreativeID: urlParams.get("CreativeID") || "",
            };
          }
        } catch (error) {
          console.error("Error parsing UTM data:", error);
          utmData = {};
        }

        console.log("Sending UTM data to API:", utmData);

        console.log("Dados enviados para API:", {
          nome: userData.name,
          telefone: cleanPhone(userData.phone),
          amount: amount,
        });

        const response = await fetch("/api/gerar-pix", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: userData.name,
            telefone: cleanPhone(userData.phone),
            amount: amount,
            quantity: totalQuantity, // Enviar quantidade total explícita
            utm_source: (utmData as any).utm_source || "",
            utm_medium: (utmData as any).utm_medium || "",
            utm_campaign: (utmData as any).utm_campaign || "",
            utm_term: (utmData as any).utm_term || "",
            utm_content: (utmData as any).utm_content || "",
            click_id: (utmData as any).click_id || "",
            CampaignID: (utmData as any).CampaignID || "",
            CreativeID: (utmData as any).CreativeID || "",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.erro) {
          alert(result.mensagem);
          return;
        }

        console.log("PIX gerado com sucesso:", result);
        console.log(
          "Estrutura completa da resposta:",
          JSON.stringify(result, null, 2),
        );
        setPixData(result);
        setStep(3);

        // Usar transaction_id que é o que a API retorna
        const transactionHash =
          result.transaction_id || result.hash || result.id;
        console.log("Transaction Hash extraído:", transactionHash);

        if (transactionHash) {
          startPaymentCheck(transactionHash);
        } else {
          console.error(
            "❌ Nenhum hash encontrado na resposta:",
            Object.keys(result),
          );
        }
      } catch (error) {
        alert(`Erro ao gerar PIX: ${error}`);
      } finally {
        setIsGeneratingPix(false);
      }
    } catch (error) {
      console.error("Erro ao gerar PIX:", error);
      alert("Erro ao gerar PIX. Tente novamente.");
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const startPaymentCheck = (transactionHash: string) => {
    let attempts = 0;

    const checkPayment = async () => {
      attempts++;
      console.log(
        `🔄 Verificando status do pagamento (tentativa ${attempts}/48)...`,
      );

      try {
        const response = await fetch(
          `/api/verificar-status?hash=${transactionHash}`,
        );

        if (!response.ok) {
          console.error("❌ Erro HTTP:", response.status, response.statusText);
          return;
        }

        const paymentData = await response.json();
        console.log(
          "📦 Resposta completa da API:",
          JSON.stringify(paymentData, null, 2),
        );

        // Check different possible status fields
        const status =
          paymentData.payment_status ||
          paymentData.status ||
          paymentData.approved;
        console.log("📌 Status recebido da API:", status);
        console.log("📌 Campos disponíveis:", Object.keys(paymentData));

        // Multiple checks for paid status
        const isPaid =
          status === "paid" ||
          status === "approved" ||
          status === "APPROVED" ||
          paymentData.approved === true ||
          paymentData.payment_status === "paid";

        if (isPaid) {
          console.log("✅ Pagamento confirmado!");

          if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval);
          }

          setPaymentConfirmed(true);
        }

        if (attempts >= 48) {
          console.warn(
            "⏱️ Tempo limite atingido. Parando verificação automática.",
          );
          if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval);
          }
        }
      } catch (error) {
        console.error("❌ Erro ao verificar status da transação:", error);
      }
    };

    const interval = setInterval(checkPayment, 5000);
    setPaymentCheckInterval(interval);
  };

  const finalPrice = orderBump
    ? (Number.parseFloat(totalPrice) + 9.9).toFixed(2)
    : totalPrice;

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
            className="bg-gray-900 rounded-2xl w-full max-w-md relative overflow-hidden border border-gray-800 shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Gradiente decorativo no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500"></div>

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 bg-gray-800/50 p-1.5 rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            {/* Indicador de progresso */}
            <div className="flex justify-between px-6 pt-6 pb-2 flex-shrink-0">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1
                      ${
                        s < step
                          ? "bg-green-500 text-white"
                          : s === step
                            ? "bg-yellow-500 text-black"
                            : "bg-gray-700 text-gray-400"
                      }`}
                  >
                    {s < step ? <Check size={16} /> : s}
                  </div>
                  <div
                    className={`text-xs ${s <= step ? "text-gray-300" : "text-gray-500"}`}
                  >
                    {s === 1 ? "Dados" : s === 2 ? "Detalhes" : "Pagamento"}
                  </div>
                </div>
              ))}
            </div>

            {/* Container com scroll para o conteúdo */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <h2 className="text-xl font-bold mb-6 text-white flex items-center">
                      <Smartphone className="mr-2 text-yellow-400" size={20} />
                      Informe Seus Dados
                    </h2>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium">
                          Nome completo
                        </label>
                        <Input
                          type="text"
                          placeholder="Digite seu nome completo"
                          value={userData.name}
                          onChange={(e) =>
                            setUserData({ ...userData, name: e.target.value })
                          }
                          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium">
                          Telefone
                        </label>
                        <Input
                          type="tel"
                          placeholder="(48) 98826-0020"
                          value={userData.phone}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            setUserData({ ...userData, phone: formatted });

                            // Limpar erro quando usuário digitar
                            if (phoneError) {
                              setPhoneError("");
                            }
                          }}
                          className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500 ${
                            phoneError
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : ""
                          }`}
                          maxLength={15}
                        />
                        {phoneError && (
                          <p className="text-red-400 text-xs mt-1 flex items-center">
                            <AlertCircle size={12} className="mr-1" />
                            {phoneError}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleContinue}
                        disabled={
                          !userData.name.trim() ||
                          !userData.phone ||
                          validatePhone(userData.phone) !== ""
                        }
                        className="w-full bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-700 hover:to-amber-600 text-black py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continuar
                        <ChevronRight
                          size={18}
                          className="ml-1 group-hover:translate-x-1 transition-transform"
                        />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <div className="flex items-center mb-6 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <div className="h-12 w-12 relative mr-3 rounded-lg overflow-hidden">
                        <Image
                          src="/images/logo.png"
                          alt="PIX DO MILHÃO"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">
                          PIX DO MILHÃO M486.822
                        </h3>
                        <p className="text-xs text-gray-400">
                          EDIÇÃO: 05 - VERSÃO 2
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-lg mb-5 border border-gray-700">
                      <h4 className="font-bold text-white mb-3 flex items-center">
                        <CreditCard
                          className="mr-2 text-yellow-400"
                          size={18}
                        />
                        Detalhes da sua compra
                      </h4>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                          <span className="text-gray-300">Nome:</span>
                          <span className="font-medium text-white">
                            {userData.name.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Transação:</span>
                          <span className="font-medium text-white">
                            {transactionId}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Telefone:</span>
                          <span className="font-medium text-white">
                            {userData.phone}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Data/Hora:</span>
                          <span className="font-medium text-white">
                            {new Date().toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Quantidade:</span>
                          <span className="font-medium text-white">
                            {orderBump
                              ? `${quantity} + 20 = ${quantity + 20}`
                              : quantity}{" "}
                            Cota(s)
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                          <span className="text-gray-300">Valor:</span>
                          <span className="font-bold text-green-400">
                            R$ {finalPrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-700/30 rounded-lg p-4 mb-5">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={orderBump}
                          onChange={(e) => setOrderBump(e.target.checked)}
                          className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-amber-200">
                            +20 Números da Sorte
                          </span>
                          <span className="text-green-400 font-bold ml-2">
                            por apenas R$ 9,90
                          </span>
                        </div>
                      </label>
                    </div>

                    <p className="text-xs text-gray-400 mb-5">
                      Cotas: As cotas serão geradas após o pagamento.
                    </p>

                    <Button
                      onClick={handleGeneratePix}
                      disabled={isGeneratingPix}
                      className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPix ? (
                        <>
                          <Loader2 size={20} className="mr-2 animate-spin" />
                          Gerando PIX...
                        </>
                      ) : (
                        <>
                          <Image
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pix-6eKavsUOFlru4UR6BnrvSe2TPnoGn3.png"
                            alt="PIX"
                            width={20}
                            height={20}
                            className="mr-2"
                          />
                          Gerar Pix
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {step === 3 && pixData && (
                  <motion.div
                    key="step3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 space-y-5"
                  >
                    {/* Timer - fixo no topo */}
                    <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/30 rounded-lg p-3 flex items-center sticky top-0 z-10 backdrop-blur-sm">
                      <Clock size={18} className="text-red-400 mr-2" />
                      <span className="text-red-300 text-sm">
                        Você tem{" "}
                        <span className="font-bold">{formatTimeLeft()}</span>{" "}
                        para pagar
                      </span>
                      <motion.div
                        className="ml-auto h-1 bg-red-500 rounded-full"
                        style={{ width: `${(timeLeft / 577) * 100}%` }}
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 577, ease: "linear" }}
                      />
                    </div>

                    {/* Instruções compactas */}
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-300">
                        <div className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                          1
                        </div>
                        <span>Copie o código PIX</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                          2
                        </div>
                        <span>Abra seu banco e escolha PIX</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                          3
                        </div>
                        <span>Cole o código e confirme</span>
                      </div>
                    </div>

                    {/* Código PIX */}
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between">
                        <code className="text-xs text-gray-400 flex-1 mr-2 break-all overflow-hidden">
                          {pixData.pix?.pix_qr_code ||
                            "Código PIX não disponível"}
                        </code>
                        <Button
                          onClick={() => {
                            const pixCode = pixData.pix?.pix_qr_code;
                            if (pixCode) {
                              navigator.clipboard.writeText(pixCode);
                              setPixCopied(true);
                              setTimeout(() => setPixCopied(false), 2000);
                            }
                          }}
                          className={`${
                            pixCopied
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-yellow-600 hover:bg-yellow-700"
                          } text-white px-3 py-2 rounded text-sm transition-colors duration-200 flex items-center flex-shrink-0`}
                        >
                          {pixCopied ? (
                            <Check size={14} className="mr-1" />
                          ) : (
                            <Copy size={14} className="mr-1" />
                          )}
                          {pixCopied ? "OK" : "Copiar"}
                        </Button>
                      </div>
                    </div>

                    {/* Aviso */}
                    <div className="bg-gradient-to-r from-amber-900/30 to-yellow-800/30 border border-amber-700/30 rounded-lg p-3 flex items-start">
                      <AlertCircle
                        size={16}
                        className="text-amber-400 mr-2 mt-0.5 flex-shrink-0"
                      />
                      <p className="text-xs text-amber-200">
                        Pagamento deve ser realizado dentro do prazo, senão os
                        números voltam a ficar disponíveis.
                      </p>
                    </div>

                    {/* Mensagem de Sucesso */}
                    {paymentConfirmed && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/30 rounded-lg p-6 text-center"
                      >
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Check size={32} className="text-white" />
                          </div>
                          <h3 className="text-green-400 font-bold text-xl mb-2">
                            Compra Realizada com Sucesso!
                          </h3>
                          <p className="text-gray-300 text-sm">
                            Verifique em{" "}
                            <span className="text-yellow-400 font-semibold">
                              "Minhas Compras"
                            </span>{" "}
                            seus números da sorte
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Botão de confirmação */}
                    {!paymentConfirmed && (
                      <Button
                        onClick={() => setPaymentConfirmed(true)}
                        className="w-full py-3 rounded-lg font-medium transition-all duration-300 bg-gray-700 hover:bg-gray-600 text-gray-300"
                      >
                        ✓ Já fiz o pagamento
                      </Button>
                    )}

                    {/* QR Code */}
                    <div className="text-center">
                      <motion.div
                        className="bg-gray-800 p-3 rounded-lg border border-gray-700 inline-block"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {pixData.pix?.pix_qr_code ? (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixData.pix.pix_qr_code)}`}
                            alt="QR Code"
                            style={{ borderRadius: "8px" }}
                            className="w-36 h-36"
                          />
                        ) : (
                          <div className="w-36 h-36 bg-gray-700 flex items-center justify-center rounded-lg">
                            <span className="text-gray-400 text-sm">
                              QR Code indisponível
                            </span>
                          </div>
                        )}
                      </motion.div>
                      <p className="text-xs text-gray-400 mt-2">📱 QR Code</p>
                      <p className="text-xs text-gray-400 px-4">
                        Escaneie com o app do seu banco na opção "Pagar com QR
                        Code"
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
