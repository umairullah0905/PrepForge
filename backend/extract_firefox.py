import os
import sys
import json
import shutil
import sqlite3
import tempfile

def get_firefox_profiles():
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

    profiles = []
    for base in candidate_paths:
        if not os.path.exists(base):
            continue
        try:
            for p in os.listdir(base):
                db = os.path.join(base, p, 'cookies.sqlite')
                if os.path.exists(db):
                    profiles.append((os.path.getmtime(db), db))
        except Exception:
            continue

    profiles.sort(reverse=True)
    return [p[1] for p in profiles]

def get_firefox_leetcode_session():
    for cookie_db in get_firefox_profiles():
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

def get_firefox_codeforces_session():
    for cookie_db in get_firefox_profiles():
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
                "SELECT name, value, host, path FROM moz_cookies WHERE host LIKE '%codeforces.com%'"
            )
            rows = c.fetchall()
            conn.close()

            if not rows:
                continue

            cookies = []
            has_auth = False
            handle = None

            for name, value, host, path in rows:
                cookies.append({
                    'name': name,
                    'value': value,
                    'domain': host,
                    'path': path
                })
                if name in ('JSESSIONID', '39ce7') and len(value) > 10:
                    has_auth = True
                if name == 'X-User' and value:
                    handle = value

            if has_auth:
                return {
                    'cookies': cookies,
                    'handle': handle
                }
        except Exception:
            pass
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    return None

if __name__ == '__main__':
    platform = sys.argv[1].lower() if len(sys.argv) > 1 else 'leetcode'

    if platform == 'codeforces':
        res = get_firefox_codeforces_session()
        if res:
            print(json.dumps({
                'success': True,
                'sessionCookies': json.dumps(res['cookies']),
                'handle': res['handle'] or 'codeforces_user',
                'source': 'firefox'
            }))
        else:
            print(json.dumps({'success': False, 'error': 'No active Codeforces session in Firefox'}))
    else:
        session = get_firefox_leetcode_session()
        if session:
            print(json.dumps({'success': True, 'sessionCookie': session, 'source': 'firefox'}))
        else:
            print(json.dumps({'success': False, 'error': 'No LEETCODE_SESSION found in Firefox'}))
