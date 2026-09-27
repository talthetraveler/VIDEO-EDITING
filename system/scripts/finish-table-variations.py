import html
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8',errors='replace')

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / 'projects/table-call-variations'
SOURCE = Path('C:/Users/taldo/Downloads/table asking a. Question')
FF = ROOT / 'vendor/OpenChatCut/node_modules/ffmpeg-static/ffmpeg.exe'
HF = Path('C:/Users/taldo/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/bin/hyperframes.mjs')
CACHE = PROJECT / 'final-assets'
CACHE.mkdir(exist_ok=True)

# Every range is on the source's native 25 fps grid. Text is literal English
# dialogue; translated lines are explicitly tracked separately.
SEGMENTS = {
 'father-hook': ('C0247',16.04,19.28,"I'd love to see you before I die."),
 'father-greeting': ('C0247',3.80,5.24,'How are you my sweet daughter?'),
 'father-miss': ('C0247',10.52,12.08,'I miss you so much.'),
 'father-love': ('C0247',13.52,15.48,'I love you.'),
 'father-blessing': ('C0247',20.32,24.44,'God bless you and save you for you and your children.'),
 'father-hope': ('C0247',30.36,34.20,'I hope we meet again. America is not far.'),
 'father-together': ('C0247',34.88,37.00,'In any time we can be close together.'),
 'father-bye': ('C0247',40.44,43.24,'Bye bye darling. I love you.'),
 'world-peace': ('C0256',9.80,11.36,'I wish for world peace.'),
 'spread-love': ('C0256',12.04,15.84,'And I want you to just spread love.'),
 'jerusalem': ('C0251',13.00,14.72,'Jerusalem want peace.'),
 'life-short': ('C0251',23.52,26.92,"Don't fight for anything just life is short."),
 'arabic-love': ('C0248',21.12,22.48,''),
 'mom': ('C0257',30.60,36.84,''),
 'mom-short': ('C0257',30.60,32.84,''),
 'host-hope': ('C0261',0.04,4.56,'We need to spread peace and love to all people regardless of religion or nationality.'),
 'host-short': ('C0261',0.04,1.96,'We need to spread peace and love.'),
 'table': ('C0244',0.40,2.48,''),
 'sign': ('C0245',0.04,1.44,''),
 'approach': ('C0250',6.40,7.60,''),
 'concept': ('C0255',23.60,24.56,'Call someone you love.'),
}
TRANSLATIONS = {
 'arabic-love': [(0.14,1.12,'And I love you.')],
 'mom': [(0.10,2.10,'Hi, Mom.'),(2.26,4.52,"I arrived. I'm here in Israel."),(5.08,6.04,'Everything is fine.')],
 'mom-short': [(0.10,2.10,'Hi, Mom.')],
}
SILENT = {'table','sign','approach'}
PHRASE_LENGTHS = {
 'father-hook':[5,3], 'father-greeting':[3,3], 'father-miss':[5],
 'father-love':[3], 'father-blessing':[3,3,5], 'father-hope':[5,4],
 'father-together':[3,5], 'father-bye':[3,3], 'world-peace':[5],
 'spread-love':[4,4], 'jerusalem':[3], 'life-short':[4,4],
 'host-hope':[4,3,3,5], 'host-short':[4,3],
 'concept':[4],
}
VARIANTS = [
 {'id':'V1-best-moments','title':'Love, Across Strangers','segments':['father-hook','world-peace','arabic-love','jerusalem','mom','father-together','host-hope']},
 {'id':'V2-one-story','title':'My Sweet Daughter','segments':['father-hook','father-greeting','father-blessing','father-hope','father-together','father-bye']},
 {'id':'V3-table-setup','title':'A Table. A Phone. Someone You Love.','segments':['table','sign','approach','world-peace','arabic-love','mom','life-short','father-bye','father-together','host-hope']},
 {'id':'V4-ultra-fast','title':'A Little More Love','segments':['world-peace','arabic-love','jerusalem','mom-short','father-together','host-short']},
]

def run(args, log=None):
    p = subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding='utf-8',errors='replace')
    if log:
        Path(log).write_text(p.stdout+p.stderr,encoding='utf-8')
    if p.returncode:
        raise RuntimeError(' '.join(map(str,args))+'\n'+p.stderr[-5000:])
    return p.stdout+p.stderr

def ff(args,log=None):
    return run([FF,'-hide_banner','-y','-threads','2',*args],log)

def prepare():
    for key,(source,start,end,text) in SEGMENTS.items():
        d=CACHE/key
        d.mkdir(exist_ok=True)
        duration=round(end-start,2)
        video=d/'picture.mp4'
        if not video.exists():
            original=SOURCE/(source+'.MP4')
            filters='transpose=1,scale=1080:1920:flags=lanczos,setsar=1'
            if source=='C0247':
                original=PROJECT/'assets/C0247-vertical.mp4'
                filters='setsar=1'
            ff(['-ss',start,'-i',original,'-t',duration,'-an','-vf',filters,'-filter_threads','1','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p','-r','25','-movflags','+faststart',video],d/'picture.log')
        audio=d/'dialogue.wav'
        if not audio.exists():
            if key in SILENT:
                ff(['-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t',duration,'-c:a','pcm_s16le',audio])
            else:
                ff(['-ss',start,'-i',SOURCE/(source+'.MP4'),'-t',duration,'-vn','-ac','1','-ar','48000','-af','highpass=f=75,volume=0.25','-c:a','pcm_f32le',d/'input.wav'])
                (d/'denoised').mkdir(exist_ok=True)
                run([ROOT/'bin/deep-filter.exe','-D','-a','12','-o',d/'denoised',d/'input.wav'],d/'denoise.log')
                clean=d/'denoised/input.wav'
                measurement=ff(['-i',clean,'-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','NUL'],d/'loudness-before.log')
                stats=json.loads(measurement[measurement.rfind('{'):measurement.rfind('}')+1])
                norm=f"loudnorm=I=-16:TP=-1.5:LRA=9:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
                samples=round(duration*48000)
                ff(['-i',clean,'-af',f'{norm},aresample=48000,asetpts=N/SR/TB,apad=whole_len={samples},atrim=end_sample={samples},afade=t=in:d=0.005,afade=t=out:st={duration-.008}:d=0.008','-ar','48000','-ac','1','-c:a','pcm_s16le',audio],d/'normalize.log')
        print('PREPARED',key,duration,flush=True)

def align():
    import numpy as np
    import soundfile as sf
    import torch
    import torchaudio
    torch.set_num_threads(2)
    bundle=torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
    model=bundle.get_model().eval()
    labels=bundle.get_labels()
    vocabulary={c:i for i,c in enumerate(labels)}
    for key,(_,_,_,text) in SEGMENTS.items():
        target=CACHE/key/'alignment.json'
        if not text:
            continue
        if target.exists() and ' '.join(w['text'] for w in json.loads(target.read_text())['words'])==text:
            continue
        raw,sr=sf.read(CACHE/key/'dialogue.wav',dtype='float32')
        waveform=torchaudio.functional.resample(torch.from_numpy(raw).unsqueeze(0),sr,16000)
        normalized=re.sub(r"[^A-Z' ]",'',text.upper()).split()
        transcript='|'.join(normalized)
        tokens=torch.tensor([[vocabulary[c] for c in transcript]],dtype=torch.int32)
        with torch.inference_mode():
            emission,_=model(waveform)
            probabilities=emission.log_softmax(-1)
            path,scores=torchaudio.functional.forced_align(probabilities,tokens)
            spans=torchaudio.functional.merge_tokens(path[0],scores[0].exp())
        ratio=len(raw)/sr/emission.shape[1]
        words=[]
        cursor=0
        for original,word in zip(text.split(),normalized):
            group=spans[cursor:cursor+len(word)]
            words.append({'text':original,'start':round(group[0].start*ratio,3),'end':round(group[-1].end*ratio,3),'score':round(float(np.mean([s.score for s in group])),3)})
            cursor+=len(word)+1
        assert cursor-1==len(spans),(key,cursor,len(spans))
        target.write_text(json.dumps({'method':'CTC forced alignment on final cleaned segment PCM','words':words},indent=2),encoding='utf-8')
        print('ALIGNED',key,words,flush=True)

def captions(key):
    if key in TRANSLATIONS:
        return [{'start':a,'end':b,'text':t,'translated':True} for a,b,t in TRANSLATIONS[key]]
    f=CACHE/key/'alignment.json'
    if not f.exists():
        return []
    words=json.loads(f.read_text())['words']
    groups=[]
    group=[]
    for word in words:
        if group and (len(group)>=4 or word['start']-group[-1]['end']>.35):
            groups.append(group)
            group=[]
        group.append(word)
        if word['text'].endswith(('.', '?')):
            groups.append(group)
            group=[]
    if group:
        groups.append(group)
    if key in PHRASE_LENGTHS:
        groups=[]
        cursor=0
        for length in PHRASE_LENGTHS[key]:
            groups.append(words[cursor:cursor+length])
            cursor+=length
        assert cursor==len(words),(key,cursor,len(words))
    duration=SEGMENTS[key][2]-SEGMENTS[key][1]
    return [{'start':max(0,g[0]['start']-.02),'end':min(duration,g[-1]['end']+.08),'text':' '.join(w['text'] for w in g)} for g in groups]

def stamp(s):
    n=round(s*1000)
    return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'

def repair_audio():
    import soundfile as sf
    for key,(_,start,end,_) in SEGMENTS.items():
        if key in SILENT:
            continue
        d=CACHE/key
        duration=round(end-start,2)
        samples=round(duration*48000)
        measurement=(d/'loudness-before.log').read_text()
        stats=json.loads(measurement[measurement.rfind('{'):measurement.rfind('}')+1])
        norm=f"loudnorm=I=-16:TP=-1.5:LRA=9:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
        ff(['-i',d/'denoised/input.wav','-af',f'{norm},aresample=48000,asetpts=N/SR/TB,apad=whole_len={samples},atrim=end_sample={samples},afade=t=in:d=0.005,afade=t=out:st={duration-.008}:d=0.008','-ar','48000','-ac','1','-c:a','pcm_s16le',d/'dialogue.wav'],d/'normalize.log')
        assert sf.info(str(d/'dialogue.wav')).frames==samples,key
        if (d/'alignment.json').exists():
            (d/'alignment.json').unlink()
        print('SAMPLE-EXACT',key,samples,flush=True)

def compose():
    for variant in VARIANTS:
        if sys.argv[2:] and variant['id'] not in sys.argv[2:]:
            continue
        folder=PROJECT/variant['id']
        assets=folder/'assets'
        assets.mkdir(parents=True,exist_ok=True)
        for name in ['gsap.min.js','arial-bold.ttf']:
            if not (assets/name).exists():
                os.link(PROJECT/'assets'/name,assets/name)
        shutil.copyfile(PROJECT/'hyperframes.json',folder/'hyperframes.json')
        parts=[]
        sounds=[]
        subs=[]
        cuts=[]
        offset=0
        for key in variant['segments']:
            source,start,end,_=SEGMENTS[key]
            duration=round(end-start,2)
            parts.append("file '"+(CACHE/key/'picture.mp4').as_posix()+"'")
            sounds.append("file '"+(CACHE/key/'dialogue.wav').as_posix()+"'")
            for s in captions(key):
                subs.append({**s,'start':round(offset+s['start'],3),'end':round(offset+s['end'],3)})
            cuts.append({'id':key,'source':source,'in':start,'out':end,'timelineStart':round(offset,2),'duration':duration})
            offset+=duration
        duration=round(offset,2)
        (folder/'video-list.txt').write_text('\n'.join(parts),encoding='utf-8')
        (folder/'audio-list.txt').write_text('\n'.join(sounds),encoding='utf-8')
        ff(['-f','concat','-safe','0','-i',folder/'video-list.txt','-c','copy','-movflags','+faststart',assets/'picture.mp4'],folder/'concat-video.log')
        ff(['-f','concat','-safe','0','-i',folder/'audio-list.txt','-c:a','pcm_s16le',assets/'dialogue.wav'],folder/'concat-audio.log')
        if variant['id']=='V3-table-setup':
            # The host's real concept explanation bridges the silent sign reveal.
            ff(['-i',assets/'dialogue.wav','-i',CACHE/'concept/dialogue.wav','-filter_complex',f'[1:a]adelay=2080:all=1[concept];[0:a][concept]amix=inputs=2:normalize=0:duration=first,atrim=end_sample={round(duration*48000)}[out]','-map','[out]','-c:a','pcm_s16le',assets/'with-concept.wav'])
            os.replace(assets/'with-concept.wav',assets/'dialogue.wav')
            subs=[{**s,'start':round(2.08+s['start'],3),'end':round(2.08+s['end'],3)} for s in captions('concept')]+subs
        for current,following in zip(subs,subs[1:]):
            current['end']=min(current['end'],following['start']-.001)
        mark=[]
        for i,s in enumerate(subs):
            content=html.escape(s['text'])
            content=re.sub(r'\b(love|peace|together|hope|family)\b',r'<em>\1</em>',content,flags=re.I)
            mark.append(f'<div id="caption-{i}" class="clip caption" data-start="{s["start"]}" data-duration="{s["end"]-s["start"]:.3f}" data-track-index="2"><span>{content}</span></div>')
        doc=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{variant['title']}</title><script src="assets/gsap.min.js"></script><style>
@font-face{{font-family:Captions;src:url('assets/arial-bold.ttf')}}*{{box-sizing:border-box}}html,body{{margin:0;width:1080px;height:1920px;overflow:hidden;background:#111}}#root{{position:relative;width:1080px;height:1920px;overflow:hidden}}.footage{{position:absolute;inset:0;width:1080px;height:1920px;object-fit:contain}}.caption{{position:absolute;left:90px;top:1360px;width:900px;height:140px;display:flex;align-items:center;justify-content:center;z-index:10;text-align:center;font-family:Captions,Arial,sans-serif;font-weight:700;font-size:52px;line-height:1.16;color:#fff;letter-spacing:0}}.caption span{{max-width:880px;text-shadow:0 2px 5px #000,0 0 3px #000;-webkit-text-stroke:1.6px #000;paint-order:stroke fill}}em{{font-style:normal;color:#ffe37b}}
</style></head><body><div id="root" data-composition-id="table-call" data-start="0" data-duration="{duration}" data-width="1080" data-height="1920" data-fps="25"><video id="picture" class="clip footage" src="assets/picture.mp4" data-start="0" data-duration="{duration}" data-track-index="0" muted playsinline></video><audio id="dialogue" src="assets/dialogue.wav" data-start="0" data-duration="{duration}" data-track-index="1" data-volume="1"></audio>{''.join(mark)}</div><script>window.__timelines={{'table-call':gsap.timeline({{paused:true}})}};</script></body></html>'''
        (folder/'index.html').write_text(doc,encoding='utf-8')
        (folder/'captions.json').write_text(json.dumps(subs,indent=2),encoding='utf-8')
        (folder/'edit-decisions.json').write_text(json.dumps({'title':variant['title'],'duration':duration,'cuts':cuts},indent=2),encoding='utf-8')
        (PROJECT/'renders'/f'{variant["id"]}.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(s["start"])} --> {stamp(s["end"])}\n{s["text"]}' for i,s in enumerate(subs)),encoding='utf-8')
        print('COMPOSED',variant['id'],duration,flush=True)

def render():
    os.environ['PATH']=str(FF.parent)+os.pathsep+os.environ['PATH']
    os.environ['DO_NOT_TRACK']='1'
    wanted=sys.argv[2:] or [v['id'] for v in VARIANTS]
    for key in wanted:
        folder=PROJECT/key
        print('CHECKING',key,flush=True)
        check=run(['node',HF,'check',folder],folder/'check.log')
        print(check[-1500:],flush=True)
        print('RENDERING',key,flush=True)
        run(['node',HF,'render',folder,'-o',PROJECT/'renders'/f'{key}.mp4','--fps','25','--workers','1','--quality','high','--crf','19','--low-memory-mode','--protocol-timeout','600000'],folder/'render.log')
        print('RENDERED',key,flush=True)

if __name__=='__main__':
    {'prepare':prepare,'align':align,'compose':compose,'render':render,'repair-audio':repair_audio}[sys.argv[1]]()
