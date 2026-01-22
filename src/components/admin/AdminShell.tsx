/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getLocalePrefix } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { hasRefreshTokenCookie, refreshAccessToken } from "@/lib/auth";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  NotebookText,
  Package,
  Star,
} from "lucide-react";

type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  slug?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, slug: "" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { key: "industries", label: "Industries", icon: Boxes, slug: "industries" },
      {
        key: "service-categories",
        label: "Service Categories",
        icon: Boxes,
        slug: "service-categories",
      },
      { key: "services", label: "Services", icon: Boxes, slug: "services" },
      {
        key: "service-packages",
        label: "Service Packages",
        icon: Package,
        slug: "service-packages",
      },
      {
        key: "addons",
        label: "Add-ons",
        icon: Package,
        slug: "addons",
      },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "portfolios", label: "Portfolios", icon: Star, slug: "portfolios" },
      { key: "blogs", label: "Blogs", icon: NotebookText, slug: "blogs" },
      {
        key: "media-assets",
        label: "Media Assets",
        icon: Boxes,
        slug: "media-assets",
      },
    ],
  },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = String(params?.locale || "vi");
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const loginPath = localePrefix ? `${localePrefix}/login` : "/login";
  const adminBase = `${localePrefix}/admin`;

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin.sidebar") === "collapsed";
  });
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    if (collapsed) localStorage.setItem("admin.sidebar", "collapsed");
    else localStorage.removeItem("admin.sidebar");
  }, [collapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let mounted = true;

    const attemptRefresh = async () => {
      if (!mounted || refreshInFlightRef.current) return;
      if (!hasRefreshTokenCookie()) return;
      refreshInFlightRef.current = true;
      try {
        await refreshAccessToken();
      } finally {
        refreshInFlightRef.current = false;
      }
    };

    void attemptRefresh();
    const interval = window.setInterval(attemptRefresh, 10 * 60 * 1000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("logout failed", err);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }
      router.replace(loginPath);
    }
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* SIDEBAR */}
      <aside
        className={[
          "hidden shrink-0 border-r bg-card transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-64",
        ].join(" ")}
      >
        <div className="flex h-dvh w-full flex-col">
          {/* Header */}
          <div className="px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!collapsed && (
                  <div>
                    <p className="text-sm font-semibold">G-Bros Admin</p>
                    <p className="text-xs text-muted-foreground">
                      Studio Console
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-1"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? "M? r?ng sidebar" : "Thu g?n sidebar"}
                title={collapsed ? "M? r?ng" : "Thu g?n"}
              >
                {collapsed ? (
                  <ChevronsRight className="size-4" />
                ) : (
                  <ChevronsLeft className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <Separator />

          {/* Nav */}
          <ScrollArea className="flex-1">
            <nav className="space-y-4 px-2 py-3">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label} className="space-y-1">
                  {!collapsed ? (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {section.label}
                    </p>
                  ) : null}
                  {section.items.map((it) => {
                    const path = it.slug ? `/admin/${it.slug}` : "/admin";
                    const href = path;
                    const isDashboard = !it.slug;
                    const active = isDashboard
                      ? pathname === adminBase || pathname === `${adminBase}/`
                      : pathname === `${localePrefix}${path}` ||
                        pathname.startsWith(`${localePrefix}${path}/`);
                    const Icon = it.icon;

                    return (
                      <Link
                        key={it.key}
                        href={href as any}
                        className={[
                          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                          active
                            ? "bg-accent text-accent-foreground shadow-sm"
                            : "hover:bg-muted",
                        ].join(" ")}
                        title={collapsed ? it.label : undefined}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="size-4 opacity-80 group-hover:opacity-100" />
                        {!collapsed && (
                          <span className="truncate">{it.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </ScrollArea>

          <Separator />

          {/* Footer: Avatar + Logout */}
          <div className="p-3">
            <div
              className={[
                "flex items-center gap-3 rounded-md px-2 py-2",
                collapsed ? "justify-center" : "",
              ].join(" ")}
            >
              <Avatar className="size-8">
                <AvatarImage src="" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-5">
                    Admin
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                      admin@gmedia.vn
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              className={[
                "w-full justify-start gap-2",
                collapsed ? "justify-center" : "",
              ].join(" ")}
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="size-4" />
              {!collapsed && "Logout"}
            </Button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1">
        {/* Topbar (mobile) */}
        <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold">G-Bros Admin</span>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
