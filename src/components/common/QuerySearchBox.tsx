"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type QuerySearchBoxProps = {
  param: string;
  placeholder?: string;
  className?: string;
  variant?: "default" | "collapse";
};

export default function QuerySearchBox({
  param,
  placeholder,
  className,
  variant = "default",
}: QuerySearchBoxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentValue = searchParams?.get(param) || "";
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLFormElement>(null);
  const [expanded, setExpanded] = useState(() => Boolean(currentValue));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams?.toString());
    const value = inputRef.current?.value?.trim() || "";
    if (!value) {
      params.delete(param);
    } else {
      params.set(param, value);
      params.delete("page");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setExpanded(false);
  };

  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !wrapperRef.current?.contains(target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expanded]);

  const handleExpand = () => {
    if (expanded) return;
    setExpanded(true);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  if (variant === "collapse") {
    const hasValue = Boolean(currentValue);
    return (
      <form
        ref={wrapperRef}
        onSubmit={onSubmit}
        className={cn(
          "relative flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-2 transition",
          expanded ? "shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)]" : "",
          className
        )}
        aria-expanded={expanded}
      >
        <button
          type="button"
          onClick={handleExpand}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
        </button>
        {hasValue && !expanded ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" />
        ) : null}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            expanded ? "w-48 opacity-100" : "w-0 opacity-0"
          )}
        >
          <input
            key={currentValue}
            ref={inputRef}
            defaultValue={currentValue}
            placeholder={placeholder}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setExpanded(false);
              }
            }}
            className="w-48 bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
          />
        </div>
        <button
          type="submit"
          className={cn(
            "rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition",
            expanded
              ? "opacity-100"
              : "pointer-events-none w-0 px-0 opacity-0"
          )}
        >
          Go
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2",
        className
      )}
    >
      <Search className="h-4 w-4 text-neutral-500" />
      <input
        key={currentValue}
        ref={inputRef}
        defaultValue={currentValue}
        placeholder={placeholder}
        className="w-40 bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400 md:w-52"
      />
      <button
        type="submit"
        className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
      >
        Go
      </button>
    </form>
  );
}
