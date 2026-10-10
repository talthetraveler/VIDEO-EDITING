// Content verification only. No deletion and no remote mutation.
// S3 ETag full/multipart MD5 construction: docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {makeClient} from './lib/frameio-deliver.mjs';
const root='C:/Users/taldo/Downloads/videos to edit/system/projects/_frameio/cleanup-2026-10-07';
const input=JSON.parse(fs.readFileSync(path.join(root,'backed-candidates.json'),'utf8')).files;
const live=new Map(JSON.parse(fs.readFileSync(path.join(root,'live-verification.json'),'utf8')).assets.filter(x=>x.verified).map(x=>[x.id,x]));
const client=makeClient(),unwrap=r=>r?.response?.data??r?.data??r;
const details=new Map(),hashCache=new Map(),verified=[],skipped=[];let pos=0;
function save(){const fd=fs.openSync(path.join(root,'content-verified.json'),'w');try{fs.writeFileSync(fd,JSON.stringify({at:new Date().toISOString(),total:input.length,processed:verified.length+skipped.length,verified,skipped},null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
async function remote(id){
 if(details.has(id))return details.get(id);
 const promise=(async()=>{
  const a=live.get(id);if(!a)return [];
  const d=unwrap(await client.files.show(a.accountId,id,{include:'media_links.original,media_links.high_quality,media_links.efficient'}));
  if(d.status!=='transcoded')return [];
  const variants=[];
  for(const [kind,m] of Object.entries(d.media_links??{})){
   if(!['original','high_quality','efficient'].includes(kind))continue;
   const url=typeof m==='string'?m:m?.download_url??m?.url;if(!url)continue;
   const h=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(20000)});
   const etag=h.headers.get('etag')?.replaceAll('"','');
   if(h.ok&&/^[a-f0-9]{32}(?:-\d+)?$/i.test(etag??''))variants.push({id,accountId:a.accountId,name:d.name,kind,bytes:Number(h.headers.get('content-length')),etag});
  }
  return variants;
 })();details.set(id,promise);return promise;
}
function digest(h){return h.digest();}
async function hashes(file,variants){
 const before=fs.statSync(file.path,{bigint:true});
 const wanted=[...new Set(variants.map(v=>v.etag))].sort().join('|');
 const key=`${before.dev}:${before.ino}:${before.size}:${before.mtimeNs}:${wanted}`;
 if(hashCache.has(key))return hashCache.get(key);
 const promise=(async()=>{
  const nParts=[...new Set(variants.map(v=>Number(v.etag.split('-')[1])).filter(Number.isFinite))];
  const known=[5,8,10,16,20,32,64,100,128,256].map(x=>x*1048576).concat([5e6,8e6,10e6,20e6,64e6,100e6]);
  const sizes=[...new Set(known.concat(nParts.map(n=>Math.ceil(file.bytes/n))))].filter(s=>nParts.some(n=>Math.ceil(file.bytes/s)===n));
  const states=sizes.map(size=>({size,used:0,h:createHash('md5'),parts:[]}));
  const md5=createHash('md5'),sha=createHash('sha256');
  for await(const chunk of fs.createReadStream(file.path,{highWaterMark:4*1048576})){
   md5.update(chunk);sha.update(chunk);
   for(const s of states){let p=0;while(p<chunk.length){const take=Math.min(chunk.length-p,s.size-s.used);s.h.update(chunk.subarray(p,p+take));s.used+=take;p+=take;if(s.used===s.size){s.parts.push(digest(s.h));s.h=createHash('md5');s.used=0;}}}
  }
  const plain=md5.digest('hex');const etags=[plain];
  for(const s of states){if(s.used)s.parts.push(digest(s.h));etags.push(`${createHash('md5').update(Buffer.concat(s.parts)).digest('hex')}-${s.parts.length}`);}
  const after=fs.statSync(file.path,{bigint:true});
  if(before.size!==after.size||before.mtimeNs!==after.mtimeNs)throw new Error('LOCAL_CHANGED');
  return {md5:plain,sha256:sha.digest('hex'),etags,ino:String(after.ino),dev:String(after.dev),mtimeMs:Number(after.mtimeMs)};
 })();hashCache.set(key,promise);return promise;
}
async function worker(){
 while(pos<input.length){const f=input[pos++];let hit;
  try{
   if(fs.statSync(f.path).size!==f.bytes)throw new Error('LOCAL_CHANGED');
   const variants=[];
   for(const id of f.candidateIds.filter(id=>live.has(id))){
    for(const v of await remote(id))if(v.bytes===f.bytes&&(f.kind==='frameio-cache'||(v.kind==='original'&&v.name.toLowerCase()===f.name.toLowerCase())))variants.push(v);
   }
   if(variants.length){const h=await hashes(f,variants);hit=variants.find(v=>h.etags.includes(v.etag));if(hit)verified.push({...f,...h,cloud:hit,verifiedAt:new Date().toISOString()});}
   if(!hit)skipped.push({path:f.path,bytes:f.bytes,reason:'No matching full-content checksum'});
  }catch(e){skipped.push({path:f.path,bytes:f.bytes,reason:e.message==='LOCAL_CHANGED'?'Local file changed':'Verification failed'});}
  if((verified.length+skipped.length)%25===0){save();console.log(JSON.stringify({processed:verified.length+skipped.length,total:input.length,verified:verified.length,verifiedGB:+(verified.reduce((a,f)=>a+f.bytes,0)/1e9).toFixed(2)}));}
 }
}
await Promise.all(Array.from({length:3},worker));save();
console.log(JSON.stringify({complete:true,verified:verified.length,skipped:skipped.length,verifiedGB:+(verified.reduce((a,f)=>a+f.bytes,0)/1e9).toFixed(2),deleted:0}));
