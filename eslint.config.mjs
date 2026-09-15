// Configuração do ESLint em flat config.
//
// O projeto nunca teve arquivo de configuração: o script era `next lint` e,
// sem `.eslintrc`, ele não checava nada de fato. O `next lint` foi removido no
// Next 16, o que tornou a ausência visível — então, em vez de só consertar o
// script, o lint passou a existir de verdade.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // O conteúdo das trilhas entra por `JSON.parse`, que devolve `any` por
      // definição. A tipagem acontece na fronteira (ver src/lib/content.ts),
      // e trocar isso por `unknown` exigiria uma validação em runtime que os
      // testes de conteúdo já fazem de outro jeito. Fica como aviso: sinaliza
      // `any` novo sem transformar um padrão deliberado em erro de build.
      "@typescript-eslint/no-explicit-any": "warn",

      // Regras novas do plugin de hooks alinhado ao React Compiler. Apontam
      // padrões legítimos aqui — animação disparada por mudança de prop
      // (Coracoes, ContadorCoracoes) e efeitos de componentes adaptados do
      // React Bits. Valem como aviso, para aparecerem em código novo, mas não
      // como erro: a correção envolve reescrever componentes que hoje
      // funcionam e estão verificados em produção.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  {
    // Scripts de manutenção rodam fora do app e lidam com JSON solto.
    files: ["scripts/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
];
