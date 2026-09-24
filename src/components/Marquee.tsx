"use client";

export default function Marquee({
  items,
  speed = 32,
  pauseOnHover = false,
  className = "",
}: {
  items: string[];
  /** seconds for one full loop — lower is faster */
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`group relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${className}`}
    >
      <div
        className={`flex w-max items-center gap-12 pr-12 animate-prepforge-marquee ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        }`}
        style={{ animationDuration: `${speed}s` }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="shrink-0 whitespace-nowrap font-mono text-sm sm:text-base font-semibold tracking-wide text-zinc-500 transition-colors hover:text-zinc-200"
          >
            {item}
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes prepforge-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-prepforge-marquee {
          animation-name: prepforge-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}