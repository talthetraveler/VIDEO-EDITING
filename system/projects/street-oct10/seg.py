import json,sys,glob,os
inv={r['name']:r for r in json.load(open('projects/street-oct10/inventory.json',encoding='utf8'))}
T='projects/_frameio/cache/transcripts/'
for n in sys.argv[1:]:
    r=inv[[k for k in inv if n in k][0]]; j=json.load(open(T+r['id']+'.json',encoding='utf8'))
    print(f"\n== {r['name']} {r['id']} {r['dur']}s rot{r['rot']} {r['w']}x{r['h']}")
    w=sorted(j.get('words',[]),key=lambda x:x['start']); line=[]; st=None
    for i,x in enumerate(w):
        if st is None: st=x['start']
        line.append(x['word'].strip())
        nxt=w[i+1]['start'] if i+1<len(w) else None
        if nxt is None or nxt-x['end']>0.45 or len(line)>=14:
            print(f"{st:6.2f}-{x['end']:6.2f} {' '.join(line)}"); line=[]; st=None
