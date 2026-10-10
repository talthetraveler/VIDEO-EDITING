import json,sys
def save(slug,m):
    p=f'projects/{slug}/captions-ar.json'
    try: old=json.load(open(p,encoding='utf8'))
    except Exception: old={}
    old.update({' '.join(k.upper().split()):v for k,v in m.items()})
    json.dump(old,open(p,'w',encoding='utf8'),ensure_ascii=False,indent=0)
    try:
        ch=[l for l in open(f'projects/{slug}/chunks.txt',encoding='utf8').read().split('\n') if l]
        print(slug,'missing:',[c for c in ch if ' '.join(c.upper().split()) not in old])
    except Exception as e: print(e)
