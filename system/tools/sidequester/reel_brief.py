#!/usr/bin/env python3
"""Everything Tab wrote about one reference, before a recreation starts (LESSONS 172).
python system/tools/sidequester/reel_brief.py <shortcode> [--save <folder>]
Prints the queue row, the master row, the template and the library entry. Exit 1 = no entry: measure it."""
import argparse, csv, os, re, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
KIT = os.path.join(ROOT, 'assets', 'references', 'sidequester-kit')
LIB = os.path.join(KIT, 'pdf-text', '00003369-tal_reference_library.txt')
MASTER = os.path.join(KIT, 'sources', 'Tal_NoMoney_Series_Master_v2.md')
TEMPLATES = os.path.join(ROOT, 'skills', 'tal-video-editor', 'formats', 'no-money-templates.md')
HEAD = re.compile(r'^([CDB][A-Za-z0-9_-]{10})(?: \S |\s*$)', re.M)
NOISE = re.compile(r'^(?:--- page \d+ ---|\d{1,3})$', re.M)


def read(p):
    return open(p, encoding='utf-8', errors='replace').read()


def entries(code):
    """Every block in the library that opens with this reel's id, up to the next reel or section."""
    t = read(LIB)
    out = []
    for m in re.finditer(r'^' + re.escape(code) + r'(?: \S |\s*$)', t, re.M):
        nxt = next((h.start() for h in HEAD.finditer(t, m.end()) if h[1] != code), len(t))
        block = NOISE.sub('', t[m.start():nxt])
        out.append(re.sub(r'\n{2,}', '\n', block).strip())
    return out


def mentions(code):
    """Lines elsewhere in the library that name the reel, for reels without an entry of their own."""
    t = NOISE.sub('', read(LIB))
    return [' '.join(t[max(0, m.start() - 160):m.end() + 240].split()) for m in re.finditer(re.escape(code), t)][:6]


def queue(code):
    with open(os.path.join(KIT, 'reel-queue.csv'), encoding='utf-8', errors='replace', newline='') as f:
        return [r for r in csv.DictReader(f) if r.get('shortcode') == code]


def rows(path, code):
    if not os.path.exists(path):
        return []
    return [l.strip() for l in read(path).split('\n') if code in l and l.lstrip().startswith('|')]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('code')
    ap.add_argument('--save')
    a = ap.parse_args()
    code = re.sub(r'.*/(?:reel|p)/', '', a.code).strip('/').split('?')[0]
    parts = [f'# {code}']
    q = queue(code)
    if q:
        r = q[0]
        parts.append(f"QUEUE: {r['template']} / {r['type']} / {r['country']}\nmake: {r['what_to_make']}\nhis note: {r['tals_note'] or '(none)'}\nstatus: {r['status']}")
    m = rows(MASTER, code)
    if m:
        parts.append('MASTER:\n' + '\n'.join(m[:4]))
    tmpl = m and re.search(r'\| (T\d+) \|', m[0])
    if tmpl:
        tr = [l.strip() for l in read(TEMPLATES).split('\n') if l.lstrip().startswith(f'| {tmpl[1]} |')]
        if tr:
            parts.append('TEMPLATE:\n' + '\n'.join(tr))
    e = entries(code)
    found = bool(e)
    if e:
        parts.append('LIBRARY ENTRY:\n' + '\n\n'.join(e))
    if not e or len(' '.join(e)) < 400:
        more = mentions(code)
        if more:
            parts.append('LIBRARY MENTIONS (the entry above is a stub or missing):\n' + '\n'.join('- ' + x for x in more))
            found = True
    if not found:
        parts.append('NO LIBRARY ENTRY: measure this reel yourself and say so in the brief.')
    text = '\n\n'.join(parts) + '\n'
    if a.save:
        os.makedirs(a.save, exist_ok=True)
        open(os.path.join(a.save, f'{code}-library-entry.txt'), 'w', encoding='utf-8').write(text)
    sys.stdout.buffer.write(text.encode('utf-8', 'replace'))
    sys.exit(0 if found else 1)


if __name__ == '__main__':
    main()
