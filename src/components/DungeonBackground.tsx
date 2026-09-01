"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/**
 * Fills whatever positioned, overflow-hidden parent it's placed in (the
 * hero section) — not the whole page.
 *
 * When `videoSrc` is set, this plays that video on loop and skips all the
 * "fake motion" layers (Ken Burns zoom, torch flicker, mist, embers) —
 * a real video already has its own motion, stacking CSS animation on top
 * of it just looks busy. What's left:
 *  - a scroll-linked parallax drift (background moves slower than the
 *    page as you scroll the hero out of view)
 *  - cursor-based parallax (subtle shift toward/away from the pointer)
 *  - a readability vignette + a fade into the page background below
 *
 * Without `videoSrc`, it falls back to the static dungeon-hall image.
 */
export default function DungeonBackground({
  videoSrc,
}: {
  videoSrc?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scrollY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  // raw cursor position, -1..1 on each axis relative to the hero's center
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 50, damping: 20 });
  const smy = useSpring(my, { stiffness: 50, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const bounds = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - bounds.left) / bounds.width - 0.5) * 2);
    my.set(((e.clientY - bounds.top) / bounds.height - 0.5) * 2);
  }
  function handleMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  const mediaX = useTransform(smx, (v) => v * 8);
  const mediaY = useTransform(smy, (v) => v * 5);

  return (
    <div
      className="dungeon-bg"
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      <motion.div
        className="dungeon-bg-parallax"
        style={{ y: scrollY, x: mediaX, translateY: mediaY }}
      >
        {videoSrc ? (
          <video
            className="dungeon-bg-media"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <div
            className="dungeon-bg-media dungeon-bg-image"
            style={{ backgroundImage: "url('/backgrounds/dungeon-hall.webp')" }}
          />
        )}
      </motion.div>

      <div className="dungeon-bg-vignette" />
      <div className="dungeon-bg-fade" />
    </div>
  );
}