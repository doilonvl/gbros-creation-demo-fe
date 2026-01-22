"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FilterPopover, { type FilterOption } from "@/components/common/FilterPopover";

type QueryFilterPopoverProps = {
  label: string;
  param: string;
  options: FilterOption[];
  className?: string;
  align?: "left" | "right";
};

export default function QueryFilterPopover({
  label,
  param,
  options,
  className,
  align,
}: QueryFilterPopoverProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeValue = searchParams?.get(param) || "";

  const handleChange = (value?: string) => {
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
    <FilterPopover
      label={label}
      options={options}
      activeValue={activeValue}
      onChange={handleChange}
      className={className}
      align={align}
    />
  );
}
