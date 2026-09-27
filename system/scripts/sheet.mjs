#!/usr/bin/env node
// Contact sheet from a RENDERED file, so I look at the actual delivered picture.
// Frames are sampled at d*(i+0.5)/N, left-to-right, top-to-bottom, 3 per row.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
const FFDIR="C:/Users/taldo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin";
const FF=join(FFDIR,"ffmpeg.exe"), FP=join(FFDIR,"ffprobe.exe");
const [file,out,nArg,wArg]=process.argv.slice(2);
const N=+(nArg||9), W=+(wArg||360), H=Math.round(W*16/9);
const d=parseFloat(spawnSync(FP,["-v","error","-show_entries","format=duration","-of","csv=p=0",file],{encoding:"utf8"}).stdout.trim());
const cols=3;
const ins=[],lbl=[],times=[];
for(let i=0;i<N;i++){
  const t=d*(i+0.5)/N; times.push(+t.toFixed(1));
  ins.push("-ss",t.toFixed(2),"-i",file);
  lbl.push(`[${i}:v]scale=${W}:${H}[v${i}]`);
}
const layout=Array.from({length:N},(_,i)=>`${(i%cols)*W}_${Math.floor(i/cols)*H}`).join("|");
const fc=lbl.join(";")+";"+Array.from({length:N},(_,i)=>`[v${i}]`).join("")+`xstack=inputs=${N}:layout=${layout}[o]`;
const r=spawnSync(FF,["-v","error","-y",...ins,"-filter_complex",fc,"-map","[o]","-frames:v","1",out],{encoding:"utf8"});
if(r.status) console.error(r.stderr.slice(0,600)); else console.log(`${out}  ${d.toFixed(1)}s  frames @ ${times.join(", ")}`);
