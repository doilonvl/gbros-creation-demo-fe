type SectionHeadingProps = {
  kicker?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export default function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const isCentered = align === "center";
  return (
    <div className={isCentered ? "text-center" : ""}>
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
          {kicker}
        </p>
      ) : null}
      <h2 className="mt-3 font-[var(--font-caladea)] text-3xl text-neutral-900 md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm text-neutral-600 md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
