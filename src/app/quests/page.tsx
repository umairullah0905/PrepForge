import { createClient } from "@/utils/supabase/server";
import ClientQuestsView from "./ClientQuestsView";
import { getCompletedQuestTitles } from "@/lib/progress";

export const revalidate = 0;

export default async function QuestsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  const completedTitles = user ? await getCompletedQuestTitles(supabase, user.id) : [];

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="qx-root" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* MINIMAL NAV */}
      <nav className="qx-nav">
        <div className="qx-logo">
          <div className="qx-logo-mark">⚔️</div>
          <span className="qx-display qx-logo-text">PREP FORGE</span>
        </div>
        <div className="qx-navlinks">
          <a href="/#board" className="qx-link">← Back to Dashboard</a>
        </div>
      </nav>

      <div className="qx-container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="qx-section-head">
          <h1 className="qx-pixel qx-section-title">All Quests</h1>
          <p className="qx-section-desc">Browse the entire bounty board by topic.</p>
        </div>
        
        <ClientQuestsView questions={questions || []} completedTitles={completedTitles} />
      </div>
    </div>
  );
}

