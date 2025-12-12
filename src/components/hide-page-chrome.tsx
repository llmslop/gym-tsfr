"use client";

import { usePathname } from "@/i18n/navigation";

export function HidePageChrome({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const path = usePathname();
  return !path.startsWith("/auth/") && children;
}
