import type { MetadataRoute } from "next";

/**
 * Permite instalar o CRM como aplicação (Chrome/Edge: "Instalar página como
 * aplicação"), com ícone e janela próprios.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "esDEV CRM",
    short_name: "esDEV",
    description:
      "CRM interno da esDEV: pipeline, briefings, calculadora de preços, propostas, projetos, faturação e manutenção.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    lang: "pt-PT",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
