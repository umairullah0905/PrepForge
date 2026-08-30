"use client";

import { motion } from "framer-motion";

export type Quest = {
  title: string;
  cr: number;
  difficulty: "Easy" | "Medium" | "Hard";
  xp: number;
  active?: boolean;
};

const CR_CLASS: Record<Quest["difficulty"], string> = {
  Easy: "quest-cr--easy",
  Medium: "quest-cr--medium",
  Hard: "quest-cr--hard",
};

const CR_SHIELD: Record<Quest["difficulty"], string> = {
  Easy: "🛡️", // gold shield (styled via quest-cr--easy)
  Medium: "🛡️", // silver/dark shield (styled via quest-cr--medium)
  Hard: "🛡️", // red shield (styled via quest-cr--hard)
};

export default function QuestCard({
  quest,
  index = 0,
  onHover,
  onBegin,
}: {
  quest: Quest;
  index?: number;
  onHover?: () => void;
  onBegin?: () => void;
}) {
  return (
    <motion.div
      className={`quest-card ${quest.active ? "quest-card--active" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -4 }}
      onMouseEnter={onHover}
    >
      <div className="quest-card-head">
        <span className={`quest-cr ${CR_CLASS[quest.difficulty]}`}>
          {CR_SHIELD[quest.difficulty]} CR {quest.cr} • {quest.difficulty}
        </span>
        <span className="quest-xp">🏆 +{quest.xp} XP</span>
      </div>
      <div className="quest-title">📜 {quest.title}</div>
      <button className="quest-begin-btn" onClick={onBegin}>
        🔥 BEGIN QUEST
      </button>
    </motion.div>
  );
}
