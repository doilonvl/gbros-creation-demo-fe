"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLocalePrefix } from "@/lib/routes";

export default function AdminHome() {
  const params = useParams();
  const locale = String(params?.locale || "vi");
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const adminBase = `${localePrefix}/admin`;

  return (
    <div className="space-y-6">
      <Card className="border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
          Welcome to G-Bros Console
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage services, portfolios, and blog content in one place. Drafts are
          supported so you can prepare content before publishing.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="default">
            <Link href={`${adminBase}/services`}>Add service</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`${adminBase}/portfolios`}>Add portfolio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`${adminBase}/blogs`}>Add blog</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`${adminBase}/media-assets`}>Upload media</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
