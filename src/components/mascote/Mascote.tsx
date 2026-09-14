import Image from "next/image";
import { POSES, type MascotePose } from "./poses";

type MascoteProps = {
  pose: MascotePose;
  /** Altura em pixels — a largura é derivada mantendo a proporção do recorte (~3:4). */
  size?: number;
  className?: string;
  /** Sobrescreve o aria-label padrão da pose, quando o contexto pede um texto mais específico. */
  label?: string;
  /**
   * Carrega a imagem imediatamente, em vez de esperar ela entrar na tela.
   * Serve pra pré-carregar poses que vão aparecer de repente depois de uma
   * ação (ver PrecarregarPoses) — sem isso o `next/image` usa lazy loading e
   * a pose só começa a baixar no instante em que aparece.
   */
  prioridade?: boolean;
};

export function Mascote({ pose, size = 96, className, label, prioridade = false }: MascoteProps) {
  const largura = Math.round((size * 3) / 4);

  return (
    <span
      role="img"
      aria-label={label ?? POSES[pose]}
      className={className}
      style={{ display: "inline-block", width: largura, height: size }}
    >
      <Image
        src={`/mascote/${pose}.png`}
        alt=""
        width={largura}
        height={size}
        priority={prioridade}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

/**
 * Baixa as poses de reação enquanto o usuário ainda está lendo a questão.
 *
 * Medido em produção: a barra de feedback só monta depois da resposta, então
 * a pose dela só COMEÇAVA a ser baixada aí — 425ms de imagem, fazendo o
 * mascote aparecer quase 900ms depois do clique, bem depois do texto do
 * resultado. A reação chegava atrasada justamente no momento que ela existe
 * pra comemorar.
 *
 * As poses são renderizadas de verdade (não `display:none`, que faria o
 * lazy loading nunca disparar) num canto de 1px invisível, com o mesmo
 * `size` da barra de feedback — o `next/image` gera a mesma URL otimizada,
 * então quando a barra monta a imagem já está no cache.
 */
const POSES_DE_FEEDBACK: MascotePose[] = ["comemorando", "cansado", "pensando"];

export function PrecarregarPoses({ size = 72 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0"
    >
      {POSES_DE_FEEDBACK.map((pose) => (
        <Mascote key={pose} pose={pose} size={size} prioridade />
      ))}
    </div>
  );
}
