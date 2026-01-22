"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type ChipItem = {
  label: string;
  value?: string;
};

type ChipsFilterProps = {
  chips: ChipItem[];
  param: string;
  className?: string;
};

export default function ChipsFilter({
  chips,
  param,
  className,
}: ChipsFilterProps) {
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
      {chips.map((chip) => {
        const isActive = (chip.value || "") === active;
        return (
          <button
            key={chip.value || "all"}
            type="button"
            onClick={() => handleClick(chip.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
              isActive
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-900"
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
