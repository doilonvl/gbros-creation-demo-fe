"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/types/content";
import { cn } from "@/lib/utils";

type ContactFormProps = {
  locale: Locale;
  className?: string;
};

export default function ContactForm({ locale, className }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-6", className)}
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">
          {locale === "en" ? "Project inquiry" : "Gui yeu cau"}
        </p>
        <h3 className="mt-3 text-2xl font-[var(--font-caladea)] uppercase tracking-[0.18em] text-neutral-900">
          {locale === "en" ? "Tell us about your vision" : "Ke ve y tuong"}
        </h3>
      </div>

      <div className="grid gap-5">
        <input
          name="name"
          required
          placeholder={locale === "en" ? "Full name" : "Ho va ten"}
          className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        <input
          name="email"
          required
          placeholder={locale === "en" ? "Email" : "Email"}
          className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        <input
          name="budget"
          placeholder={locale === "en" ? "Estimated budget" : "Ngan sach du kien"}
          className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        <textarea
          name="message"
          rows={4}
          placeholder={locale === "en" ? "Project details" : "Mo ta du an"}
          className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-6">
        <button
          type="submit"
          className="nf-magnetic nf-magnetic--dark"
        >
          {locale === "en" ? "Send" : "Gui"}
        </button>
        <div className="text-[10px] uppercase tracking-[0.35em] text-neutral-400">
          {locale === "en"
            ? "We respond within 48 hours."
            : "Hoi dap trong 48 gio."}
        </div>
      </div>

      {submitted ? (
        <p className="text-sm text-emerald-600">
          {locale === "en"
            ? "Thanks! We will contact you shortly."
            : "Cam on! Chung toi se lien he som."}
        </p>
      ) : null}
    </form>
  );
}
