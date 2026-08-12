"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CampoTexto } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export function CriarEquipeForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    const res = await fetch("/api/admin/equipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: dados.get("nome") }),
    });
    const corpo = await res.json();

    if (!res.ok) {
      setErro(corpo.erro ?? "Não foi possível criar a equipe.");
      setEnviando(false);
      return;
    }

    evento.currentTarget.reset();
    setEnviando(false);
    router.refresh();
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <CampoTexto rotulo="Nova equipe" name="nome" required placeholder="Ex: Banco XP" />
      </div>
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Criando…" : "Criar equipe"}
      </Botao>
      {erro ? <p className="text-sm text-coral">{erro}</p> : null}
    </form>
  );
}
