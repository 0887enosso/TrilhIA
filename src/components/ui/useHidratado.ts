"use client";

import { useEffect, useState } from "react";

/**
 * `false` no HTML do servidor e na primeira renderização do cliente; `true`
 * assim que o React hidrata.
 *
 * Existe por causa de um vazamento real, observado em produção: os
 * formulários do app são `<form onSubmit={...}>` sem `action`, e o handler só
 * passa a existir depois da hidratação. Um clique em "Entrar" antes disso não
 * era ignorado — o navegador fazia o submit PADRÃO, que sem `action` e sem
 * `method` é um GET para a própria URL com os campos na query. A senha
 * digitada ia parar em `/login?nickname=...&senha=...`, ou seja, no histórico
 * do navegador, nos logs de acesso do servidor e no cabeçalho `Referer` de
 * qualquer requisição subsequente.
 *
 * A janela é curta (milissegundos numa conexão boa), mas cresce exatamente
 * quando o usuário está mais propenso a clicar de novo: conexão lenta, aba
 * recém-aberta, primeiro acesso sem cache.
 *
 * Usado junto de `method="post"` no próprio `<form>`: a defesa em profundidade
 * é que, mesmo que algum submit nativo escape, ele vira POST e os valores não
 * entram na URL.
 */
export function useHidratado(): boolean {
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);
  return hidratado;
}
