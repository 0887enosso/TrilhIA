import type { Metadata } from "next";
import { TrilhaBackdrop } from "@/components/app/TrilhaBackdrop";
import { Noise } from "@/components/reactbits/Noise";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrilhIA",
  description: "Letramento em Inteligência Artificial para o escritório.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="bg-trilha-paper min-h-screen font-sans text-ink antialiased">
        <TrilhaBackdrop />
        <Noise />
        {children}
      </body>
    </html>
  );
}
