"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TocItem } from "@/types/blog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type BlogTocProps = {
  items: TocItem[];
  title: string;
  buttonLabel: string;
  showDesktop?: boolean;
  showMobile?: boolean;
};

type TocGroup = {
  id: string;
  text: string;
  level: 2 | 3;
  children: TocItem[];
};

export default function BlogToc({
  items,
  title,
  buttonLabel,
  showDesktop = true,
  showMobile = true,
}: BlogTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const ids = useMemo(() => items.map((item) => item.id), [items]);

  const groups = useMemo<TocGroup[]>(() => {
    const next: TocGroup[] = [];
    items.forEach((item) => {
      if (item.level === 2) {
        next.push({
          id: item.id,
          text: item.text,
          level: item.level,
          children: [],
        });
      } else if (next.length) {
        next[next.length - 1].children.push(item);
      } else {
        next.push({ id: item.id, text: item.text, level: 2, children: [] });
      }
    });
    return next;
  }, [items]);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [manuallyCollapsedIds, setManuallyCollapsedIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    if (!ids.length) return;
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0.2 }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [ids]);

  // Derive collapsed state: auto-expand active parent unless manually collapsed
  const activeParentId = useMemo(() => {
    if (!activeId) return null;
    const parent = groups.find(
      (group) =>
        group.id === activeId ||
        group.children.some((child) => child.id === activeId)
    );
    return parent?.id ?? null;
  }, [activeId, groups]);

  const effectiveCollapsedIds = useMemo(() => {
    const next = new Set(manuallyCollapsedIds);
    // Auto-expand the active parent
    if (activeParentId && next.has(activeParentId)) {
      next.delete(activeParentId);
    }
    return next;
  }, [manuallyCollapsedIds, activeParentId]);

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!items.length) return null;

  const list = (
    <nav className="mt-3 space-y-2 text-sm">
      {groups.map((group) => {
        const isOpen = !effectiveCollapsedIds.has(group.id);
        const isActive =
          activeId === group.id ||
          group.children.some((child) => child.id === activeId);
        return (
          <div key={group.id} className="rounded-xl border border-transparent">
            <button
              type="button"
              onClick={() => {
                setManuallyCollapsedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(group.id)) {
                    next.delete(group.id);
                  } else {
                    next.add(group.id);
                  }
                  return next;
                });
                handleScroll(group.id);
              }}
              className={[
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition",
                group.level === 2 ? "text-base font-semibold" : "font-medium",
                isActive
                  ? "bg-amber-50 text-amber-800 shadow-sm"
                  : "hover:bg-muted/60",
              ].join(" ")}
            >
              <span>{group.text}</span>
              {group.children.length ? (
                <ChevronDown
                  className={[
                    "h-4 w-4 transition-transform duration-300",
                    isOpen ? "rotate-180" : "rotate-0",
                  ].join(" ")}
                />
              ) : null}
            </button>
            {group.children.length ? (
              <div
                className={[
                  "grid transition-all duration-300 ease-out",
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                ].join(" ")}
              >
                <div className="overflow-hidden">
                  <div className="mt-2 space-y-1 px-2 pb-2">
                    {group.children.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleScroll(item.id)}
                        className={[
                          "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                          activeId === item.id
                            ? "bg-amber-100 text-amber-900"
                            : "text-neutral-600 hover:bg-muted/60",
                        ].join(" ")}
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {showDesktop ? (
        <div className="hidden lg:block">
          <div className="rounded-2xl border bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600/80">
              {title}
            </p>
            {list}
          </div>
        </div>
      ) : null}
      {showMobile ? (
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {buttonLabel}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] sm:w-[380px]">
              <SheetHeader>
                <SheetTitle>{title}</SheetTitle>
              </SheetHeader>
              {list}
            </SheetContent>
          </Sheet>
        </div>
      ) : null}
    </>
  );
}
