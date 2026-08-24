import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Quando o CRM é servido debaixo de um prefixo (por exemplo www.esdev.pt/dev),
   * define-se ESDEV_BASE_PATH na compilação e todas as rotas e ficheiros passam
   * a viver nesse prefixo.
   */
  basePath: process.env.ESDEV_BASE_PATH || undefined,
  /**
   * Em desenvolvimento o Next só serve os ficheiros de /_next a pedidos cuja
   * origem esteja declarada aqui — o resto recebe 403 e a página fica sem
   * JavaScript. Inclui o IP da máquina para funcionar quando se abre o CRM
   * noutro dispositivo da rede local (telemóvel, portátil).
   */
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "*.local",
    "10.*.*.*",
    "172.*.*.*",
    "192.168.*.*",
  ],
};

export default nextConfig;
