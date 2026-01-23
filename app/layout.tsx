import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import TrackingScripts from "@/components/tracking-scripts"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PIX DO MILHÃO - Concorra a R$1.000.000",
  description: "Concorra a prêmios de até R$1.000.000 com o PIX DO MILHÃO",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TrackingScripts />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
