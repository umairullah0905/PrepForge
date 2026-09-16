import json
import os
import time
import urllib.request
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    prep_file = os.path.join(base_dir, 'prepared_cf_questions.json')
    out_file = os.path.join(base_dir, 'cf_statements.json')

    with open(prep_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    print(f"Loaded {len(questions)} questions to fetch statements for.")

    def fetch_one(q):
        cid = q.get('contest_id')
        idx = q.get('index')
        pid = q.get('platform_id')
        sol_link = q.get('solution_link')

        if not cid or not idx:
            return pid, None, "Missing contest_id or index"

        url = f"https://codeforces.com/problemset/problem/{cid}/{idx}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        })

        for attempt in range(2):
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    soup = BeautifulSoup(resp.read().decode('utf-8', errors='ignore'), 'html.parser')
                    statement = soup.find('div', class_='problem-statement')
                    if statement:
                        header = statement.find('div', class_='header')
                        if header:
                            header.decompose()
                        
                        # If solution link exists, append video solution callout
                        if sol_link:
                            sol_html = BeautifulSoup(f'''
                            <div style="margin-top: 2rem; padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); border-radius: 8px;">
                                <span style="font-size: 0.9rem; color: #a1a1aa;">Need an editorial walkthrough?</span>
                                <a href="{sol_link}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.35); padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; text-decoration: none;">
                                    Watch Video Solution ↗
                                </a>
                            </div>
                            ''', 'html.parser')
                            statement.append(sol_html)

                        return pid, str(statement), None
                    else:
                        return pid, None, "No .problem-statement found"
            except Exception as e:
                if attempt == 0:
                    time.sleep(1)
                    continue
                return pid, None, str(e)
        return pid, None, "Failed after retries"

    results = {}
    success_count = 0
    fail_count = 0

    print("Starting parallel fetch with 6 worker threads...")
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=6) as executor:
        future_to_pid = {executor.submit(fetch_one, q): q['platform_id'] for q in questions}

        done = 0
        total = len(future_to_pid)

        for future in as_completed(future_to_pid):
            pid = future_to_pid[future]
            done += 1
            try:
                ret_pid, html, err = future.result()
                if html:
                    results[ret_pid] = html
                    success_count += 1
                else:
                    fail_count += 1
            except Exception as e:
                fail_count += 1

            if done % 50 == 0 or done == total:
                elapsed = time.time() - start_time
                print(f"Progress: {done}/{total} ({success_count} success, {fail_count} failed) - {elapsed:.1f}s elapsed")

    print(f"\nFetch complete in {time.time() - start_time:.2f}s!")
    print(f"Total succeeded: {success_count}, Total failed: {fail_count}")

    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False)

    print(f"Saved {len(results)} statement HTMLs to {out_file}")

if __name__ == '__main__':
    main()
