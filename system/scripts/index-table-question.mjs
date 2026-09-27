import {execFileSync} from 'node:child_process';
import {mkdirSync,readdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const source='C:/Users/taldo/Downloads/table asking a. Question';
const dest=path.join(root,'scratch/table-question');
const ffmpeg=path.join(root,'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const whisper='C:/Users/taldo/.cache/video-studio/whisper.cpp/main.exe';
mkdirSync(dest,{recursive:true});
const files=readdirSync(source).filter(f=>/^C02(4[4-9]|5[0-9]|6[01])\.MP4$/.test(f));
for(const file of files){
 const id=file.slice(0,-4), input=path.join(source,file), out=path.join(dest,id);
 if(!existsSync(out+'.jpg'))execFileSync(ffmpeg,['-v','error','-ss','3','-i',input,'-vf','transpose=1,scale=360:640','-frames:v','1','-y',out+'.jpg']);
 if(!existsSync(out+'.wav'))execFileSync(ffmpeg,['-v','error','-i',input,'-vn','-ac','1','-ar','16000','-y',out+'.wav']);
 console.log('PREPARED '+id);
}
for(const file of files){
 const id=file.slice(0,-4), out=path.join(dest,id);
 if(!existsSync(out+'.json'))execFileSync(whisper,['-m','C:/Users/taldo/.cache/video-studio/whisper.cpp/ggml-base.bin','-f',out+'.wav','-l','auto','-tr','-otxt','-oj','-of',out,'-t','6'],{stdio:'pipe'});
 console.log(id+': '+readFileSync(out+'.txt','utf8').trim());
}
writeFileSync(path.join(dest,'catalog.json'),JSON.stringify(files.map(file=>({source:path.join(source,file),...JSON.parse(readFileSync(path.join(dest,file.slice(0,-4)+'.json'),'utf8'))})),null,2));
