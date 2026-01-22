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
      className={cn(
        "rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-neutral-900">
        {locale === "en" ? "Book a service" : "Dang ky dich vu"}
      </h3>
      <p className="mt-2 text-sm text-neutral-600">
        {locale === "en"
          ? "Leave your info and we will reach out quickly."
          : "De lai thong tin, G-Bros se lien he nhanh."}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          name="name"
          required
          placeholder={locale === "en" ? "Full name" : "Ho va ten"}
          className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
        />
        <input
          name="phone"
          required
          placeholder={locale === "en" ? "Phone" : "So dien thoai"}
          className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
        />
        <input
          name="email"
          placeholder={
            locale === "en" ? "Email (optional)" : "Email (tuy chon)"
          }
          className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
        />
        <select
          name="service"
          className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
        >
          <option value="">
            {locale === "en" ? "Select service" : "Chon dich vu"}
          </option>
          <option value="photo">Photo</option>
          <option value="video">Video</option>
          <option value="styling">Styling</option>
          <option value="design">Design</option>
        </select>
        <input
          name="package"
          placeholder={
            locale === "en" ? "Package (optional)" : "Goi (tuy chon)"
          }
          className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm md:col-span-2"
        />
        <textarea
          name="message"
          rows={4}
          placeholder={locale === "en" ? "Your message" : "Noi dung"}
          className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm md:col-span-2"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-neutral-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white"
        >
          {locale === "en" ? "Send request" : "Gui yeu cau"}
        </button>
        <a
          href="https://www.facebook.com"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-neutral-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-700"
        >
          Facebook
        </a>
        <a
          href="https://www.instagram.com"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-neutral-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-700"
        >
          Instagram
        </a>
      </div>

      {submitted ? (
        <p className="mt-4 text-sm text-emerald-600">
          {locale === "en"
            ? "Thanks! We will contact you shortly."
            : "Cam on! Chung toi se lien he som."}
        </p>
      ) : null}
    </form>
  );
}
