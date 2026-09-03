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
  Easy: "🛡️", // gold shield (styled via quest-cr--easy)
  Medium: "🛡️", // silver/dark shield (styled via quest-cr--medium)
  Hard: "🛡️", // red shield (styled via quest-cr--hard)
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
      className={`quest-card ${quest.active ? "quest-card--active" : ""}`}
      style={{ backgroundColor: 'white', color: 'black', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      onMouseEnter={onHover}
    >
      <div className="quest-card-head" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`quest-cr ${CR_CLASS[quest.difficulty]}`}>
            {CR_SHIELD[quest.difficulty]} CR {quest.cr} • {quest.difficulty}
          </span>
          {quest.platform && (
            <span style={{ fontSize: '12px', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              {quest.platform}
            </span>
          )}
        </div>
        <span className="quest-xp" style={{ color: '#4ade80' }}>🏆 +{quest.xp} XP</span>
      </div>
      
      <div className="quest-title" style={{ color: 'black', marginBottom: '16px', fontSize: '1.1rem', fontWeight: 'bold' }}>
        {quest.completed ? "✅ " : "📜 "} {quest.title}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {!hideDetails && quest.id && (
          <a 
            href={`/quests/${quest.id}`}
            className="quest-begin-btn" 
            style={{ backgroundColor: 'var(--mint)', color: 'var(--bg)', border: 'none', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
            onClick={(e) => { e.stopPropagation(); }}
          >
            📖 VIEW DETAILS
          </a>
        )}
        <button 
          className="quest-begin-btn" 
          style={{ backgroundColor: 'transparent', color: 'black', border: '1px solid #ccc' }}
          onClick={onBegin}
        >
          🔗 OPEN EXTERNALLY
        </button>
        {quest.solution_link && (
          <button 
            className="quest-begin-btn" 
            style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }}
            onClick={(e) => { e.stopPropagation(); window.open(quest.solution_link, '_blank'); }}
          >
            💡 SOLUTION
          </button>
        )}
        <a 
          href="/forums"
          className="quest-begin-btn" 
          style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
          onClick={(e) => { e.stopPropagation(); }}
        >
          💬 DISCUSS
        </a>
      </div>
    </motion.div>
  );
}
