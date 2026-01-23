"use client";

import { useMemo, useState } from "react";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type VideoItem = {
  id: string;
  title: string;
  provider: "youtube" | "vimeo" | "direct";
  url: string;
  thumbnail?: string;
};

type VideoPopupProps = {
  video: VideoItem;
  className?: string;
};

function getEmbedUrl(video: VideoItem) {
  if (video.provider === "youtube") {
    const id = video.url.includes("v=")
      ? new URL(video.url).searchParams.get("v")
      : video.url.split("/").pop();
    return id ? `https://www.youtube.com/embed/${id}` : video.url;
  }
  if (video.provider === "vimeo") {
    const id = video.url.split("/").pop();
    return id ? `https://player.vimeo.com/video/${id}` : video.url;
  }
  return video.url;
}

export default function VideoPopup({ video, className }: VideoPopupProps) {
  const [open, setOpen] = useState(false);
  const embedUrl = useMemo(() => getEmbedUrl(video), [video]);

  return (
    <>
      <button
        type="button"
        className={cn(
          "group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-3xl border border-white/40 bg-neutral-900/80 text-white shadow-lg",
          className
        )}
        onClick={() => setOpen(true)}
      >
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        ) : null}
        <div className="relative z-10 flex items-center gap-3 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">
          <Play className="h-4 w-4" />
          {video.title}
        </div>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 p-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white"
            aria-label="Close video"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-black shadow-2xl">
            <div className="aspect-video w-full">
              <iframe
                title={video.title}
                src={embedUrl}
                className="h-full w-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
