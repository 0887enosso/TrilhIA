import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

const COOKIE_NAME = "trilhia_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET não configurado. Defina essa variável de ambiente antes de autenticar usuários."
    );
  }
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Senhas
// ---------------------------------------------------------------------------

const SALT_ROUNDS = 12;

export async function gerarHashSenha(senhaPlana: string): Promise<string> {
  return bcrypt.hash(senhaPlana, SALT_ROUNDS);
}

export async function verificarSenha(
  senhaPlana: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(senhaPlana, hash);
}

/**
 * Gera uma senha temporária legível (para o admin repassar ao colaborador),
 * usada no fluxo de "esqueci minha senha" — nunca é armazenada em texto puro,
 * só o hash dela é salvo no banco. O admin vê esse valor uma única vez.
 *
 * Usa crypto.randomInt (criptograficamente seguro) em vez de Math.random —
 * Math.random não tem garantia de imprevisibilidade suficiente para gerar
 * algo usado como credencial, mesmo que temporária.
 */
export function gerarSenhaTemporaria(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem caracteres ambíguos (0/O, 1/I/L)
  let senha = "";
  for (let i = 0; i < 10; i++) {
    senha += alfabeto[randomInt(alfabeto.length)];
  }
  return senha;
}

// ---------------------------------------------------------------------------
// Sessão (cookie httpOnly com JWT assinado)
// ---------------------------------------------------------------------------

export type SessaoPayload = {
  usuarioId: string;
  papel: "COLABORADOR" | "ADMIN";
  senhaVersao: number; // epoch (ms) de Usuario.senhaAlteradaEm no momento em que a sessão foi criada
};

export async function criarSessao(payload: SessaoPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());

  return token;
}

export async function definirCookieSessao(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function limparCookieSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Além de verificar a assinatura/validade do JWT, confere se a senha do
 * usuário não mudou desde que essa sessão foi emitida — se mudou (reset pelo
 * admin, ou o próprio usuário trocando a senha), a sessão antiga é tratada
 * como inválida, mesmo que o token em si ainda não tenha expirado. Isso
 * fecha a lacuna de "resetar senha não expulsa sessões já abertas" (ver
 * docs/auditoria-tecnica-backend.md, item #5.2).
 *
 * Envolvida em `cache()` do React: layout + página (e às vezes componentes
 * dentro dela) chamam isso separadamente na mesma requisição — sem cache,
 * cada chamada é uma ida a mais ao Postgres remoto (Supabase), e essa
 * duplicação sozinha já explicava boa parte da lentidão sentida ao navegar.
 * `cache()` garante que só a primeira chamada por requisição bate no banco;
 * as demais reaproveitam o resultado.
 */
export const obterSessaoAtual = cache(async (): Promise<SessaoPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let payload: SessaoPayload;
  try {
    const resultado = await jwtVerify(token, getJwtSecret());
    payload = resultado.payload as unknown as SessaoPayload;
  } catch {
    // Token ausente, expirado ou adulterado — trata como não autenticado,
    // não lança erro para não derrubar a rota que chamou esta função.
    return null;
  }

  // Import local para evitar dependência circular no topo do arquivo
  // (prisma.ts não depende de auth.ts, mas mantém o import próximo do uso).
  const { prisma } = await import("./prisma");
  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.usuarioId },
    select: { senhaAlteradaEm: true, ativo: true, statusCadastro: true },
  });

  if (!usuario || !usuario.ativo) return null;
  // Cobre o caso de um admin rejeitar/desaprovar um cadastro depois que a
  // pessoa já tinha uma sessão válida aberta — derruba o acesso na próxima
  // requisição, não só no próximo login.
  if (usuario.statusCadastro !== "APROVADO") return null;
  if (usuario.senhaAlteradaEm.getTime() !== payload.senhaVersao) return null;

  return payload;
});
