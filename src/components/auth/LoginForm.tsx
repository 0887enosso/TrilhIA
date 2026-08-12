"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CampoTexto } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { DecryptedText } from "@/components/reactbits/DecryptedText";
import { CartaoAuth } from "./CartaoAuth";

export function LoginForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    const resposta = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: dados.get("nickname"),
        senha: dados.get("senha"),
      }),
    });

    const corpo = await resposta.json();

    if (!resposta.ok) {
      setErro(corpo.erro ?? "Não foi possível entrar.");
      setEnviando(false);
      return;
    }

    if (corpo.usuario?.precisaTrocarSenha) {
      router.push("/trocar-senha");
    } else {
      router.push("/inicio");
    }
    router.refresh();
  }

  return (
    <CartaoAuth pose="sorrindo">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="font-display text-2xl text-ink">
            <DecryptedText text="TrilhIA" encryptedClassName="text-ink-faint" />
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Letramento em IA para o escritório.</p>
        </div>

        <form onSubmit={aoEnviar} className="flex w-full flex-col gap-4">
          <CampoTexto rotulo="Nickname" name="nickname" type="text" required autoComplete="username" />
          <CampoTexto rotulo="Senha" name="senha" type="password" required autoComplete="current-password" />

          {erro ? (
            <p className="rounded-md bg-coral-soft px-3 py-2 text-sm text-coral" role="alert">
              {erro}
            </p>
          ) : null}

          <Botao type="submit" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </Botao>
        </form>

        <div className="flex flex-col items-center gap-1 text-sm text-ink-soft">
          <p>
            Ainda não tem conta?{" "}
            <a href="/cadastro" className="font-medium text-trail hover:underline">
              Cadastre-se
            </a>
          </p>
          <p className="text-xs text-ink-faint">Esqueceu a senha? Peça a um administrador para redefinir.</p>
        </div>
      </div>
    </CartaoAuth>
  );
}
