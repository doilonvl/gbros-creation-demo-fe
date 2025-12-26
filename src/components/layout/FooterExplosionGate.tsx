"use client";

import { usePathname } from "next/navigation";
import { FooterExplosion } from "@/components/layout/FooterExplosion";

export default function FooterExplosionGate() {
  const pathname = usePathname();
  if (pathname?.endsWith("/contact") || pathname?.endsWith("/work")) {
    return null;
  }
  return <FooterExplosion />;
}
