import { type NextRequest, NextResponse } from "next/server"
import { generateCustomerData } from "@/lib/fake-data"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Testando geração de dados...")
    
    // Teste com 4Devs
    const data4Devs = await generateCustomerData(true)
    console.log("📦 Dados da 4Devs:", data4Devs)
    
    // Teste sem 4Devs (fallback local)
    const dataLocal = await generateCustomerData(false)
    console.log("📦 Dados locais:", dataLocal)
    
    return NextResponse.json({
      success: true,
      data4Devs,
      dataLocal,
      cpfLimpo4Devs: data4Devs.cpf?.replace(/\D/g, ''),
      cpfLimpoLocal: dataLocal.cpf?.replace(/\D/g, ''),
      telefoneLimpo4Devs: data4Devs.phone?.replace(/\D/g, ''),
      telefoneLimpoLocal: dataLocal.phone?.replace(/\D/g, ''),
    })
  } catch (error) {
    console.error("❌ Erro no teste:", error)
    return NextResponse.json({
      error: true,
      message: error instanceof Error ? error.message : String(error)
    })
  }
} 