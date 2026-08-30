"use client";

import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import { blipHover, blipClick } from "@/lib/sound";

export type Topic = {
  name: string;
  status: "current" | "locked" | "cleared";
  count: number;
};

export default function QuestMap({
  topics,
  muted,
}: {
  topics: Topic[];
  muted: boolean;
}) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const currentIndex = topics.findIndex((t) => t.status === "current");

  const sfx = {
    hover: () => !muted && blipHover(),
    click: () => !muted && blipClick(),
  };

  return (
    <div className="qx-map">
      <div className="qx-map-row">
        {topics.map((t, i) => (
          <Fragment key={t.name}>
            <motion.div
              className="qx-node-wrap"
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{
                delay: i * 0.08,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              onMouseEnter={() => {
                setHoveredNode(i);
                sfx.hover();
              }}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {t.status === "current" && (
                <motion.div
                  className="qx-sprite"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                >
                  🧙
                </motion.div>
              )}
              {hoveredNode === i && (
                <motion.div
                  className="qx-node-tooltip qx-mono"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {t.count} questions
                </motion.div>
              )}
              <motion.div
                className={`qx-node ${t.status === "locked" ? "locked" : "current"}`}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.94 }}
                onClick={sfx.click}
              >
                {t.status === "current"
                  ? "🚩"
                  : t.status === "cleared"
                  ? "✅"
                  : "🔒"}
              </motion.div>
              <div className="qx-node-label">{t.name}</div>
              <div className="qx-node-count qx-mono">{t.count}Q</div>
            </motion.div>
            {i < topics.length - 1 && (
              <div className="qx-connector-track">
                <motion.div
                  className="qx-connector-fill"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: i < currentIndex ? 1 : 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 + 0.2 }}
                />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
