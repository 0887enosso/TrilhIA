// As poses do mascote — cada uma é um PNG com fundo transparente em
// public/mascote/{pose}.png (ver src/components/mascote/Mascote.tsx). O
// rótulo é o texto acessível padrão (aria-label) — pode ser sobrescrito por
// tela.
export const POSES = {
  andando: "Mascote da trilha caminhando, conferindo a bússola",
  sorrindo: "Mascote da trilha sorrindo, em pé",
  comemorando: "Mascote da trilha comemorando, com os braços erguidos",
  tchau: "Mascote da trilha acenando",
  pensando: "Mascote da trilha concentrado, observando algo com uma lupa",
  cansado: "Mascote da trilha cansado, sem energia",
  certificado: "Mascote da trilha segurando um certificado",
  sentado: "Mascote da trilha sentado, descansando",
  parar: "Mascote da trilha com a mão erguida, sinalizando para parar",
  pulando: "Mascote da trilha pulando de comemoração",
} as const;

export type MascotePose = keyof typeof POSES;
