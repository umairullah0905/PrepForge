"use client";

import QuestCard, { type Quest } from "@/components/QuestCard";
import { blipHover, blipClick } from "@/lib/sound";

const QUESTS: Quest[] = [
  { title: "Reverse a Linked List", cr: 2, difficulty: "Easy", xp: 150, active: true },
  { title: "Binary Tree Zigzag Traversal", cr: 8, difficulty: "Medium", xp: 350 },
  { title: "Trapping Rain Water", cr: 15, difficulty: "Hard", xp: 700 },
  { title: "Two Sum", cr: 1, difficulty: "Easy", xp: 100 },
  { title: "Group Anagrams", cr: 5, difficulty: "Medium", xp: 250 },
  { title: "Merge K Sorted Lists", cr: 18, difficulty: "Hard", xp: 800 },
];

export default function QuestBoard({ muted }: { muted: boolean }) {
  const sfx = {
    hover: () => !muted && blipHover(),
    click: () => !muted && blipClick(),
  };

  return (
    <div className="quest-board">
      {QUESTS.map((q, i) => (
        <QuestCard key={q.title} quest={q} index={i} onHover={sfx.hover} onBegin={sfx.click} />
      ))}
    </div>
  );
}