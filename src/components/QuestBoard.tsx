"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QuestCard, { type Quest } from "@/components/QuestCard";
import { blipHover, blipClick } from "@/lib/sound";
import { completeQuestAction } from "@/app/quest-actions";

export default function QuestBoard({ muted, questions = [] }: { muted: boolean, questions?: any[] }) {
  const sfx = {
    hover: () => !muted && blipHover(),
    click: () => !muted && blipClick(),
  };

  // Only display the latest 6 questions on the home page dashboard
  const displayedQuestions = questions.slice(0, 6);

  return (
    <div className="flex flex-col gap-8 mt-8">
      <div className="quest-board" style={{ marginTop: 0 }}>
        {displayedQuestions.map((q, i) => {
          // Map DB question to Quest type
          const questProp: Quest = {
            id: q.id,
            title: q.title,
            cr: q.platform === 'Codeforces' ? parseInt(q.platform_id.replace(/\D/g, '') || '0') % 20 : parseInt(q.platform_id) % 20 || 5,
            difficulty: q.difficulty as "Easy" | "Medium" | "Hard",
            xp: q.difficulty === 'Easy' ? 100 : q.difficulty === 'Medium' ? 300 : 700,
            active: i === 0,
            url: q.url,
            solution_link: q.solution_link,
            platform: q.platform,
            description: q.description,
            topics: q.topics
          };

          return (
            <QuestCard 
              key={q.id} 
              quest={questProp} 
              index={i} 
              hideDetails={true}
              onHover={sfx.hover} 
              onBegin={() => {
                sfx.click();
                if (q.url) window.open(q.url, '_blank');
              }} 
            />
          );
        })}
        {displayedQuestions.length === 0 && (
          <div className="qx-mono" style={{ color: 'var(--text-dim)', padding: '2rem' }}>
            No bounties found. Go fetch some!
          </div>
        )}
      </div>

      {questions.length > 6 && (
        <div className="flex justify-center mt-4">
          <a 
            href="/quests" 
            className="qx-btn qx-btn-ghost"
            onMouseEnter={sfx.hover}
            onClick={sfx.click}
          >
            VIEW ALL {questions.length} QUESTS →
          </a>
        </div>
      )}
    </div>
  );
}