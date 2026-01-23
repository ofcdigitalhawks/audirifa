"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function TrackingScripts() {
  const pathname = usePathname()

  // Páginas onde não deve carregar o tracking (upsells)
  const upsellPages = ["/roleta", "/roleta2", "/bilhete-premiado"]

  // Verificar se a página atual é um upsell
  const isUpsellPage = upsellPages.some(page => pathname.startsWith(page))

  useEffect(() => {
    // Não carregar scripts nas páginas de upsell
    if (isUpsellPage) {
      return
    }

    // Função para capturar TODOS os parâmetros da URL (vindos das fontes de tráfego)
    const captureAllParams = () => {
      if (typeof window !== 'undefined') {
        const currentSearch = window.location.search
        
        if (currentSearch) {
          // Salvar a query string completa para preservar entre páginas
          localStorage.setItem("currentUrlParams", currentSearch)
          console.log("Parâmetros da URL capturados:", currentSearch)
          
          // Também salvar como objeto para uso no checkout
          const urlParams = new URLSearchParams(currentSearch)
          const utmData: any = {}
          
          // Capturar TODOS os parâmetros presentes na URL
          urlParams.forEach((value, key) => {
            utmData[key] = value
          })
          
          localStorage.setItem("utmData", JSON.stringify(utmData))
          console.log("Dados dos parâmetros:", utmData)
        }
      }
    }

    // Capturar parâmetros imediatamente
    captureAllParams()

    // Carregar script do Xtracky
    const loadXtracky = () => {
      try {
        // Verificar se o script já foi carregado
        if (document.querySelector('script[src="https://cdn.xtracky.com/scripts/utm-handler.js"]')) {
          console.log("Xtracky script already loaded")
          return
        }
        
        const script = document.createElement("script")
        script.src = "https://cdn.xtracky.com/scripts/utm-handler.js"
        script.setAttribute("data-token", "f390e21f-24e7-4fef-ad08-786da8407835")
        script.setAttribute("data-click-id-param", "click_id")
        script.async = true
        script.onload = () => {
          console.log("Xtracky script loaded successfully")
          // Recapturar parâmetros após carregar o script
          setTimeout(captureAllParams, 1000)
        }
        script.onerror = () => {
          console.log("Xtracky script failed to load")
        }
        document.head.appendChild(script)
      } catch (error) {
        console.log("Error loading Xtracky:", error)
      }
    }

    // WAU Analytics
    const loadWAU = () => {
      try {
        if (typeof window !== "undefined") {
          // Verificar se o WAU já foi inicializado
          if ((window as any)._wau) {
            console.log("WAU already initialized")
            return
          }
          
          ;(window as any)._wau = (window as any)._wau || []
          ;(window as any)._wau.push(["small", "ccju7fzipe", "1ua"])
          
          // Verificar se o script já foi carregado
          if (document.querySelector('script[src="//waust.at/s.js"]')) {
            console.log("WAU script already loaded")
            return
          }
          
          const script = document.createElement("script")
          script.src = "//waust.at/s.js"
          script.async = true
          script.onerror = () => {
            console.log("WAU script failed to load")
          }
          document.head.appendChild(script)
        }
      } catch (error) {
        console.log("Error loading WAU:", error)
      }
    }

    // Carregar scripts
    loadXtracky()
    loadWAU()

    // Listener para mudanças na URL (para SPAs)
    const handleLocationChange = () => {
      setTimeout(captureAllParams, 100)
    }

    // Listener para mudanças na URL do navegador
    window.addEventListener("popstate", handleLocationChange)
    
        // Capturar parâmetros quando a URL muda (monitoramento contínuo)
    const interval = setInterval(() => {
      captureAllParams()
    }, 2000)

    return () => {
      window.removeEventListener("popstate", handleLocationChange)
      clearInterval(interval)
    }
  }, [pathname, isUpsellPage])

  return null
} 