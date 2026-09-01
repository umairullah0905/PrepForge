import { createClient } from "@/utils/supabase/server";

export const revalidate = 0;

export default async function QuestDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: question } = await supabase
    .from('questions')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!question) {
    return (
      <div className="qx-root" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="qx-container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
          <h1 className="qx-pixel qx-h1">Quest Not Found</h1>
          <p className="qx-sub">This bounty might have been claimed already.</p>
          <a href="/quests" className="qx-btn" style={{ marginTop: '2rem' }}>← Back to Quests</a>
        </div>
      </div>
    );
  }

  return (
    <div className="qx-root" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* MINIMAL NAV */}
      <nav className="qx-nav">
        <div className="qx-logo">
          <div className="qx-logo-mark">⚔️</div>
          <span className="qx-display qx-logo-text">PREP FORGE</span>
        </div>
        <div className="qx-navlinks">
          <a href="/quests" className="qx-link">← Back to Board</a>
        </div>
      </nav>

      <div className="qx-container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div style={{ backgroundColor: 'white', color: 'black', padding: '2rem', borderRadius: '8px', border: '1px solid #ccc' }}>
          
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="qx-pixel" style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'black' }}>
                {question.title}
              </h1>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  {question.platform}
                </span>
                <span className={`quest-cr quest-cr--${question.difficulty.toLowerCase()}`}>
                  🛡️ {question.difficulty}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {question.solution_link && (
                <a 
                  href={question.solution_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="qx-btn"
                  style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }}
                >
                  💡 SOLUTION
                </a>
              )}
              <a 
                href={question.url}
                target="_blank"
                rel="noopener noreferrer"
                className="qx-btn"
              >
                🔥 START EXTERNALLY
              </a>
              <a 
                href="/forums"
                className="qx-btn"
                style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}
              >
                💬 DISCUSS
              </a>
            </div>
          </div>

          {question.topics && question.topics.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {question.topics.map((t: string, i: number) => (
                <span key={i} style={{ fontSize: '14px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '999px', border: '1px solid #bfdbfe' }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
            <style dangerouslySetInnerHTML={{ __html: `
              .problem-statement { font-family: sans-serif; line-height: 1.6; }
              .problem-statement p { margin-bottom: 1em; }
              .problem-statement .sample-test { margin-top: 1em; }
              .problem-statement .input, .problem-statement .output { border: 1px solid #e5e7eb; margin-bottom: 1em; border-radius: 6px; overflow: hidden; }
              .problem-statement .title { font-weight: bold; background: #f9fafb; padding: 0.5em 1em; border-bottom: 1px solid #e5e7eb; font-size: 0.9em; }
              .problem-statement pre { padding: 1em; margin: 0; background: #f8fafc; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.9em; border: 1px solid #e2e8f0; border-radius: 4px; }
              .problem-statement ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 1em; }
              .problem-statement li { margin-bottom: 0.5em; }
              .math { overflow-x: auto; display: inline-block; max-width: 100%; }
              .expanded-desc img { max-width: 100%; height: auto; }
              .expanded-desc pre { padding: 1em; background: #f8fafc; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.9em; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 1em; }
            `}} />
            
            <div 
              className="expanded-desc"
              style={{ fontSize: '16px', lineHeight: '1.6', color: '#334155', wordBreak: 'break-word', overflowX: 'auto', width: '100%' }}
              dangerouslySetInnerHTML={{ __html: question.description }} 
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}
