import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Roleta da Sorte - PIX DO MILHÃO",
  description: "Gire a roleta e ganhe prêmios incríveis!",
}

export default function RoletaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
