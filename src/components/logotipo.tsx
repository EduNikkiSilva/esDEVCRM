import { cn } from "@/lib/utils";

/**
 * Logótipo esDEV em vetor: "es" com o gradiente azul da marca e "DEV" na cor do
 * texto envolvente (branco na barra lateral escura, azul-escuro em fundo claro).
 *
 * Para usar o ficheiro original em vez desta versão vetorial, coloca a imagem em
 * `public/logo.png` (e, se tiveres uma versão para fundos escuros,
 * `public/logo-branco.png`). A aplicação passa a usá-la automaticamente.
 */
export function LogoEsdev({
  className,
  tagline = false,
  id = "esdev",
}: {
  className?: string;
  tagline?: boolean;
  id?: string;
}) {
  return (
    <svg
      viewBox={tagline ? "0 0 420 128" : "0 0 420 96"}
      role="img"
      aria-label="esDEV — Web, CRM, E-commerce"
      className={cn("h-auto w-auto", className)}
    >
      <defs>
        <linearGradient id={`${id}-azul`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%" stopColor="#0b57ff" />
          <stop offset="45%" stopColor="#2b9bff" />
          <stop offset="100%" stopColor="#0b57ff" />
        </linearGradient>
      </defs>

      <text
        x="0"
        y="76"
        fontFamily="'Arial Black', 'Helvetica Neue', var(--font-geist-sans), Impact, sans-serif"
        fontSize="92"
        fontWeight={900}
        letterSpacing="-6"
      >
        <tspan fill={`url(#${id}-azul)`}>es</tspan>
        <tspan fill="currentColor">DEV</tspan>
      </text>

      {tagline ? (
        <text
          x="2"
          y="116"
          fontFamily="'Arial Black', Arial, var(--font-geist-sans), sans-serif"
          fontSize="17"
          fontWeight={800}
          letterSpacing="7.5"
          fill={`url(#${id}-azul)`}
        >
          WEB • CRM • E-COMMERCE
        </text>
      ) : null}
    </svg>
  );
}
