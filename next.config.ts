import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const fromEnv = (process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS?.split(",") ?? [])
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["http://localhost:3000", ...fromEnv],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);