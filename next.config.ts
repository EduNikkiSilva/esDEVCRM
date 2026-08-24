import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
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
