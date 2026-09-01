import { createClient } from '@supabase/supabase-js';

// Revalidate the page every 0 seconds to disable caching for testing
export const revalidate = 0;

export default async function TestQuestionsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return <div className="p-8 text-red-500">Missing Supabase environment variables.</div>;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Error fetching questions: {error.message}</div>;
  }

  // Custom CSS to fix Codeforces & LeetCode specific formatting inside Tailwind's reset
  const customCss = `
    .problem-statement { font-family: sans-serif; line-height: 1.6; }
    .problem-statement p { margin-bottom: 1em; }
    .problem-statement .sample-test { margin-top: 1em; }
    .problem-statement .input, .problem-statement .output { border: 1px solid #ccc; margin-bottom: 1em; border-radius: 4px; overflow: hidden; }
    .problem-statement .title { font-weight: bold; background: #f3f4f6; padding: 0.5em; border-bottom: 1px solid #ccc; font-size: 0.9em; }
    .problem-statement pre { padding: 1em; margin: 0; background: #fff; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; }
    .problem-statement ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 1em; }
    .problem-statement li { margin-bottom: 0.5em; }
    .math { overflow-x: auto; display: inline-block; max-width: 100%; }
    /* Fix Tailwind prose affecting divs weirdly */
    .prose div { margin: 0; }
  `;

  return (
    <div className="min-h-screen bg-white text-black">
      <style dangerouslySetInnerHTML={{ __html: customCss }} />
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Fetched DSA Questions</h1>
        
        {questions?.length === 0 ? (
          <p className="text-gray-500">No questions found in the database. Run the backend scripts to fetch some!</p>
        ) : (
          <div className="grid gap-6">
            {questions?.map((q) => (
              <div key={q.id} className="border rounded-lg p-6 shadow-sm bg-white text-black">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-3">
                      <a href={q.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {q.title}
                      </a>
                      {q.solution_link && (
                        <a href={q.solution_link} target="_blank" rel="noopener noreferrer" className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 no-underline font-normal">
                          View Solution
                        </a>
                      )}
                    </h2>
                    <div className="flex gap-2 mt-2 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {q.platform}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        ID: {q.platform_id}
                      </span>
                      <span className={`px-2 py-1 rounded text-white ${
                        q.difficulty === 'Easy' ? 'bg-green-500' : 
                        q.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 flex flex-wrap gap-2">
                  {q.topics && q.topics.map((topic: string, i: number) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {topic}
                    </span>
                  ))}
                </div>

                <details className="mt-4 border-t pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-black">
                    View Description (HTML)
                  </summary>
                  <div className="mt-4 w-full overflow-x-auto">
                    <div 
                      className="prose max-w-none text-sm text-black break-words"
                      dangerouslySetInnerHTML={{ __html: q.description }} 
                    />
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
