export default function PlayerBadge({
  level,
  xpPercent,
  passed,
}: {
  level: number;
  xpPercent: number;
  passed?: boolean;
}) {
  return (
    <div className="player-badge">
      <div className="player-avatar">🧝</div>
      <div>
        <div className="player-xp-row">
          <span className="qx-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
            XP
          </span>
          <div className="player-xp-track">
            <div
              className="player-xp-fill"
              style={{ width: `${Math.min(100, Math.max(0, xpPercent))}%` }}
            />
          </div>
        </div>
        <div className="player-meta-row">
          <span className="player-lvl">LVL {level}</span>
          {passed && <span className="player-passed">✓ Passed</span>}
        </div>
      </div>
    </div>
  );
}
