import Link from "next/link";

export default function TopicCard({
  href,
  bannerSrc,
  eyebrow = "QUEST TRACK",
  title,
  description,
  level = "BEGINNER",
}: {
  href: string;
  bannerSrc: string;
  eyebrow?: string;
  title: string;
  description: string;
  level?: string;
}) {
  return (
    <Link href={href} className="topic-card">
      <div
        className="topic-card-banner"
        style={{ backgroundImage: `url('${bannerSrc}')` }}
      />
      <div className="topic-card-body">
        <div className="topic-card-eyebrow qx-mono">{eyebrow}</div>
        <h3 className="topic-card-title qx-pixel">{title}</h3>
        <p className="topic-card-desc">{description}</p>
        <div className="topic-card-level">
          <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
            <rect x="0" y="7" width="3" height="5" rx="0.5" fill="currentColor" />
            <rect x="5" y="4" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.85" />
            <rect x="10" y="0" width="3" height="12" rx="0.5" fill="currentColor" opacity="0.5" />
          </svg>
          {level}
        </div>
      </div>
    </Link>
  );
}
