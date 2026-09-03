"use client";

import { useState, useMemo } from "react";
import QuestCard, { type Quest } from "@/components/QuestCard";
import { blipHover, blipClick } from "@/lib/sound";

export default function ClientQuestsView({ questions = [], completedTitles = [] }: { questions?: any[], completedTitles?: string[] }) {
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [muted, setMuted] = useState(false);
  
  const sfx = {
    hover: () => !muted && blipHover(),
    click: () => !muted && blipClick(),
  };

  // Group questions by topic
  const { topics, questionsByTopic } = useMemo(() => {
    const topicMap: Record<string, any[]> = { 'All': questions };
    
    questions.forEach(q => {
      if (q.topics && q.topics.length > 0) {
        q.topics.forEach((topic: string) => {
          if (!topicMap[topic]) topicMap[topic] = [];
          topicMap[topic].push(q);
        });
      } else {
        if (!topicMap['Uncategorized']) topicMap['Uncategorized'] = [];
        topicMap['Uncategorized'].push(q);
      }
    });

    const sortedTopics = Object.keys(topicMap).sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return a.localeCompare(b);
    });

    return { topics: sortedTopics, questionsByTopic: topicMap };
  }, [questions]);

  const displayedQuestions = questionsByTopic[selectedTopic] || [];

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-8">
      {/* Topics Sidebar */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
        {topics.map(topic => (
          <button
            key={topic}
            onClick={() => { sfx.click(); setSelectedTopic(topic); }}
            onMouseEnter={sfx.hover}
            className={`text-left px-4 py-3 rounded border transition-colors flex justify-between items-center ${
              selectedTopic === topic 
                ? 'bg-[var(--mint)] text-[var(--bg)] border-[var(--mint)] font-bold' 
                : 'bg-transparent text-[var(--text)] border-[var(--line)] hover:border-[var(--mint)]'
            }`}
          >
            <span className="truncate pr-2 qx-pixel" style={{ fontSize: '14px' }}>{topic}</span>
            <span className="qx-mono" style={{ fontSize: '12px', opacity: 0.8 }}>
              {questionsByTopic[topic].length}
            </span>
          </button>
        ))}
      </div>

      {/* Quest Cards Grid */}
      <div className="flex-1 quest-board" style={{ marginTop: 0 }}>
        {displayedQuestions.map((q, i) => {
          const isCompleted = completedTitles.includes(q.title);
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
            topics: q.topics,
            completed: isCompleted
          };

          return (
            <QuestCard 
              key={q.id} 
              quest={questProp} 
              index={i} 
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
            No bounties found for this topic.
          </div>
        )}
      </div>
    </div>
  );
}
