"use client";

import { useState } from "react";

type ShareRowProps = {
  url: string;
};

export default function ShareRow({ url }: ShareRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
        Share
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-neutral-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-700 transition hover:border-neutral-900"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
