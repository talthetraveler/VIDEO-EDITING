#!/usr/bin/env python3
"""Search Tal's footage index.  python system/tools/sidequester/footage_search.py "jumping desert" [--country india] [--camera drone|gopro|sony|iphone|insta360]
   [--tal] [--locals] [--shot cinematic|drone|vlog|pov|selfie|talking-head] [--vertical|--horizontal] [--min-star 2] [--photos|--videos] [--no-kids] [--hdr|--sdr] [-n 25] [--json]"""
import json,sys,re,argparse,os
KIT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','assets','references','sidequester-kit'))
SYN={'hitchhiking':['hitchhiking','thumb-out','thumb','roadside','ride'],'thumb':['thumb-out','hitchhiking','thumb'],'jumping':['jumping','jump','leaps','leaping','jumps'],
 'horse':['riding-horse','horse','horseback'],'camel':['riding-camel','camel'],'hotel':['hotel','hostel','guesthouse','lodge'],'locals':['tal+locals','locals','local'],
 'kids':['kids-playing','children','kids','child'],'drone':['drone','aerial'],'yurt':['yurt','ger'],'yurts':['yurt','ger'],'portrait':['portrait','posing','face'],
 'food':['eating','food','cooking','meal'],'eating':['eating','food','meal'],'talking':['talking-to-camera','talking-head','talks','speaking'],'sunset':['sunset','golden-hour','sunrise'],
 'night':['night','blue-hour'],'walking':['walking','walks','pov-walk'],'boat':['on-boat','boat','ferry'],'train':['train'],'motorbike':['riding-motorbike','motorbike','scooter','motorcycle'],
 'swimming':['swimming','swims'],'launch':['drone-launch','launch','takes off','take off','hand'],'cinematic':['cinematic'],'pov':['pov']}
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('q',nargs='*'); ap.add_argument('--country'); ap.add_argument('--camera'); ap.add_argument('--tal',action='store_true')
    ap.add_argument('--locals',action='store_true'); ap.add_argument('--shot'); ap.add_argument('--vertical',action='store_true'); ap.add_argument('--horizontal',action='store_true')
    ap.add_argument('--min-star',type=int,default=0); ap.add_argument('--photos',action='store_true'); ap.add_argument('--videos',action='store_true'); ap.add_argument('--no-kids',action='store_true')
    ap.add_argument('--cinematic',action='store_true',help='only measured cinematic_ok clips (sharp+stable+exposed+strong), best first'); ap.add_argument('--sharp',action='store_true',help='only measured in-focus'); ap.add_argument('--stable',action='store_true',help='only measured locked/gimbal'); ap.add_argument('--hdr',action='store_true'); ap.add_argument('--sdr',action='store_true'); ap.add_argument('-n',type=int,default=25); ap.add_argument('--json',action='store_true')
    ap.add_argument('--index',default=os.path.join(KIT,'index','tal_footage_index.json')); a=ap.parse_args()
    rows=json.load(open(a.index,encoding='utf-8'))['records']
    terms=[t.lower() for t in re.findall(r"[\w+'-]+",' '.join(a.q))]
    out=[]
    for r in rows:
        if r.get('skip') or r.get('dup_of') or not r.get('d'): continue
        if a.country and a.country.lower() not in r['country'].lower(): continue
        if a.camera and a.camera.lower() not in r['camera'].lower(): continue
        if a.tal and r.get('who') not in ('tal','tal+locals'): continue
        if a.locals and not (r.get('who')=='tal+locals' or r.get('tl')): continue
        if a.shot and r.get('shot')!=a.shot: continue
        if a.vertical and r.get('orientation')!='vertical': continue
        if a.horizontal and r.get('orientation')!='horizontal': continue
        if (r.get('star') or 0)<a.min_star: continue
        if a.photos and r['type']!='Image': continue
        if a.videos and r['type']!='Video': continue
        if a.no_kids and r.get('kids'): continue
        if a.cinematic and not r.get('cinematic_ok'): continue
        if a.sharp and r.get('sharp')!='in-focus': continue
        if a.stable and r.get('stab')!='locked/gimbal': continue
        if a.hdr and not r.get('hdr'): continue
        if a.sdr and r.get('hdr'): continue
        tags=' '.join((r.get('act') or [])+(r.get('set') or [])+[r.get('tod') or '',r.get('shot') or '',r.get('who') or '']).lower()
        text=' '.join([r.get('d') or '',r.get('tl') or '',r.get('place') or '',r.get('book') or '',r['country'],r['camera'],r['folder'],r['name'],r.get('tx') or '']+[l.get('label','') for l in (r.get('links') or [])]).lower()
        s=0; hit_all=True
        for t in terms:
            alts=SYN.get(t,[t]); best=0
            for al in alts:
                if re.search(r'(^|[\s,])'+re.escape(al)+r'($|[\s,])',tags): best=max(best,3)
                elif al in tags: best=max(best,2)
                elif al in text: best=max(best,2 if al==t else 1.5)
            if best==0: hit_all=False
            s+=best
        if terms and s==0: continue
        if not terms and a.cinematic: s=r.get('cine_score') or 0
        if not hit_all: s*=0.5
        s+= (r.get('star') or 1)*0.4 - 0.5*len([q for q in (r.get('q') or []) if q in ('blurry','shaky','dark')]) + (0.3*(r.get('cine_score') or 0) if a.cinematic and terms else 0) - (1.0 if r.get('sharp')=='blurry' else 0) - (1.0 if r.get('stab')=='shaky' else 0)
        out.append((s,r))
    out.sort(key=lambda x:-x[0])
    if a.json: print(json.dumps([r for _,r in out[:a.n]],indent=1)); return
    print(f"{len(out)} matches; top {min(a.n,len(out))}:")
    for s,r in out[:a.n]:
        print(f"[{s:.1f}] {r['country']} · {r['camera']} · {(str(round(r['dur']))+'s') if r.get('dur') else 'photo'} {r.get('orientation') or ''}{' HDR' if r.get('hdr') else ''} · who={r.get('who')} ★{r.get('star')}{(' · '+r['sharp']+'/'+r['stab']+'/'+r['expo']) if r.get('sharp') else ''}{' · CINEMATIC' if r.get('cinematic_ok') else ''}{' KIDS' if r.get('kids') else ''}\n    {r['d']}{(' | locals: '+r['tl']) if r.get('tl') else ''}\n    {r['folder']}/{r['name']}  id={r['id']}"+(f"\n    says: \"{r['tx'][:160]}\"" if r.get('tx') else '')+''.join(f"\n    linked ({l['type']} {l['pos']}/{l['of']}): {l['label']} -> {', '.join(l['with'])}" for l in (r.get('links') or [])[:2]))
if __name__=='__main__': main()
