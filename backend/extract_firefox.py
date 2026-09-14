import os
import sys
import json
import shutil
import sqlite3
import tempfile

def get_firefox_leetcode_session():
    # Supports Windows, macOS, and Linux Firefox profiles
    candidate_paths = []
    
    if sys.platform == 'win32':
        appdata = os.environ.get('APPDATA')
        if appdata:
            candidate_paths.append(os.path.join(appdata, 'Mozilla', 'Firefox', 'Profiles'))
    elif sys.platform == 'darwin':
        home = os.path.expanduser('~')
        candidate_paths.append(os.path.join(home, 'Library', 'Application Support', 'Firefox', 'Profiles'))
    else:
        home = os.path.expanduser('~')
        candidate_paths.append(os.path.join(home, '.mozilla', 'firefox'))

    for base in candidate_paths:
        if not os.path.exists(base):
            continue

        profiles = []
        try:
            for p in os.listdir(base):
                db = os.path.join(base, p, 'cookies.sqlite')
                if os.path.exists(db):
                    profiles.append((os.path.getmtime(db), db))
        except Exception:
            continue

        # Check most recently modified profile first
        profiles.sort(reverse=True)

        for _, cookie_db in profiles:
            temp_dir = tempfile.mkdtemp()
            temp_db = os.path.join(temp_dir, 'cookies.sqlite')
            try:
                shutil.copy2(cookie_db, temp_db)
                wal = cookie_db + '-wal'
                if os.path.exists(wal):
                    shutil.copy2(wal, temp_db + '-wal')

                conn = sqlite3.connect(temp_db)
                c = conn.cursor()
                c.execute(
                    "SELECT value FROM moz_cookies WHERE name = 'LEETCODE_SESSION' AND host LIKE '%leetcode.com%' ORDER BY lastAccessed DESC LIMIT 1"
                )
                row = c.fetchone()
                conn.close()

                if row and row[0] and len(row[0].strip()) > 20:
                    return row[0].strip()
            except Exception:
                pass
            finally:
                shutil.rmtree(temp_dir, ignore_errors=True)

    return None

if __name__ == '__main__':
    session = get_firefox_leetcode_session()
    if session:
        print(json.dumps({'success': True, 'sessionCookie': session, 'source': 'firefox'}))
    else:
        print(json.dumps({'success': False, 'error': 'No LEETCODE_SESSION found in Firefox'}))
