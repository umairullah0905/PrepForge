"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import QuestMap, { type Topic } from "@/components/QuestMap";
import QuestBoard from "@/components/QuestBoard";
import PlayerBadge from "@/components/PlayerBadge";
import PartyChat from "@/components/PartyChat";
import DungeonBackground from "@/components/DungeonBackground";
import { blipHover, blipClick } from "@/lib/sound";

const TOPICS: Topic[] = [
  { name: "Arrays & Hashing", status: "current", count: 12 },
  { name: "Two Pointers", status: "locked", count: 9 },
  { name: "Stack", status: "locked", count: 7 },
  { name: "Binary Search", status: "locked", count: 8 },
  { name: "Sliding Window", status: "locked", count: 6 },
  { name: "Linked List", status: "locked", count: 11 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

function Reveal({
  children,
  className,
  transition,
}: {
  children: React.ReactNode;
  className?: string;
  transition?: object;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      transition={transition || { duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingContent({
  userEmail,
  signOutAction,
}: {
  userEmail: string | null;
  signOutAction: () => void;
}) {
  const [muted, setMuted] = useState(true);
  const sfx = {
    hover: () => !muted && blipHover(),
    click: () => !muted && blipClick(),
  };

  return (
    <div className="qx-root">
      {/* NAV */}
      <nav className="qx-nav">
        <div className="qx-logo">
          <div className="qx-logo-mark">⚔️</div>
          <span className="qx-display qx-logo-text">DSA QUESTS</span>
        </div>
        <div className="qx-navlinks">
          <a href="#board" onMouseEnter={sfx.hover}>
            Quests
          </a>
          <a href="#map" onMouseEnter={sfx.hover}>
            Roadmap
          </a>
          <PlayerBadge level={5} xpPercent={68} passed />
          <button
            className="qx-sound-toggle"
            onClick={() => {
              setMuted((m) => !m);
              if (muted) blipClick();
            }}
            aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
            title={muted ? "Sound off" : "Sound on"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          {userEmail ? (
            <form action={signOutAction}>
              <button type="submit" className="qx-link" onMouseEnter={sfx.hover}>
                Sign out
              </button>
            </form>
          ) : (
            <a
              href="/login"
              className="qx-btn qx-btn-sm"
              onMouseEnter={sfx.hover}
              onClick={sfx.click}
            >
              SIGN IN
            </a>
          )}
        </div>
      </nav>

      {/* HERO / DASHBOARD */}
      <motion.header
        className="qx-hero"
        variants={heroStagger}
        initial="hidden"
        animate="show"
      >
        <DungeonBackground videoSrc="/backgrounds/dungeon-runes.mp4" />
        <div className="qx-container">
          <motion.h1 variants={fadeUp} className="qx-display qx-h1" style={{ color: "var(--mint)" }}>
            DSA QUESTS
          </motion.h1>
          <motion.p variants={fadeUp} className="qx-sub">
            Slay Data Structures. Conquer Algorithms.
          </motion.p>

          {userEmail ? (
            <motion.div variants={fadeUp} className="qx-dash-card">
              <p className="qx-mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
                Good to see you back —
              </p>
              <p className="qx-pixel" style={{ fontSize: 13, color: "var(--mint)", marginTop: 8 }}>
                {userEmail}
              </p>
              <div className="qx-dash-grid">
                <div className="qx-dash-card">
                  <div className="qx-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
                    OVERALL READINESS
                  </div>
                  <div className="qx-pixel" style={{ fontSize: 28, color: "var(--mint)", marginTop: 8 }}>
                    67%
                  </div>
                </div>
                <div className="qx-dash-card">
                  <div className="qx-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
                    TODAY&rsquo;S PLAN
                  </div>
                  <ul className="qx-dash-list">
                    <li>✅ Arrays — Prefix Sum</li>
                    <li style={{ color: "var(--mint)" }}>→ Sliding Window — 5 problems</li>
                    <li>→ System Design — Caching</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={fadeUp} className="qx-hero-ctas">
              <motion.a
                href="/login"
                className="qx-btn"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={sfx.hover}
                onClick={sfx.click}
              >
                START YOUR QUEST
              </motion.a>
              <motion.a
                href="#board"
                className="qx-btn qx-btn-ghost"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={sfx.hover}
                onClick={sfx.click}
              >
                VIEW QUEST BOARD
              </motion.a>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* QUEST BOARD */}
      <section className="qx-section" id="board">
        <div className="qx-container">
          <Reveal className="qx-section-head">
            <h2 className="qx-pixel qx-section-title">Today&rsquo;s Quest Board</h2>
            <p className="qx-section-desc">
              Pick a bounty. Higher CR means a tougher fight — and a bigger payout.
            </p>
          </Reveal>
          <QuestBoard muted={muted} />
        </div>
      </section>

      {/* QUEST MAP */}
      <section className="qx-section" id="map">
        <div className="qx-container">
          <Reveal className="qx-section-head">
            <h2 className="qx-pixel qx-section-title">Your Quest Map</h2>
            <p className="qx-section-desc">
              Each topic is a level. Clear its questions to unlock the next.
            </p>
          </Reveal>
          <QuestMap topics={TOPICS} muted={muted} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="qx-section">
        <div className="qx-container">
          <Reveal className="qx-section-head">
            <h2 className="qx-pixel qx-section-title">How It Works</h2>
            <p className="qx-section-desc">
              Three steps, on loop, until the map&rsquo;s cleared.
            </p>
          </Reveal>
          <div className="qx-grid3">
            {[
              {
                n: "01",
                t: "Learn",
                b: "Skim the topic brief — pattern, complexity, when it shows up in interviews.",
              },
              {
                n: "02",
                t: "Solve",
                b: "Fight it out in the in-browser IDE with real test cases, in JS, Python, C++, or Java.",
              },
              {
                n: "03",
                t: "Level Up",
                b: "Clear the quest, watch the map unlock, and move on to the next topic.",
              },
            ].map((c, i) => (
              <Reveal key={c.t} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <motion.div
                  className="qx-card"
                  whileHover={{ y: -6, boxShadow: "8px 8px 0 var(--line)" }}
                  onMouseEnter={sfx.hover}
                >
                  <div className="qx-mono qx-card-num">{c.n}</div>
                  <h3 className="qx-pixel qx-card-title">{c.t}</h3>
                  <p className="qx-card-body">{c.b}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer className="qx-footer">DSA Quests — built one dungeon at a time</footer>

      <PartyChat muted={muted} />
    </div>
  );
}