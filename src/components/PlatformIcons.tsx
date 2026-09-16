import React from "react";

export function CodeforcesIcon({ className = "w-3.5 h-3.5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <rect x="2" y="10" width="5" height="12" rx="1.5" fill="#ECA627" />
      <rect x="9.5" y="3" width="5" height="19" rx="1.5" fill="#1872D1" />
      <rect x="17" y="6" width="5" height="16" rx="1.5" fill="#F03838" />
    </svg>
  );
}

export function LeetCodeIcon({ className = "w-3.5 h-3.5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <path
        d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.874 5.874 0 0 0 .349 1.017 5.938 5.938 0 0 0 4.857 3.593 5.792 5.792 0 0 0 1.258-.027 5.98 5.98 0 0 0 2.274-.836l.169-.109 3.673-2.61a1.442 1.442 0 0 0 .584-1.127 1.446 1.446 0 0 0-.584-1.127l-3.256-2.316a1.442 1.442 0 0 0-1.688 0 1.442 1.442 0 0 0 0 2.254l2.097 1.492-2.906 2.067a3.1 3.1 0 0 1-1.18.435 3.013 3.013 0 0 1-.653.014 3.09 3.09 0 0 1-2.527-1.87 3.056 3.056 0 0 1-.182-.53 2.875 2.875 0 0 1-.032-1.229 2.742 2.742 0 0 1 .63-1.096l3.854-4.126 4.908-5.253a1.442 1.442 0 0 0 0-2.254A1.374 1.374 0 0 0 13.483 0z"
        fill="#FFA116"
      />
      <path
        d="M20.612 14.882h-8.08a1.442 1.442 0 0 0-1.442 1.442 1.442 1.442 0 0 0 1.442 1.442h8.08a1.442 1.442 0 0 0 1.442-1.442 1.442 1.442 0 0 0-1.442-1.442z"
        fill="#9CA3AF"
      />
    </svg>
  );
}

export function PlatformIcon({
  platform,
  className = "w-3.5 h-3.5",
}: {
  platform?: string;
  className?: string;
}) {
  const p = platform?.toLowerCase();
  if (p === "codeforces") {
    return <CodeforcesIcon className={className} />;
  }
  if (p === "leetcode") {
    return <LeetCodeIcon className={className} />;
  }
  return null;
}
