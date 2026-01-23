"use client"

import { useState } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Menu } from "lucide-react"

export default function RafflePage({ params }: { params: { id: string } }) {
  const [quantity, setQuantity] = useState(6)
  const basePrice = 2.99
  const totalPrice = (quantity * basePrice).toFixed(2)

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1)
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  const handleSelectQuantity = (amount: number) => {
    setQuantity(amount)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <button className="text-white">
          <Menu size={24} />
        </button>
        <div className="flex-1 flex justify-center">
          <Image
            src="/placeholder.svg?height=50&width=200"
            alt="Prêmios do Maia"
            width={200}
            height={50}
            className="object-contain"
          />
        </div>
        <button className="text-white">Suporte</button>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto pb-8">
        {/* Banner Image */}
        <div className="relative w-full h-64 bg-yellow-100">
          <Image src="/placeholder.svg?height=256&width=768" alt="Prêmios" fill className="object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
            <div className="text-xs text-gray-300">1544.624197/2025-49</div>
            <h1 className="text-xl font-bold">PRÊMIOS DO MAIA M486.822 VERSÃO 2</h1>
            <p className="text-xs">
              EDIÇÃO: 05 - IMAGENS: sugestão de uso da premiação líquida definida no regulamento abaixo
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="premios" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="titulos" className="flex items-center justify-center py-3">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Meus títulos
            </TabsTrigger>
            <TabsTrigger value="premios" className="flex items-center justify-center py-3">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
              Prêmios
            </TabsTrigger>
          </TabsList>
          <TabsContent value="titulos">
            <div className="p-4 text-center">
              <p>Seus títulos aparecerão aqui</p>
            </div>
          </TabsContent>
          <TabsContent value="premios">
            {/* Raffle Info */}
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center">
                <span className="font-medium mr-2">Sorteio</span>
                <span>15/06/2025</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">Por apenas</span>
                <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold">R$ 2,99</span>
              </div>
            </div>

            {/* Message */}
            <div className="p-4 text-center border-b">
              <p>Quanto mais títulos, mais chances de ganhar!</p>
            </div>

            {/* Quantity Selection */}
            <div className="grid grid-cols-3 gap-2 p-2">
              <button
                onClick={() => handleSelectQuantity(5)}
                className="bg-green-500 text-white p-4 rounded flex flex-col items-center justify-center"
              >
                <span className="text-2xl font-bold">+05</span>
                <span className="text-xs">SELECIONAR</span>
              </button>
              <button
                onClick={() => handleSelectQuantity(10)}
                className="bg-blue-500 text-white p-4 rounded flex flex-col items-center justify-center"
              >
                <span className="text-2xl font-bold">+10</span>
                <span className="text-xs">SELECIONAR</span>
              </button>
              <button
                onClick={() => handleSelectQuantity(20)}
                className="bg-blue-500 text-white p-4 rounded flex flex-col items-center justify-center"
              >
                <span className="text-2xl font-bold">+20</span>
                <span className="text-xs">SELECIONAR</span>
              </button>
            </div>

            {/* Quantity Input */}
            <div className="p-4">
              <div className="flex border rounded-md overflow-hidden">
                <button
                  onClick={handleDecrement}
                  className="bg-white px-4 py-2 border-r flex items-center justify-center"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="flex-1 text-center py-2 text-xl font-medium">{quantity}</div>
                <button
                  onClick={handleIncrement}
                  className="bg-white px-4 py-2 border-l flex items-center justify-center"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Participate Button */}
            <div className="p-4">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md flex items-center justify-between px-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="flex-1 text-center font-bold">Participar</div>
                <div className="font-bold">R$ {totalPrice}</div>
              </button>
            </div>

            {/* Description/Rules */}
            <div className="p-4 border-t">
              <button className="w-full flex items-center justify-between py-2">
                <div className="flex items-center">
                  <span className="bg-black text-white w-5 h-5 flex items-center justify-center rounded-full text-xs mr-2">
                    i
                  </span>
                  <span className="font-medium">Descrição/Regulamento</span>
                </div>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Partner Logos */}
            <div className="p-4 flex justify-center space-x-4 border-t">
              <Image
                src="/placeholder.svg?height=50&width=100"
                alt="CAPEMISA"
                width={100}
                height={50}
                className="object-contain"
              />
              <Image
                src="/placeholder.svg?height=50&width=100"
                alt="SANTA CASA"
                width={100}
                height={50}
                className="object-contain"
              />
              <Image
                src="/placeholder.svg?height=50&width=100"
                alt="Alvalaxia"
                width={100}
                height={50}
                className="object-contain"
              />
            </div>

            {/* Legal Text */}
            <div className="p-4 text-xs text-gray-500 border-t">
              <p>
                Título de Capitalização da Modalidade Filantropia Premiável de Contribuição Única, emitido pela Capemisa
                Capitalização S/A, CNPJ 14.056.028/0001-55, aprovado pelo Processo SUSEP que consta no Título. SAC 0800
                291 2246 ou 0800 940 1130. OUVIDORIA 0800 291 2246 ou 0800 707 4936, de segunda a sexta-feira, das 8h às
                17h. É proibida a venda de título de capitalização a menores de dezesseis anos. O valor não constitui
                base de cálculo para contribuições, encargos e/ou impostos de qualquer natureza. A aquisição deste
                título implica na cessão de 100% do direito de resgate à SANTA CASA DE MISERICÓRDIA DE PENEDO,
                certificada nos termos da legislação em vigor. Antes de contratar, consulte previamente as Condições
                Gerais. As condições contratuais/regulamento deste produto protocolizadas pela sociedade junto à SUSEP
                poderão ser consultadas no endereço eletr��nico www.susep.gov.br, de acordo com o número de processo
                constante da proposta. Consulte as informações legais da Resolução CNSP 382/2020 em www.capemisa.com.br.
                Prêmios líquidos de imposto de renda. Confira o resultado dos sorteios e as condições de participação em
                premiosdomaia.com. Imagens meramente ilustrativas.
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 text-center text-xs text-gray-500 border-t">
              <p>2025 Prêmios do Maia© - Todos os direitos reservados.</p>
              <p className="mt-1">
                Desenvolvido por <span className="text-blue-500">IndriveL.Tech</span>
              </p>
              <div className="flex justify-center mt-2">
                <Image
                  src="/placeholder.svg?height=40&width=120"
                  alt="Google Safe Browsing"
                  width={120}
                  height={40}
                  className="object-contain"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
