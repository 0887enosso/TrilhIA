import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Middleware roda no Edge Runtime — não pode importar o cliente Prisma aqui.
// Por isso decodifica o JWT diretamente, em vez de reusar src/lib/auth.ts
// (que depende de next/headers em contexto de rota, não de middleware).

const COOKIE_NAME = "trilhia_session";

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.papel !== "ADMIN") {
      return NextResponse.json(
        { erro: "Acesso restrito a administradores." },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json({ erro: "Sessão inválida ou expirada." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
