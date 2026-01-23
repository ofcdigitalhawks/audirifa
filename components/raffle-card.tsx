"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface RaffleCardProps {
  raffle: {
    id: number
    title: string
    image: string
    price: number
    description: string
    endDate: string
  }
  onDetailsClick: () => void
  onBuyClick: () => void
}

export default function RaffleCard({ raffle, onDetailsClick, onBuyClick }: RaffleCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full">
        <Image src={raffle.image || "/placeholder.svg"} alt={raffle.title} fill className="object-cover" />
      </div>
      <CardHeader>
        <CardTitle>{raffle.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-2">{raffle.description}</p>
        <p className="font-bold text-green-600 text-lg">R$ {raffle.price.toFixed(2)}</p>
        <p className="text-sm text-gray-500">Encerra em: {raffle.endDate}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onDetailsClick}>
          Ver Detalhes
        </Button>
        <Button className="bg-green-600 hover:bg-green-700" onClick={onBuyClick}>
          Comprar
        </Button>
      </CardFooter>
    </Card>
  )
}
