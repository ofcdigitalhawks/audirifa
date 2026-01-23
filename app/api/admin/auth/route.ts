import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || "admin@2026";

    if (password === adminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: "Senha incorreta" },
        { status: 401 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Erro ao validar senha" },
      { status: 500 },
    );
  }
}
