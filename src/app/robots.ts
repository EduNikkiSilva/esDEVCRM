import type { MetadataRoute } from "next";

/**
 * Um CRM privado não tem nada a fazer em motores de busca. Isto, mais o
 * cabeçalho X-Robots-Tag do vercel.json, mantém o endereço fora do Google.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
