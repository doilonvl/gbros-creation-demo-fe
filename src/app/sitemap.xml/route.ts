import { getSiteUrl } from "@/lib/env";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type SitemapUrl = {
  loc: string;
  lastmod: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

function toUrlEntry({ loc, lastmod, changefreq, priority }: SitemapUrl) {
  return (
    "  <url>\n" +
    `    <loc>${xmlEscape(loc)}</loc>\n` +
    `    <lastmod>${xmlEscape(lastmod)}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority.toFixed(1)}</priority>\n` +
    "  </url>"
  );
}

export async function GET() {
  const base = getSiteUrl();

  const now = new Date().toISOString();
  const staticUrls: SitemapUrl[] = [
    {
      loc: `${base}/`,
      lastmod: now,
      changefreq: "weekly",
      priority: 1.0,
    },
    {
      loc: `${base}/en`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.9,
    },
  ];

  const urls = staticUrls.map(toUrlEntry).join("\n");
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    "</urlset>\n";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
