import type { Locale } from "@/types/content";
import VideoPopup, { type VideoItem } from "@/components/common/VideoPopup";
import SectionHeading from "@/components/sections/public/SectionHeading";

type VideoShowcaseProps = {
  locale: Locale;
  videos: VideoItem[];
};

export default function VideoShowcase({ locale, videos }: VideoShowcaseProps) {
  return (
    <section className="py-16" data-nav-theme="light">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          kicker="Video"
          title={locale === "en" ? "Motion stories" : "Video noi bat"}
          description={
            locale === "en"
              ? "Keep visitors engaged with real campaigns and behind-the-scenes footage."
              : "Cac thuoc phim chan thuc tu du an va hau truong."
          }
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoPopup key={video.id} video={video} />
          ))}
        </div>
      </div>
    </section>
  );
}
