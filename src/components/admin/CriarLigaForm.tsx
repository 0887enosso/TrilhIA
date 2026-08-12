"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CampoTexto, CampoSelecao } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

type Equipe = { id: string; nome: string };

export function CriarLigaForm({ equipes }: { equipes: Equipe[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"PADRAO" | "EXCLUSIVA">("EXCLUSIVA");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    const equipeId = String(dados.get("equipeId") ?? "");
    const condicaoDesbloqueio = String(dados.get("condicaoDesbloqueio") ?? "").trim();

    const res = await fetch("/api/admin/ligas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: dados.get("nome"),
        tipo,
        equipeId: equipeId || null,
        condicaoDesbloqueio: condicaoDesbloqueio || null,
      }),
    });
    const corpo = await res.json();

    if (!res.ok) {
      setErro(corpo.erro ?? "Não foi possível criar a liga.");
      setEnviando(false);
      return;
    }

    evento.currentTarget.reset();
    setEnviando(false);
    router.refresh();
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4 rounded-lg border border-rule bg-parchment-surface p-5">
      <h2 className="font-display text-lg text-ink">Nova liga</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto rotulo="Nome" name="nome" required placeholder="Ex: Liga da Trilha Intermediária" />
        <CampoSelecao
          rotulo="Tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "PADRAO" | "EXCLUSIVA")}
        >
          <option value="EXCLUSIVA">Exclusiva (com condição de desbloqueio)</option>
          <option value="PADRAO">Padrão (de uma equipe)</option>
        </CampoSelecao>
        <CampoSelecao rotulo="Restrita a uma equipe? (opcional)" name="equipeId" defaultValue="">
          <option value="">Sem restrição — todas as equipes</option>
          {equipes.map((equipe) => (
            <option key={equipe.id} value={equipe.id}>
              {equipe.nome}
            </option>
          ))}
        </CampoSelecao>
        {tipo === "EXCLUSIVA" ? (
          <CampoTexto
            rotulo="Condição de desbloqueio (opcional)"
            name="condicaoDesbloqueio"
            placeholder="Ex: trilha_basica_concluida"
          />
        ) : null}
      </div>

      {erro ? <p className="text-sm text-coral">{erro}</p> : null}
      <Botao type="submit" disabled={enviando} className="self-start">
        {enviando ? "Criando…" : "Criar liga"}
      </Botao>
    </form>
  );
}
