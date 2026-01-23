"use client"
import { Button } from "@/components/ui/button"
import LoginPopup from "@/components/login-popup"
import PurchasePopup from "@/components/purchase-popup"
import RaffleDetailsPopup from "@/components/raffle-details-popup"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUrlParams } from "@/hooks/use-url-params"

export default function Home() {
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [showPurchasePopup, setShowPurchasePopup] = useState(false)
  const [showDetailsPopup, setShowDetailsPopup] = useState(false)
  const [selectedRaffle, setSelectedRaffle] = useState(null)
  const { buildUrlWithParams } = useUrlParams()

  const raffles = [
    {
      id: 1,
      title: "Pix do Milhão",
      image: "/placeholder.svg?height=200&width=300",
      price: 1.99,
      description: "Concorra a R$ 1.000.000,00!",
      endDate: "13/06/2025",
    },
    {
      id: 2,
      title: "Prêmios do Maia",
      image: "/placeholder.svg?height=200&width=300",
      price: 2.99,
      description: "Carros e motos incríveis!",
      endDate: "15/06/2025",
    },
    {
      id: 3,
      title: "Super Rifa",
      image: "/placeholder.svg?height=200&width=300",
      price: 10.0,
      description: "Prêmios exclusivos!",
      endDate: "10/08/2025",
    },
  ]

  const handleRaffleClick = (raffle: any) => {
    setSelectedRaffle(raffle)
    setShowDetailsPopup(true)
  }

  const handleBuyClick = (raffle: any) => {
    setSelectedRaffle(raffle)
    setShowPurchasePopup(true)
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <Image src="/images/logo.png" alt="PIX DO MILHÃO" width={200} height={40} />
        </div>

        <div className="bg-[#1e1e1e] rounded-lg overflow-hidden mb-6">
          <Image
            src="/images/3.png"
            alt="PIX DO MILHÃO - 50% OFF CONCORRA R$1.000.000"
            width={500}
            height={250}
            className="w-full"
          />
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">Concorra a R$ 1.000.000,00</h2>
            <p className="text-gray-300 mb-4">Participe agora do sorteio e concorra a prêmios incríveis!</p>
            <Link href={buildUrlWithParams("/raffle/pix-milhao")}>
              <Button className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-black font-bold">Participar Agora</Button>
            </Link>
          </div>
        </div>

        <div className="text-center text-gray-400 text-sm">
          <p>© 2025 PIX DO MILHÃO - Todos os direitos reservados</p>
        </div>
      </div>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}

      {showPurchasePopup && selectedRaffle && (
        <PurchasePopup raffle={selectedRaffle} onClose={() => setShowPurchasePopup(false)} />
      )}

      {showDetailsPopup && selectedRaffle && (
        <RaffleDetailsPopup
          raffle={selectedRaffle}
          onClose={() => setShowDetailsPopup(false)}
          onBuyClick={() => {
            setShowDetailsPopup(false)
            setShowPurchasePopup(true)
          }}
        />
      )}
    </main>
  )
}
