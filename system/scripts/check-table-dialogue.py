import json
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import correlate, correlation_lags
from faster_whisper import WhisperModel

ROOT=Path(__file__).resolve().parents[1]/'projects/table-call-variations'
sys.stdout.reconfigure(encoding='utf-8',errors='replace')
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=2,local_files_only=True)
results=[]
for folder in (ROOT/'final-assets').iterdir():
    if not (folder/'input.wav').exists():
        continue
    if (folder/'audio-qa.json').exists():
        results.append(json.loads((folder/'audio-qa.json').read_text()))
        continue
    a,sr=sf.read(folder/'input.wav',dtype='float32')
    b,_=sf.read(folder/'denoised/input.wav',dtype='float32')
    c,_=sf.read(folder/'dialogue.wav',dtype='float32')
    n=min(len(a),len(b))
    aa=a[:n:6]
    bb=b[:n:6]
    corr=correlate(bb,aa,mode='full',method='fft')
    lags=correlation_lags(len(bb),len(aa))
    mask=np.abs(lags)<800
    lag=lags[mask][np.argmax(corr[mask])]/(sr/6)
    language='ar' if folder.name=='arabic-love' else 'he' if folder.name.startswith('mom') else 'en'
    segments,_=model.transcribe(str(folder/'dialogue.wav'),language=language,beam_size=3,condition_on_previous_text=False,vad_filter=False,word_timestamps=True)
    transcript=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'start':w.start,'end':w.end,'text':w.word} for w in s.words or []]} for s in segments]
    result={'segment':folder.name,'original_samples':len(a),'denoised_samples':len(b),'final_samples':len(c),'denoise_lag_ms':round(lag*1000,2),'peak_dbfs':round(float(20*np.log10(max(np.max(np.abs(c)),1e-8))),2),'rms_dbfs':round(float(20*np.log10(max(np.sqrt(np.mean(c*c)),1e-8))),2),'cleaned_asr':transcript}
    results.append(result)
    (folder/'audio-qa.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(folder.name,'lag',result['denoise_lag_ms'],'peak',result['peak_dbfs'],'text',' '.join(s['text'] for s in transcript),flush=True)
(ROOT/'dialogue-qa.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
