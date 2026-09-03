import { createClient } from '@/utils/supabase/server';
import { getCompletedQuestTitles } from "@/lib/progress";

export const revalidate = 0;

export default async function CompanyQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; topic?: string; page?: string }>;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return <div className="p-8 text-red-500">Missing Supabase environment variables.</div>;
  }

  const resolvedParams = await searchParams;
  const rawCompany = resolvedParams.company || "";
  const topicFilter = resolvedParams.topic || "";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const itemsPerPage = 15;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const completedTitles = user ? await getCompletedQuestTitles(supabase, user.id) : [];
  
  // Fetch ALL questions and filter in JS to easily support case-insensitive array matching
  let { data: allQuestions, error } = await supabase
    .from('company_questions')
    .select('*')
    .order('title', { ascending: true }); 

  if (error) {
    return <div className="p-8 text-red-500">Error fetching questions: {error.message}. <br/> Make sure you created the new company_questions table!</div>;
  }
  
  // Client-side filtering in the server component
  let questions = allQuestions || [];
  
  if (rawCompany) {
    const searchCompany = rawCompany.toLowerCase();
    questions = questions.filter(q => 
      q.company_names?.some((c: string) => c.toLowerCase().includes(searchCompany))
    );
  }
  
  if (topicFilter) {
    const searchTopic = topicFilter.toLowerCase();
    questions = questions.filter(q => 
      q.topics?.toLowerCase().includes(searchTopic)
    );
  }

  const totalQuestions = questions.length;
  const totalPages = Math.ceil(totalQuestions / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuestions = questions.slice(startIndex, startIndex + itemsPerPage);

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
          <a href="/forums" className="qx-link">Forums</a>
        </div>
      </nav>

      <div className="qx-container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="qx-section-head">
          <h1 className="qx-pixel qx-section-title">Company Tagged Questions</h1>
          <p className="qx-section-desc">Search questions by company or topic.</p>
        </div>
        
        <div className="mb-8" style={{ background: 'var(--bg-card)', border: '3px solid var(--line)', padding: '24px', boxShadow: '5px 5px 0 var(--line)' }}>
          <form method="GET" className="flex flex-col md:flex-row gap-4 items-end">
            
            <div className="flex-1 w-full">
               <label htmlFor="company-input" className="block font-semibold text-sm mb-2" style={{ color: 'var(--text)' }}>Company Name</label>
               <input 
                 type="text" 
                 name="company" 
                 id="company-input"
                 defaultValue={rawCompany} 
                 placeholder="e.g. Google, Apple, Amazon" 
                 className="w-full rounded p-3 focus:outline-none"
                 style={{ background: 'var(--bg-elevated)', border: '2px solid var(--line)', color: 'var(--text)' }}
               />
            </div>
            
            <div className="flex-1 w-full">
               <label htmlFor="topic-input" className="block font-semibold text-sm mb-2" style={{ color: 'var(--text)' }}>Topic</label>
               <input 
                 type="text" 
                 name="topic" 
                 id="topic-input"
                 defaultValue={topicFilter} 
                 placeholder="e.g. Array, Hash Table, Math" 
                 className="w-full rounded p-3 focus:outline-none"
                 style={{ background: 'var(--bg-elevated)', border: '2px solid var(--line)', color: 'var(--text)' }}
               />
            </div>

            <div className="flex gap-4 w-full md:w-auto">
                <button type="submit" className="qx-btn" style={{ padding: '12px 24px', fontSize: '13px' }}>Search</button>
                {(rawCompany || topicFilter) && (
                  <a href="/company-questions" className="qx-btn qx-btn-ghost flex items-center justify-center" style={{ padding: '12px 24px', fontSize: '13px' }}>
                    Clear
                  </a>
                )}
            </div>
          </form>
          <div className="mt-4 text-xs" style={{ color: 'var(--text-dim)' }}>
             Showing {totalQuestions} total questions. You can now type any part of a company name.
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center" style={{ background: 'var(--bg-card)', border: '3px solid var(--line)', padding: '48px', boxShadow: '5px 5px 0 var(--line)' }}>
            <p style={{ color: 'var(--text)' }}>No questions found matching your criteria.</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-dim)' }}>Try adjusting your spelling or using fewer filters.</p>
          </div>
        ) : (
          <div className="flex flex-col" style={{ background: 'var(--bg-card)', border: '3px solid var(--line)', boxShadow: '5px 5px 0 var(--line)', overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm md:text-base">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--line)', background: 'var(--bg-elevated)' }}>
                    <th className="p-4 font-semibold w-1/4" style={{ color: 'var(--text)' }}>Companies</th>
                    <th className="p-4 font-semibold w-1/3" style={{ color: 'var(--text)' }}>Title</th>
                    <th className="p-4 font-semibold" style={{ color: 'var(--text)' }}>Difficulty</th>
                    <th className="p-4 font-semibold" style={{ color: 'var(--text)' }}>Topics</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQuestions.map((q) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid var(--line)' }} className="hover:bg-opacity-80 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {q.company_names?.slice(0, 5).map((c: string) => (
                            <span key={c} style={{ background: 'var(--line)', color: 'var(--text)' }} className="text-xs px-2 py-1 rounded">{c}</span>
                          ))}
                          {q.company_names?.length > 5 && (
                            <span className="text-xs px-1 pt-1 font-medium" style={{ color: 'var(--text-dim)' }}>+{q.company_names.length - 5} more</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <a href={q.link} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium" style={{ color: 'var(--gold)' }}>
                          {completedTitles.includes(q.title) ? "✅ " : "📜 "} {q.title}
                        </a>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{
                          background: q.difficulty === 'EASY' ? 'rgba(244, 185, 66, 0.18)' : 
                                     q.difficulty === 'MEDIUM' ? 'rgba(156, 163, 175, 0.14)' : 
                                     q.difficulty === 'HARD' ? 'rgba(226, 72, 61, 0.16)' : 'rgba(156, 163, 175, 0.14)',
                          color: q.difficulty === 'EASY' ? 'var(--mint)' : 
                                 q.difficulty === 'MEDIUM' ? 'var(--silver)' : 
                                 q.difficulty === 'HARD' ? 'var(--coral)' : 'var(--silver)',
                          border: `1px solid ${
                            q.difficulty === 'EASY' ? 'rgba(244, 185, 66, 0.35)' : 
                            q.difficulty === 'MEDIUM' ? 'rgba(156, 163, 175, 0.3)' : 
                            q.difficulty === 'HARD' ? 'rgba(226, 72, 61, 0.32)' : 'rgba(156, 163, 175, 0.3)'
                          }`
                        }}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {q.topics ? q.topics.split(',').map((t: string) => (
                            <span key={t.trim()} style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.3)' }} className="text-xs px-2 py-1 rounded">{t.trim()}</span>
                          )) : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-6 border-t" style={{ borderColor: 'var(--line)', background: 'var(--bg-elevated)' }}>
                <div className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalQuestions)} of {totalQuestions} results
                </div>
                <div className="flex gap-4">
                  {currentPage > 1 && (
                    <a 
                      href={`/company-questions?company=${encodeURIComponent(rawCompany)}&topic=${encodeURIComponent(topicFilter)}&page=${currentPage - 1}`} 
                      className="qx-btn qx-btn-ghost"
                    >
                      Previous
                    </a>
                  )}
                  {currentPage < totalPages && (
                    <a 
                      href={`/company-questions?company=${encodeURIComponent(rawCompany)}&topic=${encodeURIComponent(topicFilter)}&page=${currentPage + 1}`} 
                      className="qx-btn qx-btn-ghost"
                    >
                      Next
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
