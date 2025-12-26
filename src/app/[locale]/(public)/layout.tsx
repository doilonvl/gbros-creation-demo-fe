import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/request";
import { Toaster } from "@/components/ui/sonner";
import FooterExplosionGate from "@/components/layout/FooterExplosionGate";
import Navbar from "@/components/Navbar/Navbar";
import NfMenuOverlay from "@/components/MenuOverlay/MenuOverlay";
import { NfTransitionProvider } from "@/components/NfPageTransition";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
// import Header from "@/components/layout/Header";

export function generateStaticParams() {
  return [{ locale: "vi" }, { locale: "en" }];
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  const resolvedLocale = locale as Locale;
  setRequestLocale(resolvedLocale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      <NfTransitionProvider>
        <Suspense>
          <ProgressBar />
        </Suspense>
        <Navbar />
        <NfMenuOverlay />
        {children}
        <FooterExplosionGate />
        <Toaster />
      </NfTransitionProvider>
    </NextIntlClientProvider>
  );
}
