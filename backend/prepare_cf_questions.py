import zipfile
import xml.etree.ElementTree as ET
import urllib.request
import json
import os
import re

def parse_sheet(filename):
    with zipfile.ZipFile(filename, 'r') as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in tree.findall('main:si', ns):
                texts = [t.text for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text]
                shared.append(''.join(texts))
        
        rels = {}
        if 'xl/worksheets/_rels/sheet1.xml.rels' in z.namelist():
            rel_tree = ET.fromstring(z.read('xl/worksheets/_rels/sheet1.xml.rels'))
            for rel in rel_tree:
                rels[rel.attrib.get('Id')] = rel.attrib.get('Target')

        sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

        hyperlinks = {}
        for hl in sheet_tree.findall('.//main:hyperlink', ns):
            ref = hl.attrib.get('ref')
            r_id = hl.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            if ref and r_id in rels:
                hyperlinks[ref] = rels[r_id]

        rows = sheet_tree.findall('.//main:row', ns)
        parsed_rows = []
        for row in rows:
            r_num = int(row.attrib.get('r', 0))
            row_data = {}
            for c in row.findall('main:c', ns):
                cref = c.attrib.get('r')
                col = ''.join([ch for ch in cref if ch.isalpha()])
                t = c.attrib.get('t')
                v = c.find('main:v', ns)
                val = v.text if v is not None else ''
                if t == 's' and val.isdigit():
                    val = shared[int(val)]
                hl = hyperlinks.get(cref, '')
                row_data[col] = {'val': val.strip(), 'hl': hl.strip()}
            parsed_rows.append((r_num, row_data))
        return parsed_rows

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cf_xlsx = os.path.join(base_dir, 'cf_problem.xlsx')
    b_xlsx = os.path.join(base_dir, 'b_problem.xlsx')
    c1_xlsx = os.path.join(base_dir, 'c1_problem.xlsx')

    print("Fetching Codeforces official API problemset...")
    try:
        req = urllib.request.Request('https://codeforces.com/api/problemset.problems', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            cf_api_data = json.loads(resp.read().decode('utf-8'))
        cf_api_problems = {
            f"{p['contestId']}{p['index']}".upper(): p
            for p in cf_api_data.get('result', {}).get('problems', [])
        }
        print(f"Loaded {len(cf_api_problems)} problems from Codeforces API.")
    except Exception as e:
        print(f"Warning: Could not load Codeforces API: {e}")
        cf_api_problems = {}

    all_problems = {}

    # 1. cf_problem.xlsx
    print("Parsing cf_problem.xlsx...")
    for r_num, row in parse_sheet(cf_xlsx):
        name = row.get('A', {}).get('val', '')
        code = row.get('B', {}).get('val', '')
        b_hl = row.get('B', {}).get('hl', '')
        rating_str = row.get('C', {}).get('val', '')
        tags_str = row.get('D', {}).get('val', '')

        if not code or 'problem' in name.lower() or 'problem' in code.lower():
            continue

        clean_name = re.sub(r'^\d+\.\s*', '', name).strip()
        m = re.match(r'^(\d+)([A-Za-z]\d*)$', code)
        if not m:
            continue

        contest_id, index = m.group(1), m.group(2).upper()
        pid = f"{contest_id}{index}"

        tags = [t.strip() for t in tags_str.split(',') if t.strip()]
        rating = int(rating_str) if rating_str.isdigit() else None

        all_problems[pid] = {
            'platform': 'Codeforces',
            'platform_id': pid,
            'contest_id': contest_id,
            'index': index,
            'title': clean_name,
            'url': b_hl or f"https://codeforces.com/problemset/problem/{contest_id}/{index}",
            'rating': rating,
            'topics': tags,
            'solution_link': None,
            'sources': ['cf_problem.xlsx']
        }

    # 2. b_problem.xlsx and c1_problem.xlsx
    for fname, path in [('b_problem.xlsx', b_xlsx), ('c1_problem.xlsx', c1_xlsx)]:
        print(f"Parsing {fname}...")
        for r_num, row in parse_sheet(path):
            name = row.get('A', {}).get('val', '')
            code = row.get('B', {}).get('val', '')
            b_hl = row.get('B', {}).get('hl', '')
            m_hl = row.get('M', {}).get('hl', '')
            m_val = row.get('M', {}).get('val', '')

            if not code or any(w in name.lower() or w in code.lower() for w in ['problem', 'averages', 'skip']):
                continue

            m1 = re.match(r'^CF(\d+)(?:-[A-Za-z0-9]+)?-([A-Za-z]\d*)$', code, re.IGNORECASE)
            m2 = re.search(r'codeforces\.com/(?:contest|problemset/problem)/(\d+)/(?:problem/)?([A-Za-z]\d*)', b_hl)

            contest_id, index = None, None
            if m1:
                contest_id, index = m1.group(1), m1.group(2).upper()
            elif m2:
                contest_id, index = m2.group(1), m2.group(2).upper()

            if not contest_id:
                continue

            pid = f"{contest_id}{index}"
            sol_link = m_hl if m_hl else None

            if pid in all_problems:
                all_problems[pid]['sources'].append(fname)
                if sol_link and not all_problems[pid]['solution_link']:
                    all_problems[pid]['solution_link'] = sol_link
            else:
                all_problems[pid] = {
                    'platform': 'Codeforces',
                    'platform_id': pid,
                    'contest_id': contest_id,
                    'index': index,
                    'title': name,
                    'url': f"https://codeforces.com/problemset/problem/{contest_id}/{index}",
                    'rating': None,
                    'topics': [],
                    'solution_link': sol_link,
                    'sources': [fname]
                }

    print(f"Total unique problems extracted: {len(all_problems)}")

    # 3. Enrich with Codeforces API data & compute difficulties
    enriched_count = 0
    for pid, prob in all_problems.items():
        if pid in cf_api_problems:
            enriched_count += 1
            api_info = cf_api_problems[pid]
            if not prob['title'] or len(prob['title']) < 2:
                prob['title'] = api_info.get('name', prob['title'])
            if not prob['topics'] and api_info.get('tags'):
                prob['topics'] = api_info.get('tags', [])
            if not prob['rating'] and api_info.get('rating'):
                prob['rating'] = api_info.get('rating')

        # Compute difficulty
        rating = prob['rating']
        if rating is not None:
            if rating < 1200:
                prob['difficulty'] = 'Easy'
            elif rating < 1900:
                prob['difficulty'] = 'Medium'
            else:
                prob['difficulty'] = 'Hard'
        else:
            # Fallback difficulty based on source file
            if 'c1_problem.xlsx' in prob['sources']:
                prob['difficulty'] = 'Medium'
            elif 'b_problem.xlsx' in prob['sources']:
                prob['difficulty'] = 'Medium'
            else:
                prob['difficulty'] = 'Medium'

        # Default topics if still empty
        if not prob['topics']:
            prob['topics'] = ['algorithms', 'codeforces']

    print(f"Enriched {enriched_count} problems from Codeforces API.")

    out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prepared_cf_questions.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(list(all_problems.values()), f, indent=2, ensure_ascii=False)

    print(f"Saved {len(all_problems)} questions to {out_file}")

if __name__ == '__main__':
    main()
