// Read-only media audit. Never deletes, uploads, moves, or changes cloud assets.
import fs from 'node:fs';
import path from 'node:path';
import {makeClient} from './lib/frameio-deliver.mjs';
const base='C:/Users/taldo/Downloads/videos to edit';
const out=path.join(base,'system/projects/_frameio/cleanup-2026-10-07');
fs.mkdirSync(out,{recursive:true});
const ext=new Set(['.mp4','.mov','.m4v','.mkv','.avi','.webm','.mts','.m2ts','.mpg','.mpeg','.wmv','.3gp','.insv']);
const roots=['Downloads','Desktop','Documents','Videos','Pictures','edit vids','downloadtemp','insta360'].map(n=>path.join('C:/Users/taldo',n));
roots.push('C:/content for media kit','C:/common_attachment');
const excluded=new Set(['node_modules','.git','.agents','.codex','.claude','.tools','AppData','OneDrive','iCloudDrive','iCloudPhotos','Dropbox']);
const files=[],errors=[];
function walk(dir){
  try {
    const real=fs.realpathSync(dir);
    if (/[/\\](OneDrive[^/\\]*|iCloud[^/\\]*|Dropbox)([/\\]|$)/i.test(real))return;
    for(const e of fs.readdirSync(dir,{withFileTypes:true})){
      const p=path.join(dir,e.name);
      if(e.isSymbolicLink())continue;
      if(e.isDirectory()){if(!excluded.has(e.name)&&!e.name.startsWith('.'))walk(p);}
      else if(e.isFile()&&ext.has(path.extname(e.name).toLowerCase())){
        const s=fs.statSync(p);files.push({path:p,name:e.name,bytes:s.size,mtimeMs:s.mtimeMs});
      }
    }
  }catch(e){errors.push({path:dir,code:e.code});}
}
for(const root of roots)if(fs.existsSync(root))walk(root);
const old=JSON.parse(fs.readFileSync(path.join(base,'system/projects/_frameio/cache/inventory.json'),'utf8'));
const byName=new Map(),byId=new Map();
const key=(n,b)=>`${n.normalize('NFC').toLowerCase()}|${b}`;
for(const f of old.files){
  byId.set(f.id,f);const k=key(f.name,f.bytes);
  if(!byName.has(k))byName.set(k,[]);byName.get(k).push(f);
}
const candidateFiles=files.map(f=>{
  const uuid=/^([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})\.[^.]+$/i.exec(f.name)?.[1];
  const cachedProxy=uuid&&f.path.toLowerCase().includes('system\\projects\\_frameio\\cache\\');
  const matches=cachedProxy&&byId.has(uuid)?[byId.get(uuid)]:(byName.get(key(f.name,f.bytes))??[]);
  return {...f,kind:cachedProxy?'frameio-cache':'possible-original',candidateIds:matches.map(m=>m.id)};
}).filter(f=>f.candidateIds.length);
function save(name,data){const file=path.join(out,name);const fd=fs.openSync(file,'w');try{fs.writeFileSync(fd,JSON.stringify(data,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
save('local-inventory.json',{at:new Date().toISOString(),roots,files,errors});
save('candidates.json',{cachedInventoryAt:old.at,files:candidateFiles});
console.log(JSON.stringify({localFiles:files.length,localGB:+(files.reduce((a,f)=>a+f.bytes,0)/1e9).toFixed(2),candidateFiles:candidateFiles.length,candidateGB:+(candidateFiles.reduce((a,f)=>a+f.bytes,0)/1e9).toFixed(2),scanErrors:errors.length}));
if(!process.argv.includes('--live'))process.exit();
const client=makeClient();const unwrap=r=>r?.response?.data??r?.data??r;
const accounts=unwrap(await client.accounts.index());
const ids=[...new Set(candidateFiles.flatMap(f=>f.candidateIds))];
const live=[];let next=0;
async function worker(){
 while(next<ids.length){
  const id=ids[next++];let item={id,verified:false};
  for(const account of accounts){
   try{
    const d=unwrap(await client.files.show(account.id,id,{include:'media_links.original,media_links.high_quality,media_links.efficient'}));
    const m=d.media_links?.original;const url=typeof m==='string'?m:m?.download_url??m?.url;
    if(!url){item={id,verified:false,reason:'no-original'};break;}
    const h=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(20000)});
    item={id,accountId:account.id,name:d.name,status:d.status,bytes:d.file_size,originalAvailable:h.ok&&Number(h.headers.get('content-length'))===d.file_size,headStatus:h.status};
    item.verified=item.originalAvailable&&d.status==='transcoded';break;
   }catch(e){item={id,verified:false,reason:'API-check-failed',statusCode:e.statusCode??null};}
  }
  live.push(item);
  if(live.length%40===0){save('live-verification.json',{at:new Date().toISOString(),completed:live.length,total:ids.length,assets:live});console.log(`Live original checks: ${live.length}/${ids.length}`);}
 }
}
await Promise.all(Array.from({length:4},worker));
save('live-verification.json',{at:new Date().toISOString(),completed:live.length,total:ids.length,assets:live});
const good=new Map(live.filter(f=>f.verified).map(f=>[f.id,f]));
const backed=candidateFiles.filter(f=>f.candidateIds.some(id=>good.has(id)));
save('backed-candidates.json',{at:new Date().toISOString(),files:backed});
console.log(JSON.stringify({liveAssets:live.length,availableOriginals:good.size,backedCandidates:backed.length,backedGB:+(backed.reduce((a,f)=>a+f.bytes,0)/1e9).toFixed(2),note:'No deletions. Original-file candidates still require content comparison; cache files require provenance validation.'}));
