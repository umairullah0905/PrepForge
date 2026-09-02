"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import QuestMap, { type Topic } from "@/components/QuestMap";
import QuestBoard from "@/components/QuestBoard";
import PlayerBadge from "@/components/PlayerBadge";
import DungeonBackground from "@/components/DungeonBackground";
import { blipHover, blipClick } from "@/lib/sound";
import { xpProgressPercent, type Profile } from "@/lib/progress";

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
  profile,
  completedQuestTitles,
  signOutAction,
  questions,
}: {
  userEmail: string | null;
  profile: Profile | null;
  completedQuestTitles: string[];
  signOutAction: () => void;
  questions: any[];
}) {
  const [muted, setMuted] = useState(true);
  const isLoggedIn = !!userEmail;
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
          <span className="qx-display qx-logo-text">PREP FORGE</span>
        </div>
        <div className="qx-navlinks">
          <a href="#board" onMouseEnter={sfx.hover}>
            Quests
          </a>
          <a href="/company-questions" onMouseEnter={sfx.hover}>
            Company Questions
          </a>
          <a href="/system-design" onMouseEnter={sfx.hover}>
            System Design
          </a>
          <a href="/forums" onMouseEnter={sfx.hover}>
            Forums
          </a>
          <a href="#map" onMouseEnter={sfx.hover}>
            Roadmap
          </a>
          <a href="/community" onMouseEnter={sfx.hover}>
            Community
          </a>
          {isLoggedIn && (
            <a href="/profile" onMouseEnter={sfx.hover}>
              Profile
            </a>
          )}
          {profile && (
            <PlayerBadge
              name={profile.name}
              level={profile.level}
              xpPercent={xpProgressPercent(profile.xp)}
              passed={profile.xp > 0}
            />
          )}
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
          {isLoggedIn ? (
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
            PREP FORGE
          </motion.h1>
          <motion.p variants={fadeUp} className="qx-sub">
            Slay Data Structures. Conquer Algorithms.
          </motion.p>

          {isLoggedIn && profile ? (
            <motion.div variants={fadeUp} className="qx-dash-card">
              <p className="qx-mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
                Good to see you back —
              </p>
              <p className="qx-pixel" style={{ fontSize: 16, color: "var(--mint)", marginTop: 8 }}>
                {profile.name}
              </p>
              <div className="qx-dash-grid">
                <div className="qx-dash-card">
                  <div className="qx-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
                    QUESTS COMPLETED
                  </div>
                  <div className="qx-pixel" style={{ fontSize: 28, color: "var(--mint)", marginTop: 8 }}>
                    {completedQuestTitles.length}
                  </div>
                </div>
                <div className="qx-dash-card">
                  <div className="qx-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
                    LEVEL &amp; XP
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span className="qx-pixel" style={{ fontSize: 20, color: "var(--mint)" }}>
                      LVL {profile.level}
                    </span>
                    <span className="qx-mono" style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 10 }}>
                      {profile.xp} XP total
                    </span>
                  </div>
                  <a
                    href="/profile"
                    className="qx-mono"
                    style={{ fontSize: 11, color: "var(--gold)", display: "inline-block", marginTop: 10 }}
                  >
                    View full profile →
                  </a>
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
          <QuestBoard muted={muted} questions={questions} />
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

      <footer className="qx-footer">Prep Forge — built one dungeon at a time</footer>
    </div>
  );
}