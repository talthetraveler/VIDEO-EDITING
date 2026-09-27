"""Footage intelligence — Phase 4: junk the per-clip records into ONE doc.

Reads the array of rich per-clip records (Phase 3 agent output) + the manifest, writes
FOOTAGE-INTELLIGENCE-<drop>.md: header, by-person, by-type, quotable, per-clip table, gaps.

Generic. Usage:
    python assemble_doc.py <records.json> <out.md> --drop LABEL --source "LINK_OR_PATH" [--date YYYY-MM-DD]
records.json = [{clip, people, scene, action, setting, is_broll, broll_quality,
                 broll_tags, subject_isolation, orientation, has_speech, speakers,
                 quotable:[{speaker,text,t}], notes}, ...]
"""
import sys, json, os

records = json.load(open(sys.argv[1], encoding="utf-8"))
# guard: if a record string was mis-decoded as cp1252 upstream, repair common mojibake
def _fix(s):
    if isinstance(s, str) and "â€" in s:
        try: return s.encode("cp1252", "ignore").decode("utf-8", "ignore")
        except Exception: return s
    return s
out = sys.argv[2]
def arg(flag, default=""):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default
DROP = arg("--drop", "drop"); SOURCE = arg("--source", "(cache)"); DATE = arg("--date", "")

records = [r for r in records if r]

# repair mojibake recursively across every string in every record
def _walk(o):
    if isinstance(o, str): return _fix(o)
    if isinstance(o, list): return [_walk(x) for x in o]
    if isinstance(o, dict): return {k: _walk(v) for k, v in o.items()}
    return o
records = [_walk(r) for r in records]

n_clip = len(records)
n_broll = sum(1 for r in records if r.get("is_broll"))
n_talk = sum(1 for r in records if r.get("has_speech"))

# by person
byp = {}
for r in records:
    for p in r.get("people", []) or ["(unidentified)"]:
        byp.setdefault(p, []).append(r)
# by type (coarse bucket from action/scene keywords + is_interview)
def bucket(r):
    s = (r.get("scene", "") + " " + r.get("action", "")).lower()
    if r.get("speakers", 0) >= 2 or "interview" in s: return "interview"
    for k in ("scrimmage", "game", "match", "11v", "5v5", "small-sided"):
        if k in s: return "scrimmage"
    for k in ("drill", "cone", "ladder", "dribbl", "juggl", "strike", "passing", "shooting", "footwork"):
        if k in s: return "drill / skill"
    return "candid / other"
byt = {}
for r in records:
    byt.setdefault(bucket(r), []).append(r)

L = []
L.append(f"# Footage Intelligence — {DROP}\n")
L.append(f"> Source: {SOURCE}  ")
if DATE: L.append(f"> Analyzed: {DATE}  ")
L.append(f"> {n_clip} clips · {n_broll} usable b-roll · {n_talk} with speech\n")
L.append("**What this is:** every clip identified by WHO (face match), WHAT (Claude-vision scene/action + "
         "b-roll rating), and what's SAID (diarized transcript). Builders read THIS, not the raw drop.\n")

L.append("\n## By person\n")
for p in sorted(byp, key=lambda x: -len(byp[x])):
    rs = byp[p]
    solo = [r for r in rs if r.get("is_broll") and len(r.get("people", [])) == 1 and r.get("broll_quality", 0) >= 5]
    iv = [r for r in rs if r.get("speakers", 0) >= 2]
    head = f"**{p}** — {len(rs)} clips ({len(solo)} solo b-roll, {len(iv)} interview)"
    L.append(head + "  ")
    if solo:
        picks = sorted(solo, key=lambda r: -r.get("broll_quality", 0))[:8]
        L.append("- best b-roll: " + ", ".join(
            f"{r['clip']} ({r.get('action','?')}, {r.get('broll_quality','?')}/10)" for r in picks) + "  ")
    if not solo:
        L.append("- ⚠️ no clean solo b-roll in this drop  ")
    L.append("")

L.append("\n## By type\n")
for t in sorted(byt, key=lambda x: -len(byt[x])):
    clips = ", ".join(r["clip"] for r in byt[t][:30])
    L.append(f"- **{t}** ({len(byt[t])}): {clips}  ")

L.append("\n## Quotable (raw material for hooks / testimonials)\n")
anyq = False
for r in records:
    for q in r.get("quotable", []) or []:
        anyq = True
        t = q.get("t", [0, 0]); spk = q.get("speaker", "?")
        L.append(f"- `{r['clip']}` [{t[0]}–{t[1]}s] **{spk}:** {q.get('text','').strip()}  ")
if not anyq:
    L.append("- (none transcribed — no clips passed the speech gate, or none quotable)  ")

L.append("\n## Per-clip\n")
L.append("| clip | people | scene | action | b-roll | iso | spk | orient |")
L.append("|---|---|---|---|---|---|---|---|")
for r in sorted(records, key=lambda r: r["clip"]):
    L.append("| {clip} | {ppl} | {scene} | {act} | {br} | {iso} | {spk} | {o} |".format(
        clip=r["clip"], ppl=", ".join(r.get("people", [])) or "—",
        scene=r.get("scene", "")[:40], act=r.get("action", "")[:40],
        br=(f"{r.get('broll_quality','?')}/10" if r.get("is_broll") else "—"),
        iso=(r.get("subject_isolation", "")[:18] or "—"),
        spk=r.get("speakers", 0), o=r.get("orientation", "?")))

L.append("\n## Gaps (honesty section)\n")
gaps = []
for p in byp:
    if p == "(unidentified)": continue
    solo = [r for r in byp[p] if r.get("is_broll") and len(r.get("people", [])) == 1 and r.get("broll_quality", 0) >= 5]
    if not solo:
        gaps.append(f"- **{p}**: NO clean solo b-roll ≥5/10 in this drop — builders must flag any b-roll used as generic.")
if "(unidentified)" in byp:
    gaps.append(f"- {len(byp['(unidentified)'])} clips have unidentified faces (no roster match).")
L += gaps or ["- none — every rostered person has usable own-footage."]

os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
print(f"wrote {out} ({n_clip} clips, {len(byp)} people)")
