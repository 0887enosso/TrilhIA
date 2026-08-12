"use client";

import { FormEvent, useState } from "react";
import { CampoTexto, CampoSelecao } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { CartaoAuth } from "./CartaoAuth";

type Equipe = { id: string; nome: string };

export function CadastroForm({ equipes }: { equipes: Equipe[] }) {
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    const resposta = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: dados.get("nome"),
        nickname: dados.get("nickname"),
        senha: dados.get("senha"),
        equipeId: dados.get("equipeId"),
      }),
    });

    const corpo = await resposta.json();

    if (!resposta.ok) {
      setErro(corpo.erro ?? "Não foi possível criar a conta.");
      setEnviando(false);
      return;
    }

    setEnviado(true);
  }

  // Cadastro não loga automaticamente — toda conta nasce pendente de
  // aprovação de um admin (ver POST /api/auth/register).
  if (enviado) {
    return (
      <CartaoAuth pose="sentado">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-sans text-2xl font-extrabold text-ink">Cadastro enviado!</h1>
          <p className="max-w-xs text-sm text-ink-soft">
            Um administrador precisa aprovar seu acesso antes de você poder entrar. Isso costuma ser rápido —
            tente fazer login novamente daqui a pouco.
          </p>
          <a href="/login" className="font-medium text-trail hover:underline">
            Voltar para o login
          </a>
        </div>
      </CartaoAuth>
    );
  }

  return (
    <CartaoAuth pose="tchau">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="font-display text-2xl text-ink">Criar conta</h1>
          <p className="mt-1 text-sm text-ink-soft">Comece sua trilha de letramento em IA.</p>
        </div>

        <form onSubmit={aoEnviar} className="flex w-full flex-col gap-4">
          <CampoTexto rotulo="Nome completo" name="nome" required autoComplete="name" />
          <CampoTexto
            rotulo="Nickname"
            name="nickname"
            type="text"
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_.\-]+"
            title="Use apenas letras, números, ponto, hífen ou underline."
            autoComplete="username"
            placeholder="Como você quer ser chamado no login"
          />
          <CampoTexto
            rotulo="Senha"
            name="senha"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <CampoSelecao rotulo="Equipe" name="equipeId" required defaultValue="">
            <option value="" disabled>
              Selecione sua equipe
            </option>
            {equipes.map((equipe) => (
              <option key={equipe.id} value={equipe.id}>
                {equipe.nome}
              </option>
            ))}
          </CampoSelecao>

          {erro ? (
            <p className="rounded-md bg-coral-soft px-3 py-2 text-sm text-coral" role="alert">
              {erro}
            </p>
          ) : null}

          <Botao type="submit" disabled={enviando}>
            {enviando ? "Criando conta…" : "Criar conta"}
          </Botao>
        </form>

        <p className="text-sm text-ink-soft">
          Já tem conta?{" "}
          <a href="/login" className="font-medium text-trail hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </CartaoAuth>
  );
}
