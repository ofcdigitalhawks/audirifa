"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import Image from "next/image"

interface PurchasePopupProps {
  raffle: {
    id: number
    title: string
    image: string
    price: number
  }
  onClose: () => void
}

export default function PurchasePopup({ raffle, onClose }: PurchasePopupProps) {
  const [quantity, setQuantity] = useState(1)
  const [numbers, setNumbers] = useState<number[]>([])
  const [paymentMethod, setPaymentMethod] = useState("pix")

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setQuantity(value)
      // Gerar números aleatórios para a rifa
      const newNumbers = Array.from({ length: value }, () => Math.floor(Math.random() * 1000) + 1)
      setNumbers(newNumbers)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implementar lógica de compra aqui
    console.log("Compra realizada:", {
      raffle,
      quantity,
      numbers,
      paymentMethod,
      total: raffle.price * quantity,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">Comprar Rifa</h2>

        <div className="flex items-center mb-6">
          <div className="relative h-20 w-20 mr-4">
            <Image src={raffle.image || "/placeholder.svg"} alt={raffle.title} fill className="object-cover rounded" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{raffle.title}</h3>
            <p className="text-green-600 font-bold">R$ {raffle.price.toFixed(2)} por número</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade de números</Label>
            <Input id="quantity" type="number" min="1" value={quantity} onChange={handleQuantityChange} required />
          </div>

          {numbers.length > 0 && (
            <div className="space-y-2">
              <Label>Seus números</Label>
              <div className="flex flex-wrap gap-2">
                {numbers.map((num, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    #{num.toString().padStart(4, "0")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  paymentMethod === "pix" ? "border-green-600 bg-green-50" : "border-gray-200"
                }`}
                onClick={() => setPaymentMethod("pix")}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-2 flex items-center justify-center">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        paymentMethod === "pix" ? "bg-green-600" : "border border-gray-400"
                      }`}
                    ></div>
                  </div>
                  <span>PIX</span>
                </div>
              </div>
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  paymentMethod === "card" ? "border-green-600 bg-green-50" : "border-gray-200"
                }`}
                onClick={() => setPaymentMethod("card")}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-2 flex items-center justify-center">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        paymentMethod === "card" ? "bg-green-600" : "border border-gray-400"
                      }`}
                    ></div>
                  </div>
                  <span>Cartão</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-xl text-green-600">R$ {(raffle.price * quantity).toFixed(2)}</span>
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Finalizar Compra
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
