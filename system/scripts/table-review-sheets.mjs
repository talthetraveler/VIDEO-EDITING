import {execFileSync} from 'node:child_process';
import {mkdirSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
const root=process.cwd(),source='C:/Users/taldo/Downloads/table asking a. Question';
const out=path.join(root,'projects/table-call-variations/review-all/sheets');
mkdirSync(out,{recursive:true});
const ff=path.join(root,'vendor/OpenChatCut/node_modules/ffmpeg-static/ffmpeg.exe');
for(const file of readdirSync(source).filter(x=>x.endsWith('.MP4'))){
 const dest=path.join(out,file.replace('.MP4','.jpg'));
 if(existsSync(dest))continue;
 execFileSync(ff,['-v','error','-threads','2','-skip_frame','nokey','-i',path.join(source,file),'-vf','fps=1/3,transpose=1,scale=240:426,tile=6x4:padding=3:margin=3:color=white','-frames:v','1','-y',dest]);
 console.log(file+' sheet ready');
}
