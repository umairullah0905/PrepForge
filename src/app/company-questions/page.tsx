import { createClient } from '@supabase/supabase-js';

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

  const supabase = createClient(supabaseUrl, supabaseKey);
  
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
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Company Tagged Questions</h1>
        
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <form method="GET" className="flex flex-col md:flex-row gap-4 items-end">
            
            <div className="flex-1 w-full">
               <label htmlFor="company-input" className="block font-semibold text-sm mb-1">Company Name</label>
               <input 
                 type="text" 
                 name="company" 
                 id="company-input"
                 defaultValue={rawCompany} 
                 placeholder="e.g. Google, Apple, Amazon" 
                 className="border border-gray-300 rounded p-2 bg-white w-full"
               />
            </div>
            
            <div className="flex-1 w-full">
               <label htmlFor="topic-input" className="block font-semibold text-sm mb-1">Topic</label>
               <input 
                 type="text" 
                 name="topic" 
                 id="topic-input"
                 defaultValue={topicFilter} 
                 placeholder="e.g. Array, Hash Table, Math" 
                 className="border border-gray-300 rounded p-2 bg-white w-full"
               />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full md:w-auto font-medium">Search</button>
                {(rawCompany || topicFilter) && (
                  <a href="/company-questions" className="text-gray-600 hover:text-black hover:bg-gray-100 px-4 py-2 rounded border border-gray-300 flex items-center justify-center w-full md:w-auto">
                    Clear
                  </a>
                )}
            </div>
          </form>
          <div className="mt-2 text-xs text-gray-500">
             Showing {totalQuestions} total questions. You can now type any part of a company name.
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No questions found matching your criteria.</p>
            <p className="text-sm mt-2 text-gray-400">Try adjusting your spelling or using fewer filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 flex flex-col">
            <table className="w-full text-left border-collapse text-sm md:text-base">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-4 font-semibold w-1/4">Companies</th>
                  <th className="p-4 font-semibold w-1/3">Title</th>
                  <th className="p-4 font-semibold">Difficulty</th>
                  <th className="p-4 font-semibold">Topics</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuestions.map((q) => (
                  <tr key={q.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {q.company_names?.slice(0, 5).map((c: string) => (
                          <span key={c} className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">{c}</span>
                        ))}
                        {q.company_names?.length > 5 && (
                          <span className="text-xs text-gray-500 px-1 pt-1 font-medium">+{q.company_names.length - 5} more</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                        {q.title}
                      </a>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                        q.difficulty === 'EASY' ? 'bg-green-500' : 
                        q.difficulty === 'MEDIUM' ? 'bg-yellow-500' : 
                        q.difficulty === 'HARD' ? 'bg-red-500' : 'bg-gray-500'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {q.topics ? q.topics.split(',').map((t: string) => (
                          <span key={t.trim()} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded-full">{t.trim()}</span>
                        )) : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalQuestions)} of {totalQuestions} results
                </div>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <a 
                      href={`/company-questions?company=${encodeURIComponent(rawCompany)}&topic=${encodeURIComponent(topicFilter)}&page=${currentPage - 1}`} 
                      className="px-4 py-2 border border-gray-300 rounded bg-white text-sm font-medium hover:bg-gray-100"
                    >
                      Previous
                    </a>
                  )}
                  {currentPage < totalPages && (
                    <a 
                      href={`/company-questions?company=${encodeURIComponent(rawCompany)}&topic=${encodeURIComponent(topicFilter)}&page=${currentPage + 1}`} 
                      className="px-4 py-2 border border-gray-300 rounded bg-white text-sm font-medium hover:bg-gray-100"
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
