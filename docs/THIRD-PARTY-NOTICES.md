# Avisos de terceiros

## React Bits

`src/components/reactbits/` contém componentes adaptados de [React Bits](https://reactbits.dev) (código-fonte em [github.com/DavidHDev/react-bits](https://github.com/DavidHDev/react-bits)), copyright © 2026 David Haz, sob licença **MIT + Commons Clause v1.0**.

- Uso permitido, inclusive comercial, como parte de uma aplicação — exatamente o caso aqui (os componentes rodam dentro do TrilhIA, não são revendidos nem redistribuídos como biblioteca à parte).
- Cada arquivo em `src/components/reactbits/` traz um comentário no topo linkando pro componente original e explicando o que foi alterado — nenhum foi usado sem modificação; todos tiveram cor/paleta trocada pro design system do TrilhIA, e alguns (`EtapaIndicador.tsx`, `MagicCard.tsx`) são adaptações mais livres, não cópias diretas (ver comentário de cada um para o racional).
- Componentes usados: `Noise`, `CountUp`, `StarBorder`, `ClickSpark`, `GlareHover`, `EtapaIndicador` (inspirado no `Stepper`), `MagicCard` (extraído do `ParticleCard` dentro do `MagicBento`), `DecryptedText`.
- Dependências novas trazidas só por causa desses componentes: `motion` (usada pelo `CountUp`), `gsap` (usada pelo `MagicCard`). `DecryptedText` e `EtapaIndicador` foram reescritos sem dependências externas.
- `Topography` (que usava `ogl` para WebGL) foi removido — só era usado no fundo da tela de login, que agora usa o mesmo fundo (`TrilhaBackdrop` + `Noise`) do resto do app, por consistência visual.

Texto completo da licença: [github.com/DavidHDev/react-bits/blob/main/LICENSE.md](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md).
