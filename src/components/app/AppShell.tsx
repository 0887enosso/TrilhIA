import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopHud } from "./TopHud";
import type { ResumoUsuario } from "@/lib/usuario";

export function AppShell({ usuario, children }: { usuario: ResumoUsuario; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar ehAdmin={usuario.papel === "ADMIN"} />
      <div className="pl-20 print:pl-0">
        <TopHud usuario={usuario} />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
