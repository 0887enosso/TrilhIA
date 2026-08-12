"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { BadgePill } from "@/components/ui/BadgePill";
import { Mascote } from "@/components/mascote/Mascote";
import type { UsuarioParaAdmin } from "@/lib/admin";

type CamposEditaveis = {
  papel?: "COLABORADOR" | "ADMIN";
  ativo?: boolean;
  statusCadastro?: "PENDENTE" | "APROVADO" | "REJEITADO";
};

const ROTULO_STATUS: Record<UsuarioParaAdmin["statusCadastro"], string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

export function UsuariosTable({ usuariosIniciais, meuId }: { usuariosIniciais: UsuarioParaAdmin[]; meuId: string }) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [senhaRevelada, setSenhaRevelada] = useState<{ nome: string; senha: string } | null>(null);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  async function atualizar(usuarioId: string, dados: CamposEditaveis) {
    setCarregandoId(usuarioId);
    const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (res.ok) {
      const corpo = await res.json();
      setUsuarios((prev) => prev.map((u) => (u.id === usuarioId ? { ...u, ...corpo.usuario } : u)));
    }
    setCarregandoId(null);
  }

  async function resetarSenha(usuario: UsuarioParaAdmin) {
    setCarregandoId(usuario.id);
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: usuario.id }),
    });
    if (res.ok) {
      const corpo = await res.json();
      setSenhaRevelada({ nome: usuario.nome, senha: corpo.senhaTemporaria });
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, precisaTrocarSenha: true } : u)));
    }
    setCarregandoId(null);
  }

  const pendentes = usuarios.filter((u) => u.statusCadastro === "PENDENTE");
  const demais = usuarios.filter((u) => u.statusCadastro !== "PENDENTE");

  return (
    <div className="flex flex-col gap-8">
      {senhaRevelada ? (
        <div className="flex items-center justify-between rounded-md border border-amber bg-amber-soft px-4 py-3 text-sm text-amber-strong">
          <span>
            Senha temporária de <strong>{senhaRevelada.nome}</strong>:{" "}
            <span className="font-mono">{senhaRevelada.senha}</span> — repasse por um canal interno, não será
            exibida de novo.
          </span>
          <button onClick={() => setSenhaRevelada(null)} className="ml-4 text-amber-strong underline">
            Fechar
          </button>
        </div>
      ) : null}

      <section>
        <h2 className="mb-3 font-sans text-lg font-extrabold text-ink">
          Aguardando aprovação {pendentes.length > 0 ? `(${pendentes.length})` : ""}
        </h2>

        {pendentes.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-rule bg-parchment-surface p-5 text-sm text-ink-faint">
            <Mascote pose="sentado" size={44} />
            Nenhum cadastro esperando aprovação no momento.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendentes.map((usuario) => (
              <div
                key={usuario.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-amber bg-amber-soft p-4"
              >
                <div>
                  <p className="font-bold text-ink">{usuario.nome}</p>
                  <p className="font-mono text-xs text-ink-soft">
                    @{usuario.nickname} · {usuario.equipe}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Botao
                    variante="perigo"
                    disabled={carregandoId === usuario.id}
                    onClick={() => atualizar(usuario.id, { statusCadastro: "REJEITADO" })}
                  >
                    Rejeitar
                  </Botao>
                  <Botao
                    disabled={carregandoId === usuario.id}
                    onClick={() => atualizar(usuario.id, { statusCadastro: "APROVADO" })}
                  >
                    Aprovar
                  </Botao>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-sans text-lg font-extrabold text-ink">Usuários</h2>
        <div className="overflow-x-auto rounded-lg border border-rule">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-parchment-surface font-mono text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Equipe</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Ativo</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3">Progresso</th>
                <th className="px-4 py-3">XP</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {demais.map((usuario) => {
                const souEu = usuario.id === meuId;
                return (
                  <tr key={usuario.id} className="border-t border-rule">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{usuario.nome}</div>
                      <div className="font-mono text-xs text-ink-faint">@{usuario.nickname}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{usuario.equipe}</td>
                    <td className="px-4 py-3">
                      <BadgePill cor={usuario.papel === "ADMIN" ? "amber" : "trail"}>{usuario.papel}</BadgePill>
                    </td>
                    <td className="px-4 py-3">
                      <BadgePill cor={usuario.ativo ? "trail" : "coral"}>
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </BadgePill>
                    </td>
                    <td className="px-4 py-3">
                      <BadgePill cor={usuario.statusCadastro === "REJEITADO" ? "coral" : "trail"}>
                        {ROTULO_STATUS[usuario.statusCadastro]}
                      </BadgePill>
                    </td>
                    <td className="font-variant-tabular px-4 py-3 text-ink-soft">
                      {usuario.modulosConcluidosBasica}/10 · {usuario.modulosConcluidosIntermediaria}/30
                    </td>
                    <td className="font-variant-tabular px-4 py-3 text-ink-soft">{usuario.xpTotal}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Botao
                          variante="texto"
                          disabled={souEu || carregandoId === usuario.id}
                          onClick={() =>
                            atualizar(usuario.id, {
                              papel: usuario.papel === "ADMIN" ? "COLABORADOR" : "ADMIN",
                            })
                          }
                        >
                          {usuario.papel === "ADMIN" ? "Rebaixar" : "Promover"}
                        </Botao>
                        <Botao
                          variante="texto"
                          disabled={souEu || carregandoId === usuario.id}
                          onClick={() => atualizar(usuario.id, { ativo: !usuario.ativo })}
                        >
                          {usuario.ativo ? "Desativar" : "Ativar"}
                        </Botao>
                        {usuario.statusCadastro === "REJEITADO" ? (
                          <Botao
                            variante="texto"
                            disabled={carregandoId === usuario.id}
                            onClick={() => atualizar(usuario.id, { statusCadastro: "APROVADO" })}
                          >
                            Aprovar
                          </Botao>
                        ) : null}
                        <Botao
                          variante="texto"
                          disabled={carregandoId === usuario.id}
                          onClick={() => resetarSenha(usuario)}
                        >
                          Resetar senha
                        </Botao>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
