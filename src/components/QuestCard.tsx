"use client";

import { motion } from "framer-motion";

export type Quest = {
  id?: string;
  title: string;
  cr: number;
  difficulty: "Easy" | "Medium" | "Hard";
  xp: number;
  active?: boolean;
  url?: string;
  solution_link?: string;
  platform?: string;
  description?: string;
  topics?: string[];
  completed?: boolean;
};

const CR_CLASS: Record<Quest["difficulty"], string> = {
  Easy: "quest-cr--easy",
  Medium: "quest-cr--medium",
  Hard: "quest-cr--hard",
};

const CR_SHIELD: Record<Quest["difficulty"], string> = {
  Easy: "🗡️", // dagger — novice fight
  Medium: "🛡️", // shield — proper skirmish
  Hard: "🐉", // dragon — boss-tier
};

export default function QuestCard({
  quest,
  index = 0,
  hideDetails = false,
  onHover,
  onBegin,
}: {
  quest: Quest;
  index?: number;
  hideDetails?: boolean;
  onHover?: () => void;
  onBegin?: () => void;
}) {
  return (
    <motion.div
      className={`quest-card ${quest.active && !quest.completed ? "quest-card--active" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -4 }}
      onMouseEnter={onHover}
    >
      <div className="quest-card-head">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className={`quest-cr ${CR_CLASS[quest.difficulty]}`}>
            {CR_SHIELD[quest.difficulty]} CR {quest.cr} • {quest.difficulty}
          </span>
          {quest.platform && <span className="quest-platform-tag">{quest.platform}</span>}
        </div>
        <span className="quest-xp">🏆 +{quest.xp} XP</span>
      </div>

      <div className="quest-title">
        {quest.completed ? "✅" : "📜"} {quest.title}
      </div>

      {quest.completed ? (
        <div className="quest-completed-pill">✅ QUEST COMPLETE</div>
      ) : (
        <div className="quest-actions-row">
          {!hideDetails && quest.id && (
            <a
              href={`/quests/${quest.id}`}
              className="quest-begin-btn"
              style={{ flex: "1 1 auto", textDecoration: "none" }}
              onClick={(e) => e.stopPropagation()}
            >
              📖 VIEW DETAILS
            </a>
          )}
          <button
            className="quest-begin-btn quest-begin-btn--ghost"
            style={{ flex: "1 1 auto" }}
            onClick={onBegin}
          >
            🔗 OPEN
          </button>
          {quest.solution_link && (
            <button
              className="quest-begin-btn quest-begin-btn--purple"
              onClick={(e) => {
                e.stopPropagation();
                window.open(quest.solution_link, "_blank");
              }}
            >
              💡 SOLUTION
            </button>
          )}
          <a
            href="/forums"
            className="quest-begin-btn quest-begin-btn--amber-ghost"
            style={{ textDecoration: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            💬 DISCUSS
          </a>
        </div>
      )}
    </motion.div>
  );
}