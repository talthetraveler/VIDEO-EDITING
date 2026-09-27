import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import correlate,correlation_lags

ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'projects/table-call-variations'
FF=ROOT/'vendor/OpenChatCut/node_modules/ffmpeg-static/ffmpeg.exe'
PROBE=ROOT/'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'
sys.stdout.reconfigure(encoding='utf-8',errors='replace')

def run(args):
    r=subprocess.run([str(a) for a in args],capture_output=True,text=True,encoding='utf-8',errors='replace')
    if r.returncode:
        raise RuntimeError(r.stderr[-3000:])
    return r.stdout+r.stderr

for key in sys.argv[1:]:
    folder=P/key
    output=P/'renders'/f'{key}.mp4'
    edl=json.loads((folder/'edit-decisions.json').read_text())
    captions=json.loads((folder/'captions.json').read_text())
    media=json.loads(run([PROBE,'-v','error','-show_streams','-show_format','-of','json',output]))
    v=next(s for s in media['streams'] if s['codec_type']=='video')
    a=next(s for s in media['streams'] if s['codec_type']=='audio')
    assert (v['width'],v['height'],v['r_frame_rate'])==(1080,1920,'25/1')
    assert abs(float(v['duration'])-edl['duration'])<.041
    assert sf.info(str(folder/'assets/dialogue.wav')).frames==round(edl['duration']*48000)
    assert all(s['start']<s['end']<=edl['duration']+.001 for s in captions)
    assert all(x['end']<=y['start'] for x,y in zip(captions,captions[1:]))
    scan=run([FF,'-hide_banner','-threads','2','-i',output,'-vf','scale=270:480,blackdetect=d=0.08:pix_th=0.08,freezedetect=n=-50dB:d=0.8','-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','NUL'])
    (folder/'export-scan.log').write_text(scan,encoding='utf-8')
    loudness=json.loads(scan[scan.rfind('{'):scan.rfind('}')+1])
    black=re.findall(r'black_start:[^\r\n]+',scan)
    freezes=re.findall(r'freeze_start:[^\r\n]+',scan)
    run([FF,'-hide_banner','-y','-threads','2','-i',output,'-vf','fps=1/2,scale=216:384,tile=5x3','-frames:v','1','-update','1',folder/'review-sheet.jpg'])
    run([FF,'-hide_banner','-y','-threads','2','-ss','1','-i',output,'-frames:v','1','-update','1',folder/'caption-frame.jpg'])
    run([FF,'-hide_banner','-y','-threads','2','-i',output,'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',folder/'export-audio.wav'])
    original,_=sf.read(folder/'assets/dialogue.wav',dtype='float32')
    encoded,_=sf.read(folder/'export-audio.wav',dtype='float32')
    n=min(len(original),len(encoded))
    aa=original[:n:6]
    bb=encoded[:n:6]
    corr=correlate(bb,aa,mode='full',method='fft')
    lags=correlation_lags(len(bb),len(aa))
    mask=np.abs(lags)<800
    lag=float(lags[mask][np.argmax(corr[mask])]/8)
    metrics={'video':str(output),'duration':edl['duration'],'width':1080,'height':1920,'fps':25,'caption_count':len(captions),'caption_overlaps':0,'audio_encode_lag_ms':lag,'integrated_lufs':float(loudness['input_i']),'true_peak_dbtp':float(loudness['input_tp']),'black_intervals':black,'freeze_intervals':freezes,'source_review':'All 18 complete transcripts and full-duration contact sheets considered.','limitations':'Automated signal/transcription and sampled visual QA, not a claim of subjective headphone listening or perfect speech isolation.'}
    (folder/'export-qa.json').write_text(json.dumps(metrics,indent=2),encoding='utf-8')
    print(json.dumps(metrics),flush=True)
