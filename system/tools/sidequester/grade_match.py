#!/usr/bin/env python3
"""grade_match.py — fit an ffmpeg grade that moves a SOURCE (clip, image or baseline mosaic) onto a TARGET look.
Usage:
  python3 grade_match.py --target <preset name | ref id | stats.json> --src <clip.mp4|image.png> [--json]
  python3 grade_match.py --target desert_orange_storm --src /path/clip.mp4
Default (safe) mode: a levels curve (black/mid/white points) + warm/cool-axis-only tints (capped) + saturation ratio, computed from THIS source vs the target. --strength 0.5 = the "light" grade. Prints the ffmpeg -vf filter string fitted for THIS source (per-clip, as Tal's lessons require), plus before/after numbers.
Targets: presets in /home/user/tab/work/reflib/presets.json, or any measured ref id in /home/user/tab/work/reflib/m/<id>.json.
Always tone-map iPhone HLG/PQ to SDR BEFORE measuring/grading.
"""
import os,sys,json,subprocess,tempfile,argparse
import numpy as np
from PIL import Image
L=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","..","..","assets","references","sidequester-kit","scripts","reflib"))
def stats(F):
    Y=0.2126*F[...,0]+0.7152*F[...,1]+0.0722*F[...,2]
    rowdark=(Y.mean(axis=2)<0.04).mean(axis=0)>0.85
    keep=~rowdark
    if keep.sum()<4: keep[:]=True
    F=F[:,keep]; Y=Y[:,keep]
    mx=F.max(-1); mn=F.min(-1); sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
    o={}
    yy=Y.reshape(len(Y),-1)
    o["mean_luma"]=float(Y.mean()); o["contrast_std"]=float(np.median(yy.std(1)))
    o["black_p2"]=float(np.median(np.percentile(yy,2,axis=1))); o["white_p98"]=float(np.median(np.percentile(yy,98,axis=1)))
    o["sat_mean"]=float(sat.mean())
    def tint(m):
        if m.sum()<50: return [0.0,0.0,0.0]
        c=F[m].mean(0); return [float(x) for x in (c-c.mean())]
    o["shadow_tint_rgb"]=tint(Y<0.25); o["mid_tint_rgb"]=tint((Y>=0.3)&(Y<=0.7)); o["high_tint_rgb"]=tint(Y>0.72)
    return o
def load_src(src,n=12,w=160):
    if src.lower().endswith((".png",".jpg",".jpeg")):
        a=np.asarray(Image.open(src).convert("RGB")).astype(np.float32)/255
        return a[None]
    d=float(subprocess.run(f'ffprobe -v error -show_entries format=duration -of csv=p=0 "{src}"',shell=True,capture_output=True,text=True).stdout.strip() or 1)
    fr=[]
    for k in range(n):
        t=d*(k+0.5)/n
        r=subprocess.run(f'ffmpeg -v error -ss {t:.2f} -i "{src}" -frames:v 1 -vf scale={w}:-2 -f image2pipe -vcodec png -',shell=True,capture_output=True)
        if r.stdout:
            import io; fr.append(np.asarray(Image.open(io.BytesIO(r.stdout)).convert("RGB")).astype(np.float32)/255)
    h=min(f.shape[0] for f in fr); return np.stack([f[:h] for f in fr])
def mosaic(F,path):
    n=len(F); cols=int(np.ceil(np.sqrt(n))); rows=int(np.ceil(n/cols)); h,w=F.shape[1:3]
    M=np.zeros((rows*h,cols*w,3),np.float32)
    for i,f in enumerate(F): M[(i//cols)*h:(i//cols+1)*h,(i%cols)*w:(i%cols+1)*w]=f
    Image.fromarray((M*255).astype(np.uint8)).save(path); return (rows,cols,h,w)
def unmosaic(path,shape):
    rows,cols,h,w=shape; M=np.asarray(Image.open(path).convert("RGB")).astype(np.float32)/255
    return np.stack([M[r*h:(r+1)*h,c*w:(c+1)*w] for r in range(rows) for c in range(cols)])
def build(p):
    b0,mo,w1,sat=p["b_out"],p["m_out"],p["w_out"],p["sat"]
    sd=p["sd_out"]
    q1o=mo-0.67*sd; q3o=mo+0.67*sd
    pts=[(0,max(0,b0-0.03) if b0>0.04 else 0),(p["b_in"],b0),(p["q1_in"],q1o),(p["m_in"],mo),(p["q3_in"],q3o),(p["w_in"],w1),(1,min(1,w1+(1-p["w_in"])*0.6))]
    d={}
    for x,y in pts:
        x=round(min(max(x,0),1),3); d[x]=round(min(max(y,0),1),3)
    xs=sorted(d); ys=[d[x] for x in xs]
    for i in range(1,len(ys)): ys[i]=max(ys[i],ys[i-1]+0.002)
    cur=" ".join(f"{x}/{min(y,1):.3f}" for x,y in zip(xs,ys))
    s,m,h=p["sh"],p["mid"],p["hi"]
    cb=f"colorbalance=rs={s[0]:.3f}:gs={s[1]:.3f}:bs={s[2]:.3f}:rm={m[0]:.3f}:gm={m[1]:.3f}:bm={m[2]:.3f}:rh={h[0]:.3f}:gh={h[1]:.3f}:bh={h[2]:.3f}"
    return f"curves=m='{cur}',{cb},eq=saturation={sat:.3f}"
def apply(filt,src_png,out_png):
    r=subprocess.run(["ffmpeg","-v","error","-y","-i",src_png,"-vf",filt,out_png],capture_output=True,text=True)
    if r.returncode: raise RuntimeError(r.stderr[-300:])
def fit(target,F,iters=14,tmpdir=None):
    td=tmpdir or tempfile.mkdtemp(); sp=os.path.join(td,"src.png"); op=os.path.join(td,"out.png")
    shape=mosaic(F,sp); s0=stats(F)
    p={"b_in":s0["black_p2"],"w_in":s0["white_p98"],"m_in":s0["mean_luma"],"q1_in":s0["mean_luma"]-0.67*s0["contrast_std"],"q3_in":s0["mean_luma"]+0.67*s0["contrast_std"],
       "b_out":target["black_p2"],"m_out":target["mean_luma"],"w_out":target["white_p98"],"sd_out":target["contrast_std"],
       "sat":max(0.5,min(2.2,target["sat_mean"]/max(s0["sat_mean"],0.05))),"sh":[0,0,0],"mid":[0,0,0],"hi":[0,0,0]}
    best=None
    for it in range(iters):
        f=build(p); apply(f,sp,op); s=stats(unmosaic(op,shape))
        err=abs(s["mean_luma"]-target["mean_luma"])+abs(s["black_p2"]-target["black_p2"])+abs(s["white_p98"]-target["white_p98"])+abs(s["sat_mean"]-target["sat_mean"])+abs(s["contrast_std"]-target["contrast_std"])+sum(abs(a-b) for k in ("shadow_tint_rgb","mid_tint_rgb","high_tint_rgb") for a,b in zip(s[k],target[k]))
        if best is None or err<best[0]: best=(err,f,s,dict(p))
        p["b_out"]+=0.8*(target["black_p2"]-s["black_p2"]); p["w_out"]+=0.8*(target["white_p98"]-s["white_p98"]); p["m_out"]+=0.8*(target["mean_luma"]-s["mean_luma"])
        p["sd_out"]=max(0.05,p["sd_out"]+0.8*(target["contrast_std"]-s["contrast_std"]))
        p["sat"]=max(0.4,min(2.5,p["sat"]*(target["sat_mean"]/max(s["sat_mean"],0.03))**0.7))
        for k,key in (("sh","shadow_tint_rgb"),("mid","mid_tint_rgb"),("hi","high_tint_rgb")):
            p[k]=[max(-0.45,min(0.45,p[k][i]+0.9*(target[key][i]-s[key][i]))) for i in range(3)]
    return {"filter":best[1],"src_stats":s0,"result_stats":best[2],"error":best[0]}
def safe_filter(t,s,strength=1.0):
    k=strength
    lerp=lambda a,b:a+(b-a)*k
    b_in,b_out=s["black_p2"],lerp(s["black_p2"],t["black_p2"])
    w_in,w_out=s["white_p98"],lerp(s["white_p98"],t["white_p98"])
    m_in,m_out=s["mean_luma"],lerp(s["mean_luma"],t["mean_luma"])
    pts=[(0.0, max(0.0,b_out-b_in) if b_out>b_in else 0.0),(b_in,b_out),(m_in,m_out),(w_in,w_out),(1.0,min(1.0,w_out+(1-w_in)))]
    pts=sorted(pts); xs=[];ys=[]
    for x,y in pts:
        x=round(min(max(x,0),1),3); y=round(min(max(y,0),1),3)
        if xs and x<=xs[-1]: continue
        if ys and y<=ys[-1]: y=round(ys[-1]+0.004,3)
        xs.append(x); ys.append(min(y,1.0))
    curve=" ".join(f"{x}/{y}" for x,y in zip(xs,ys))
    cap=lambda v,c:max(-c,min(c,v))
    def rb(key,c):  # warm/cool axis only (R vs B), no green/magenta
        dt=(t[key][0]-t[key][2])-(s[key][0]-s[key][2])
        return cap(0.5*dt*k,c)
    sh=rb("shadow_tint_rgb",0.06); hi=rb("high_tint_rgb",0.05)
    dwarm=cap(0.45*(t["warm_minus_cool"]-s.get("warm_minus_cool",0))*k,0.08)
    sat=max(0.4,min(1.5,(t["sat_mean"]/max(s["sat_mean"],0.05))**0.8)); sat=1+(sat-1)*k
    f=(f"curves=m='{curve}',colorbalance=rs={sh/2:.3f}:bs={-sh/2:.3f}:rm={dwarm/2:.3f}:bm={-dwarm/2:.3f}:rh={hi/2:.3f}:bh={-hi/2:.3f},eq=saturation={sat:.2f}")
    return f

def get_target(t):
    pr=json.load(open(f"{L}/presets.json",encoding="utf-8")) if os.path.exists(f"{L}/presets.json") else {}
    if t in pr: return pr[t]["target"]
    if os.path.exists(f"{L}/m/{t}.json"): return json.load(open(f"{L}/m/{t}.json"))["grade"]
    return json.load(open(t))
if __name__=="__main__":
    ap=argparse.ArgumentParser(); ap.add_argument("--target",required=True); ap.add_argument("--src",required=True); ap.add_argument("--json",action="store_true")
    ap.add_argument("--strength",type=float,default=1.0,help="1.0 full, 0.5 light (lesson 144)"); ap.add_argument("--fit",action="store_true",help="old iterative tint fit (can leak content colour; not recommended)")
    a=ap.parse_args(); tg=get_target(a.target); F=load_src(a.src)
    if a.fit: r=fit(tg,F)
    else:
        s=stats(F); s["warm_minus_cool"]=float((F[...,0]-F[...,2]).mean()); tg.setdefault("warm_minus_cool",0.0)
        f=safe_filter(tg,s,a.strength)
        import tempfile as _tf; d=_tf.mkdtemp(); p=f"{d}/a.png"; shape=mosaic(F,p)
        subprocess.run(["ffmpeg","-v","error","-y","-i",p,"-vf",f,f"{d}/b.png"]); G=unmosaic(f"{d}/b.png",shape)
        r={"filter":f,"src_stats":s,"result_stats":stats(G),"error":None}
    if a.json: print(json.dumps(r,indent=1))
    else:
        print(r["filter"])
        f=lambda s:f'Y {s["mean_luma"]:.3f} sd {s["contrast_std"]:.3f} p2 {s["black_p2"]:.3f} p98 {s["white_p98"]:.3f} sat {s["sat_mean"]:.3f}'
        print("source:",f(r["src_stats"]),"\nresult:",f(r["result_stats"]),"\ntarget:",f(tg),file=sys.stderr)
