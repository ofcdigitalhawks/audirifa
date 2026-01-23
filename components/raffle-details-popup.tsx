"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface RaffleDetailsPopupProps {
  raffle: {
    id: number
    title: string
    image: string
    price: number
    description: string
    endDate: string
  }
  onClose: () => void
  onBuyClick: () => void
}

export default function RaffleDetailsPopup({ raffle, onClose, onBuyClick }: RaffleDetailsPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">{raffle.title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative h-64 w-full">
            <Image
              src={raffle.image || "/placeholder.svg"}
              alt={raffle.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg">Descrição</h3>
              <p className="text-gray-600">{raffle.description}</p>
            </div>

            <div>
              <h3 className="font-bold text-lg">Detalhes</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Preço por número:</span>
                  <span className="font-bold text-green-600">R$ {raffle.price.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Data do sorteio:</span>
                  <span>{raffle.endDate}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Números disponíveis:</span>
                  <span>750/1000</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg">Prêmios</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>1º Prêmio: Item de grande valor</li>
                <li>2º Prêmio: Item secundário</li>
                <li>3º Prêmio: Item adicional</li>
              </ul>
            </div>

            <Button onClick={onBuyClick} className="w-full bg-green-600 hover:bg-green-700 mt-4">
              Comprar Agora
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="font-bold text-lg mb-2">Regras da Rifa</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>O sorteio será realizado na data indicada</li>
            <li>O resultado será divulgado em nossas redes sociais</li>
            <li>O ganhador será contatado por telefone ou e-mail</li>
            <li>O prêmio deve ser retirado em até 30 dias após o sorteio</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
