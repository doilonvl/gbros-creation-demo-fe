"use client";

import { usePathname } from "next/navigation";
import FooterStudio from "@/components/layout/FooterStudio";

export default function FooterExplosionGate() {
  const pathname = usePathname();
  if (pathname?.endsWith("/contact") || pathname?.endsWith("/work")) {
    return null;
  }
  return <FooterStudio />;
}
