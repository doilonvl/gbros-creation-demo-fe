"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type TabItem = {
  label: string;
  value?: string;
};

type TabsFilterProps = {
  tabs: TabItem[];
  param: string;
  className?: string;
};

export default function TabsFilter({
  tabs,
  param,
  className,
}: TabsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams?.get(param) || "";

  const handleClick = (value?: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (!value) {
      params.delete(param);
    } else {
      params.set(param, value);
      params.delete("page");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tabs.map((tab) => {
        const isActive = (tab.value || "") === active;
        return (
          <button
            key={tab.value || "all"}
            type="button"
            onClick={() => handleClick(tab.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
              isActive
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
