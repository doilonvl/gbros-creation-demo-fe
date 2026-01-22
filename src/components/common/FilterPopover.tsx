"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterOption = {
  label: string;
  value?: string;
};

type FilterPopoverProps = {
  label: string;
  options: FilterOption[];
  activeValue?: string;
  onChange?: (value?: string) => void;
  className?: string;
  align?: "left" | "right";
};

export default function FilterPopover({
  label,
  options,
  activeValue = "",
  onChange,
  className,
  align = "left",
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const activeLabel = useMemo(() => {
    const match = options.find((option) => (option.value || "") === activeValue);
    return match?.label || options[0]?.label || label;
  }, [activeValue, label, options]);

  const clearTimers = () => {
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleOpen = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
    }
    openTimeoutRef.current = window.setTimeout(() => {
      setOpen(true);
    }, 120);
  };

  const scheduleClose = () => {
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 160);
  };

  useEffect(
    () => () => {
      clearTimers();
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (value?: string) => {
    onChange?.(value);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-700 transition",
          "hover:border-amber-400/70 hover:text-neutral-900",
          open
            ? "border-neutral-900 text-neutral-900"
            : "shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]"
        )}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
          {label}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-900">
          {activeLabel}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-neutral-500 transition-transform duration-200",
            open ? "rotate-180" : ""
          )}
        />
      </button>

      <div
        className={cn(
          "absolute top-full z-20 mt-3 w-64 rounded-2xl border border-white/60 bg-white/95 p-3 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur",
          "transition duration-200",
          align === "right" ? "right-0" : "left-0",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        )}
        role="menu"
      >
        <div className="flex max-h-56 flex-wrap gap-2 overflow-auto pr-1">
          {options.map((option) => {
            const value = option.value || "";
            const isActive = value === activeValue;
            return (
              <button
                key={`${label}-${option.label}-${value}`}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
                  isActive
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-amber-400/70 hover:text-neutral-900"
                )}
                role="menuitem"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
