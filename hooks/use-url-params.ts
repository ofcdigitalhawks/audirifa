"use client"

import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

export function useUrlParams() {
  const router = useRouter()
  const pathname = usePathname()



  // Função para obter parâmetros da URL atual (preservados das fontes de tráfego)
  const getCurrentParams = () => {
    if (typeof window === "undefined") return ""
    
    // Usar os parâmetros salvos no localStorage (que incluem modificações do Xtracky)
    const savedParams = localStorage.getItem("currentUrlParams")
    if (savedParams) {
      console.log("Usando parâmetros salvos:", savedParams)
      return savedParams
    }
    
    // Fallback para os parâmetros da URL atual
    const currentParams = window.location.search
    console.log("Usando parâmetros da URL atual:", currentParams)
    return currentParams
  }

  // Função para navegar preservando parâmetros
  const navigateWithParams = (path: string) => {
    const currentParams = getCurrentParams()
    const newUrl = `${path}${currentParams}`
    router.push(newUrl)
  }

  // Função para redirecionamento com window.location preservando parâmetros
  const redirectWithParams = (path: string) => {
    const currentParams = getCurrentParams()
    const newUrl = `${path}${currentParams}`
    window.location.href = newUrl
  }

  // Função para construir URL com parâmetros preservados
  const buildUrlWithParams = (path: string) => {
    const currentParams = getCurrentParams()
    return `${path}${currentParams}`
  }

  // Função para verificar se existem parâmetros na URL
  const hasParams = () => {
    const params = getCurrentParams()
    return params && params.length > 0
  }

  return {
    navigateWithParams,
    redirectWithParams,
    buildUrlWithParams,
    hasParams,
    getCurrentParams,
    pathname
  }
} 