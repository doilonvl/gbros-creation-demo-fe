import { redirect } from "next/navigation";
import type { Locale } from "@/types/content";
import { getLocalePrefix } from "@/lib/routes";

type PageParams = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export default async function LegacyBlogDetailPage({ params }: PageParams) {
  const { locale, slug } = await params;
  const prefix = getLocalePrefix(locale);
  redirect(`${prefix}/blogs/${slug}`);
}
