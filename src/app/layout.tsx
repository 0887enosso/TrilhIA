import type { Metadata } from "next";
import { Nunito, Lora } from "next/font/google";
import { TrilhaBackdrop } from "@/components/app/TrilhaBackdrop";
import { Noise } from "@/components/reactbits/Noise";
import "./globals.css";

// Fontes servidas pelo próprio domínio (next/font baixa no build e embute) —
// nada de CDN externo em runtime, sem requisição bloqueante e sem o pulo de
// layout típico de @import de webfont. Até esta rodada o app usava só fontes
// de sistema, o que significava, na prática, uma tipografia diferente por
// sistema operacional (a serifada configurada só existe no macOS).
// Sem `weight`: as duas são fontes variáveis no Google Fonts, então uma única
// família cobre todos os pesos que a interface usa.
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrilhIA",
  description: "Letramento em Inteligência Artificial para o escritório.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${lora.variable}`}>
      <body className="bg-trilha-paper min-h-screen font-sans text-ink antialiased">
        <TrilhaBackdrop />
        <Noise />
        {children}
      </body>
    </html>
  );
}
