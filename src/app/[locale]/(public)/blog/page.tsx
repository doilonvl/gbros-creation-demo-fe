import { redirect } from "next/navigation";
import type { Locale } from "@/types/content";
import { getLocalePrefix } from "@/lib/routes";

type PageParams = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{ page?: string; tag?: string }>;
};

export default async function LegacyBlogPage({ params, searchParams }: PageParams) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const prefix = getLocalePrefix(locale);
  const query = new URLSearchParams();
  if (sp.page) query.set("page", sp.page);
  if (sp.tag) query.set("tag", sp.tag);
  const queryString = query.toString();
  redirect(queryString ? `${prefix}/blogs?${queryString}` : `${prefix}/blogs`);
}
