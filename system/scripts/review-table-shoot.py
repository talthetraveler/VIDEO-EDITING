import os, sys, json, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parent.parent
SOURCE=Path('C:/Users/taldo/Downloads/table asking a. Question')
OUT=ROOT/'projects/table-call-variations/review-all'
OUT.mkdir(parents=True,exist_ok=True)
FF=ROOT/'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=3,num_workers=1,local_files_only=True)
language_hints={'C0244':'en','C0245':'en','C0247':'en','C0249':'en','C0251':'en','C0253':'ar','C0254':'ar','C0257':'he','C0258':'ar','C0259':'ar','C0260':'en','C0261':'en'}
for source in sorted(SOURCE.glob('*.MP4')):
    dest=OUT/source.stem
    if dest.with_suffix('.json').exists():
        print('CACHED',source.stem,flush=True)
        continue
    wav=dest.with_suffix('.wav')
    subprocess.run([str(FF),'-v','error','-i',str(source),'-vn','-ar','48000','-ac','2','-y',str(wav)],check=True)
    audio,sr=sf.read(wav)
    correlation=float(np.corrcoef(audio.T)[0,1])
    rms=np.sqrt(np.mean(audio**2,axis=0))
    # Retain both original channels for subsequent speaker-isolation comparisons.
    mono=audio.mean(axis=1)
    sf.write(OUT/(source.stem+'-mono.wav'),mono,sr)
    segments,info=model.transcribe(str(OUT/(source.stem+'-mono.wav')),language=language_hints.get(source.stem),beam_size=3,best_of=1,condition_on_previous_text=False,vad_filter=True,word_timestamps=True)
    segments=list(segments)
    native=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'text':w.word,'start':w.start,'end':w.end,'probability':w.probability} for w in s.words]} for s in segments]
    english=native
    if info.language!='en':
        translated,_=model.transcribe(str(OUT/(source.stem+'-mono.wav')),language=info.language,task='translate',beam_size=3,best_of=1,condition_on_previous_text=False,vad_filter=True,word_timestamps=True)
        english=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'text':w.word,'start':w.start,'end':w.end,'probability':w.probability} for w in s.words]} for s in translated]
    result={'source':str(source),'duration':len(audio)/sr,'language':info.language,'channel_correlation':correlation,'channel_rms_db':(20*np.log10(rms+1e-10)).tolist(),'native':native,'english':english,'review_status':'machine transcript pending editorial and picture review'}
    dest.with_suffix('.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(source.stem,info.language,'channel correlation',round(correlation,3),flush=True)
    for s in english:print(f"  {s['start']:.2f}-{s['end']:.2f} {s['text']}",flush=True)
