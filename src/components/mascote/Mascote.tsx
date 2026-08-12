import Image from "next/image";
import { POSES, type MascotePose } from "./poses";

type MascoteProps = {
  pose: MascotePose;
  /** Altura em pixels — a largura é derivada mantendo a proporção do recorte (~3:4). */
  size?: number;
  className?: string;
  /** Sobrescreve o aria-label padrão da pose, quando o contexto pede um texto mais específico. */
  label?: string;
};

export function Mascote({ pose, size = 96, className, label }: MascoteProps) {
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
        className="h-full w-full object-contain"
      />
    </span>
  );
}
