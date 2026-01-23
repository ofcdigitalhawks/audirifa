import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bilhete Premiado - PIX DO MILHÃO",
  description: "Resgate seu prêmio do PIX DO MILHÃO",
}

export default function BilhetePremiadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
