"use client";

import { useState, useEffect } from "react";
import { Search, ChevronRight } from "lucide-react";
import Image from "next/image";
import CheckoutPopup from "@/components/checkout-popup";
import MyPurchasesPopup from "@/components/my-purchases-popup";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function PixMilhaoPage() {
  const [quantity, setQuantity] = useState(10);
  const [showCheckoutPopup, setShowCheckoutPopup] = useState(false);
  const [showMyPurchases, setShowMyPurchases] = useState(false);

  // Estado para contagem regressiva
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Scripts de tracking agora são carregados globalmente via TrackingScripts component

  // Efeito para contagem regressiva até as 20h de hoje
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const targetTime = new Date();

      // Definir a hora alvo para 20:00:00 do dia 16/06/2025
      targetTime.setFullYear(2025, 5, 16); // Month is 0-indexed, so 5 = June
      targetTime.setHours(20, 0, 0, 0);

      // Se já passou das 20h, não mostra contagem regressiva
      if (now >= targetTime) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Calcular diferença em milissegundos
      const diff = targetTime.getTime() - now.getTime();

      // Converter para horas, minutos e segundos
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    // Calcular imediatamente e depois a cada segundo
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 10) {
      setQuantity(newQuantity);
    }
  };

  const totalPrice = quantity === 10 ? 19.99 : (quantity * 1.99).toFixed(2);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-[#1e1e1e] p-4">
        <div className="max-w-[540px] mx-auto flex justify-between items-center">
          <div className="h-6 flex items-center">
            <Image
              src="/images/logo.png"
              alt="PIX DO MILHÃO"
              width={120}
              height={24}
              className="object-contain"
            />
          </div>
          <button
            onClick={() => setShowMyPurchases(true)}
            className="flex items-center text-gray-300 border border-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-700 text-sm"
          >
            <Search className="w-4 h-4 mr-1.5" />
            Minhas compras
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[540px] mx-auto">
        {/* Main Banner Carousel */}
        <div className="mb-0 relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 3000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <video
                    src="/WhatsApp Video 2026-01-23 at 16.56.08.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <Image
                    src="/WhatsApp Image 2026-01-23 at 16.56.13.jpeg"
                    alt="Audi A3 Verde - Banner 1"
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <Image
                    src="/WhatsApp Image 2026-01-23 at 16.56.13 (1).jpeg"
                    alt="Audi A3 Verde - Banner 2"
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <Image
                    src="/WhatsApp Image 2026-01-23 at 16.56.14.jpeg"
                    alt="Audi A3 Verde - Banner 3"
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <Image
                    src="/WhatsApp Image 2026-01-23 at 16.56.14 (1).jpeg"
                    alt="Audi A3 Verde - Banner 4"
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <Image
                    src="/WhatsApp Image 2026-01-23 at 16.56.14 (2).jpeg"
                    alt="Audi A3 Verde - Banner 5"
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <Image
                    src="/WhatsApp Image 2026-01-23 at 16.56.17.jpeg"
                    alt="Audi A3 Verde - Banner 6"
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <Image
                    src="/WhatsApp Image 2026-01-23 at 16.56.18.jpeg"
                    alt="Audi A3 Verde - Banner 7"
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <Image
                    src="/WhatsApp Image 2026-01-23 at 16.56.18 (1).jpeg"
                    alt="Audi A3 Verde - Banner 8"
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full aspect-square relative overflow-hidden">
                  <Image
                    src="/WhatsApp Image 2026-01-23 at 16.56.19.jpeg"
                    alt="Audi A3 Verde - Banner 9"
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>

        {/* Promotion Section */}
        <div className="bg-[#1e1e1e] p-4">
          <div className="flex items-center mb-3">
            <div className="w-5 h-5 bg-[#FF5722] rounded-full flex items-center justify-center mr-2 text-xs">
              🔥
            </div>
            <span className="text-[#FF5722] font-medium">Promoção</span>
          </div>
          <div className="flex items-center justify-between bg-[#262626] rounded p-3">
            <div>
              <div className="bg-[#FF5722] text-white px-2 py-0.5 rounded text-xs inline-block mb-1">
                60% OFF
              </div>
              <div className="text-white text-sm">+10 Números</div>
            </div>
            <div className="text-right">
              <div className="text-white text-sm">De R$ 49,90 por</div>
              <div className="text-[#4CAF50] font-bold">R$ 19,99</div>
            </div>
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="bg-[#1e1e1e] p-4 ">
          <div className="text-white text-sm mb-10">Escolha de Números</div>

          <div className="grid grid-cols-4 gap-2 mb-4 relative">
            <button
              onClick={() => handleQuantityChange(quantity + 5)}
              className="border border-[#444444] text-white py-2 px-0 rounded text-sm"
            >
              +5
            </button>
            <div className="relative">
              <div className="flex items-center justify-center mb-1 absolute -top-9 left-0 right-0">
                <div className="w-2 h-2 bg-[#FF0000] rounded-full mr-1"></div>
                <span className="text-[#FF0000] text-xs">Mais popular</span>
              </div>
              <button
                onClick={() => handleQuantityChange(quantity + 10)}
                className="bg-[#FFC107] text-black py-2 px-0 rounded font-medium text-sm w-full"
              >
                +10
              </button>
            </div>
            <button
              onClick={() => handleQuantityChange(quantity + 20)}
              className="border border-[#444444] text-white py-2 px-0 rounded text-sm"
            >
              +20
            </button>
            <button
              onClick={() => handleQuantityChange(quantity + 50)}
              className="border border-[#444444] text-white py-2 px-0 rounded text-sm"
            >
              +50
            </button>
          </div>

          <div className="flex items-center mb-4">
            <button
              onClick={() =>
                quantity > 10 && handleQuantityChange(quantity - 1)
              }
              className="border border-[#444444] text-white w-10 h-10 rounded-l flex items-center justify-center"
            >
              -
            </button>
            <input
              type="number"
              min="10"
              value={quantity}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value) || 10;
                if (value >= 10) {
                  handleQuantityChange(value);
                }
              }}
              className="border-t border-b border-[#444444] bg-transparent text-white h-10 flex-1 text-center outline-none"
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              className="border border-[#444444] text-white w-10 h-10 rounded-r flex items-center justify-center"
            >
              +
            </button>
          </div>

          <div className="flex justify-between items-center mb-3">
            <span className="text-white text-sm">{quantity} Números</span>
            <span className="text-[#4CAF50] font-bold">R$ {totalPrice}</span>
          </div>

          <button
            onClick={() => setShowCheckoutPopup(true)}
            className="w-full bg-[#8BC34A] hover:bg-[#7CB342] text-white py-2 rounded text-sm font-medium"
          >
            Ir para pagamento
          </button>
        </div>

        {/* Legal Text */}
        <div className="px-4 mb-6">
          <div className="text-gray-400 text-xs leading-relaxed space-y-3">
            <p className="text-white">
              <span className="text-[#FFC107]">🍀 SORTEIO EM ANDAMENTO!</span>
            </p>
            <p>
              Participe da rifa do Audi A3 Verde e concorra a esse carro dos
              sonhos com cotas a partir de R$ 0,57.
            </p>
            <p>
              Por apenas R$ 0,57 por número, você garante sua chance de levar o
              Audi A3 Verde para casa.
            </p>
            <p>
              📱 Acompanhe tudo pelo Instagram oficial:{" "}
              <span className="text-[#FFC107]">@audi_trevodasorteoficial</span>
            </p>
            <p>
              O sorteio será realizado ao vivo em nossas redes sociais, na data
              e horário informados no regulamento da ação.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#333333] my-4 mx-4"></div>

        {/* Partner Logos */}
        <div className="flex justify-center space-x-8 my-6">
          <div className="text-center">
            <div className="h-6">
              <span className="text-white text-xs">ApliCap</span>
            </div>
          </div>
          <div className="text-center">
            <div className="h-6 flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="PIX DO MILHÃO"
                width={100}
                height={20}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs pb-4">
          v0.1.99-ctd10
        </div>
      </div>
      <CheckoutPopup
        isOpen={showCheckoutPopup}
        onClose={() => setShowCheckoutPopup(false)}
        quantity={quantity}
        totalPrice={totalPrice.toString()}
      />
      <MyPurchasesPopup
        isOpen={showMyPurchases}
        onClose={() => setShowMyPurchases(false)}
      />
    </div>
  );
}
