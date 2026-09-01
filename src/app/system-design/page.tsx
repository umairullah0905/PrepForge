export default function SystemDesignPage() {
  return (
    <div className="qx-root" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="qx-nav">
        <div className="qx-logo">
          <div className="qx-logo-mark">⚔️</div>
          <span className="qx-display qx-logo-text">PREP FORGE</span>
        </div>
        <div className="qx-navlinks">
          <a href="/" className="qx-link">Dashboard</a>
          <a href="/forums" className="qx-link">Forums</a>
        </div>
      </nav>

      <div className="qx-container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="qx-section-head">
          <h1 className="qx-pixel qx-section-title">System Design</h1>
          <p className="qx-section-desc">Architect massive systems. Survive the scale.</p>
        </div>

        <div className="flex flex-col gap-6 mt-8">
          <div className="qx-mono" style={{ color: 'var(--text-dim)', padding: '2rem', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: '8px' }}>
            🚧 System Design Quests are currently under construction. 🚧<br/><br/>
            Soon you will be able to design distributed systems, handle massive throughput, and conquer latency bottlenecks right here.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {[
              { title: "Design a URL Shortener", cr: 25, diff: "Medium" },
              { title: "Design a Chat System", cr: 40, diff: "Hard" },
              { title: "Design a Key-Value Store", cr: 55, diff: "Hard" },
            ].map((q) => (
              <div key={q.title} className="quest-card" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <div className="quest-card-head" style={{ marginBottom: '12px' }}>
                  <span className={`quest-cr quest-cr--${q.diff.toLowerCase()}`}>
                    🛡️ CR {q.cr} • {q.diff}
                  </span>
                </div>
                <div className="quest-title" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  🏗️ {q.title}
                </div>
                <button className="quest-begin-btn" disabled style={{ filter: 'grayscale(1)' }}>
                  🔒 LOCKED
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
