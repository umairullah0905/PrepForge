"use client";

import { useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Deterministic pseudo-random generator (mulberry32), seeded per index —
// same output on server and client (no hydration mismatch) and pure
// enough for the React Compiler's purity checks.
function seededRandom(seed: number) {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function useStars(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r1 = seededRandom(i * 4 + 1);
        const r2 = seededRandom(i * 4 + 2);
        const r3 = seededRandom(i * 4 + 3);
        const r4 = seededRandom(i * 4 + 4);
        return {
          id: i,
          top: r1 * 100,
          left: r2 * 100,
          size: r3 < 0.85 ? 2 : 3,
          duration: 2 + r3 * 3,
          delay: r4 * 4,
          depth: r4 < 0.5 ? 1 : 2,
        };
      }),
    [count]
  );
}

const ASTEROIDS = [
  { top: "12%", left: "8%", size: 14, depth: 3, color: "var(--primary)" },
  { top: "68%", left: "88%", size: 18, depth: 2, color: "var(--coral)" },
  { top: "80%", left: "6%", size: 10, depth: 4, color: "var(--gold)" },
  { top: "22%", left: "92%", size: 12, depth: 3, color: "var(--mint)" },
];

function ParallaxStar({
  star,
  smx,
  smy,
}: {
  star: ReturnType<typeof useStars>[number];
  smx: ReturnType<typeof useSpring>;
  smy: ReturnType<typeof useSpring>;
}) {
  const shift = useTransform([smx, smy], ([x, y]: number[]) =>
    `translate(${x * star.depth * 2}px, ${y * star.depth * 2}px)`
  );
  return (
    <motion.span
      className="qx-star"
      style={{
        top: `${star.top}%`,
        left: `${star.left}%`,
        width: star.size,
        height: star.size,
        transform: shift,
        animationDuration: `${star.duration}s`,
        animationDelay: `${star.delay}s`,
      }}
    />
  );
}

function ParallaxAsteroid({
  asteroid,
  index,
  smx,
  smy,
}: {
  asteroid: (typeof ASTEROIDS)[number];
  index: number;
  smx: ReturnType<typeof useSpring>;
  smy: ReturnType<typeof useSpring>;
}) {
  const shift = useTransform([smx, smy], ([x, y]: number[]) =>
    `translate(${x * asteroid.depth * 4}px, ${y * asteroid.depth * 4}px)`
  );
  return (
    <motion.span
      className="qx-asteroid"
      style={{
        top: asteroid.top,
        left: asteroid.left,
        width: asteroid.size,
        height: asteroid.size,
        background: asteroid.color,
        transform: shift,
        animationDelay: `${index * 0.6}s`,
      }}
    />
  );
}

export default function Starfield() {
  const stars = useStars(70);
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 40, damping: 20 });
  const smy = useSpring(my, { stiffness: 40, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { innerWidth, innerHeight } = window;
    mx.set((e.clientX / innerWidth - 0.5) * 2);
    my.set((e.clientY / innerHeight - 0.5) * 2);
  }

  return (
    <div
      ref={ref}
      className="qx-starfield"
      onMouseMove={handleMouseMove}
      aria-hidden="true"
    >
      {stars.map((s) => (
        <ParallaxStar key={s.id} star={s} smx={smx} smy={smy} />
      ))}
      {ASTEROIDS.map((a, i) => (
        <ParallaxAsteroid key={i} asteroid={a} index={i} smx={smx} smy={smy} />
      ))}
    </div>
  );
}
