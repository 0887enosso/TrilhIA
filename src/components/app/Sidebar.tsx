"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mascote } from "@/components/mascote/Mascote";
import { LogoutButton } from "./LogoutButton";
import {
  IconeInicio,
  IconeTrilha,
  IconeRaio,
  IconeMedalha,
  IconeTrofeu,
  IconeFerramenta,
} from "./icones";

const ITENS = [
  { href: "/inicio", rotulo: "Início", Icone: IconeInicio, destaque: false },
  { href: "/desafio-diario", rotulo: "Desafio diário", Icone: IconeRaio, destaque: true },
  { href: "/trilha", rotulo: "Trilha", Icone: IconeTrilha, destaque: false },
  { href: "/conquistas", rotulo: "Conquistas", Icone: IconeMedalha, destaque: false },
  { href: "/liga", rotulo: "Liga", Icone: IconeTrofeu, destaque: false },
] as const;

/**
 * Sidebar em modo "trilha de acesso": recolhida por padrão (só ícones),
 * expande ao passar o mouse por cima e volta a recolher assim que o mouse
 * sai — não é um estado que o usuário alterna e fica, é sempre transitório.
 * `onFocus`/`onBlur` (que borbulham no React, diferente do DOM nativo)
 * fazem o mesmo acontecer navegando por teclado, senão quem usa Tab nunca
 * veria os rótulos dos itens.
 *
 * Fica com `position: fixed` sobrepondo o conteúdo quando expandida (em vez
 * de empurrá-lo) — a área de conteúdo sempre reserva só a largura recolhida,
 * então passar o mouse perto da borda não faz a página inteira "pular".
 */
export function Sidebar({ ehAdmin }: { ehAdmin: boolean }) {
  const pathname = usePathname();
  const [expandido, setExpandido] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpandido(true)}
      onMouseLeave={() => setExpandido(false)}
      onFocus={() => setExpandido(true)}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setExpandido(false);
      }}
      className={`fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r-2 border-rule bg-parchment-surface transition-[width] duration-200 print:hidden ${
        expandido ? "w-60 shadow-2xl" : "w-20"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <Link href="/inicio" className="flex flex-none items-center">
          <Mascote pose="sorrindo" size={36} />
        </Link>
        <span
          className={`overflow-hidden whitespace-nowrap font-sans text-lg font-extrabold text-ink transition-opacity duration-150 ${
            expandido ? "opacity-100" : "opacity-0"
          }`}
        >
          TrilhIA
        </span>
      </div>

      <nav className="relative flex flex-1 flex-col gap-1.5 px-4">
        <div
          aria-hidden="true"
          className="absolute bottom-3 left-[38px] top-3 w-0.5 border-l-2 border-dashed border-rule-strong"
        />

        {ITENS.map((item) => {
          const ativo =
            item.href === "/inicio" ? pathname === "/inicio" : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.rotulo}
              className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors ${
                item.destaque
                  ? "btn-blaze text-white"
                  : ativo
                    ? "bg-trail-soft text-trail-strong"
                    : "bg-parchment-surface text-ink-soft hover:bg-trail-soft hover:text-trail-strong"
              }`}
            >
              <item.Icone className="h-5 w-5 flex-none" />
              <span className={`overflow-hidden whitespace-nowrap transition-opacity duration-150 ${expandido ? "opacity-100" : "opacity-0"}`}>
                {item.rotulo}
              </span>
            </Link>
          );
        })}

        {ehAdmin ? (
          <Link
            href="/admin"
            title="Painel admin"
            className={`relative flex items-center gap-3 rounded-2xl bg-parchment-surface px-3 py-2.5 text-sm font-bold transition-colors ${
              pathname?.startsWith("/admin")
                ? "bg-amber-soft text-amber-strong"
                : "text-ink-soft hover:bg-amber-soft hover:text-amber-strong"
            }`}
          >
            <IconeFerramenta className="h-5 w-5 flex-none" />
            <span className={`overflow-hidden whitespace-nowrap transition-opacity duration-150 ${expandido ? "opacity-100" : "opacity-0"}`}>
              Painel admin
            </span>
          </Link>
        ) : null}
      </nav>

      <div className="border-t-2 border-rule px-3 py-3">
        <LogoutButton />
      </div>
    </aside>
  );
}
