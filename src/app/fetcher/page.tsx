'use client';

import { useState } from 'react';

export default function FetcherPage() {
  const [platform, setPlatform] = useState('LeetCode');
  const [topic, setTopic] = useState('');
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:4000/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, topic, limit })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: data.message });
      } else {
        setResult({ error: data.error || 'Something went wrong' });
      }
    } catch (err) {
      setResult({ error: 'Failed to connect to the backend server. Is it running on port 4000?' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-black">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Fetch DSA Questions</h1>
        
        <form onSubmit={handleFetch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select 
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="LeetCode">LeetCode</option>
              <option value="Codeforces">Codeforces</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic Tag (Optional)</label>
            <input 
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. dynamic-programming, dp, graph"
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              For LeetCode use slugs like 'dynamic-programming'. For Codeforces use 'dp'.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
            <input 
              type="number"
              min="1"
              max="50"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-2 px-4 rounded font-semibold text-white transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Fetching... (Check terminal for progress)' : 'Fetch Questions'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded ${result.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {result.error || result.success}
          </div>
        )}
        
        <div className="mt-4 text-center">
          <a href="/#board" className="text-sm text-blue-600 hover:underline">
            View Fetched Questions &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
