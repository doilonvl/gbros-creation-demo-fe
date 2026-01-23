"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type MagneticButtonProps = {
  href?: string;
  className?: string;
  children: React.ReactNode;
  strength?: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function MagneticButton({
  href,
  className = "",
  children,
  strength = 18,
  ...props
}: MagneticButtonProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const transform = useMemo(
    () => `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    [offset.x, offset.y],
  );

  const handleMove = (
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = event.clientX - rect.left - rect.width / 2;
    const relY = event.clientY - rect.top - rect.height / 2;
    setOffset({
      x: (relX / rect.width) * strength,
      y: (relY / rect.height) * strength,
    });
  };

  const handleLeave = () => setOffset({ x: 0, y: 0 });

  const sharedProps = {
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    className: `relative inline-flex items-center gap-3 rounded-full border border-[#d9d2f0] bg-white/70 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[#3f2e78] backdrop-blur-xl transition duration-300 hover:border-[#ff6e88] hover:text-[#120b2f] ${className}`,
    style: { transform },
  };

  if (href) {
    return (
      <Link href={href} {...sharedProps}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" {...props} {...sharedProps}>
      {children}
    </button>
  );
}
