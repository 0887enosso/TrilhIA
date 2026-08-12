"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mascote } from "@/components/mascote/Mascote";
import { CampoTexto } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export function TrocarSenhaForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const dados = new FormData(evento.currentTarget);
    const novaSenha = String(dados.get("novaSenha") ?? "");
    const confirmacao = String(dados.get("confirmacao") ?? "");

    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }

    setEnviando(true);
    const resposta = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novaSenha }),
    });

    const corpo = await resposta.json();

    if (!resposta.ok) {
      setErro(corpo.erro ?? "Não foi possível trocar a senha.");
      setEnviando(false);
      return;
    }

    router.push("/inicio");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Mascote pose="pensando" size={104} />
        <div className="text-center">
          <h1 className="font-display text-2xl text-ink">Defina uma nova senha</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Você entrou com uma senha temporária gerada por um admin — escolha uma nova antes de continuar.
          </p>
        </div>

        <form onSubmit={aoEnviar} className="flex w-full flex-col gap-4">
          <CampoTexto
            rotulo="Nova senha"
            name="novaSenha"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <CampoTexto
            rotulo="Confirme a nova senha"
            name="confirmacao"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />

          {erro ? (
            <p className="rounded-md bg-coral-soft px-3 py-2 text-sm text-coral" role="alert">
              {erro}
            </p>
          ) : null}

          <Botao type="submit" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar nova senha"}
          </Botao>
        </form>
      </div>
    </div>
  );
}
