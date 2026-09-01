export default function ForumsPage() {
  return (
    <div className="qx-root" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="qx-nav">
        <div className="qx-logo">
          <div className="qx-logo-mark">⚔️</div>
          <span className="qx-display qx-logo-text">PREP FORGE</span>
        </div>
        <div className="qx-navlinks">
          <a href="/" className="qx-link">Dashboard</a>
          <a href="/system-design" className="qx-link">System Design</a>
        </div>
      </nav>

      <div className="qx-container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="qx-section-head">
          <h1 className="qx-pixel qx-section-title">The Tavern (Forums)</h1>
          <p className="qx-section-desc">Discuss tough bounties. Share strategies with other adventurers.</p>
        </div>

        <div className="flex flex-col gap-6 mt-8">
          <div className="qx-mono" style={{ color: 'var(--text-dim)', padding: '2rem', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: '8px', marginBottom: '2rem' }}>
            🚧 The Forums are currently being built. 🚧<br/><br/>
            Soon you will be able to post your solutions, ask questions about difficult topics, and upvote the best explanations.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { topic: "Dynamic Programming", title: "How do you intuitively come up with the state transitions?", replies: 24, author: "Mage_Coder" },
              { topic: "System Design", title: "When to choose Cassandra over MongoDB?", replies: 15, author: "Architect_Bob" },
              { topic: "Graphs", title: "Dijkstra vs Bellman-Ford: A quick cheat sheet", replies: 89, author: "PathfinderX" },
              { topic: "Two Pointers", title: "Stuck on Trapping Rain Water, please help!", replies: 5, author: "NoobSlayer" },
            ].map((thread) => (
              <div key={thread.title} style={{ padding: '1.5rem', border: '1px solid var(--line)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--mint)', border: '1px solid var(--mint)', padding: '2px 8px', borderRadius: '4px', marginBottom: '8px', display: 'inline-block' }}>
                    {thread.topic}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0' }}>{thread.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: '8px 0 0 0' }}>
                    Started by {thread.author}
                  </p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--mint)' }}>{thread.replies}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Replies</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
