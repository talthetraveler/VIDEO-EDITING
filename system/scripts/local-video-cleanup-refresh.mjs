// Refresh cloud proofs for the already-approved exact file list. No cloud writes.
import fs from 'node:fs';
import path from 'node:path';
import {makeClient} from './lib/frameio-deliver.mjs';
const root='C:/Users/taldo/Downloads/videos to edit/system/projects/_frameio/cleanup-2026-10-07';
const proof=JSON.parse(fs.readFileSync(path.join(root,'content-verified.json'),'utf8'));
if(proof.processed!==proof.total)throw new Error('Incomplete original verification');
const client=makeClient(),unwrap=r=>r?.response?.data??r?.data??r;
const memo=new Map(),good=[],skipped=[];let pos=0;
async function check(f){
 const k=f.cloud.accountId+':'+f.cloud.id+':'+f.cloud.kind;
 if(memo.has(k))return memo.get(k);
 const p=(async()=>{
  const d=unwrap(await client.files.show(f.cloud.accountId,f.cloud.id,{include:'media_links.original,media_links.high_quality,media_links.efficient'},{timeoutInSeconds:20,maxRetries:1}));
  if(d.status!=='transcoded')return null;
  const geturl=m=>typeof m==='string'?m:m?.download_url??m?.url;
  const original=geturl(d.media_links?.original),variant=geturl(d.media_links?.[f.cloud.kind]);
  if(!original||!variant)return null;
  const o=await fetch(original,{method:'HEAD',signal:AbortSignal.timeout(20000)});
  if(!o.ok||Number(o.headers.get('content-length'))!==d.file_size)return null;
  const v=original===variant?o:await fetch(variant,{method:'HEAD',signal:AbortSignal.timeout(20000)});
  return v.ok?{bytes:Number(v.headers.get('content-length')),etag:v.headers.get('etag')?.replaceAll('"',''),name:d.name}:null;
 })();memo.set(k,p);return p;
}
async function worker(){while(pos<proof.verified.length){const f=proof.verified[pos++];
 try{const r=await check(f);if(r&&r.bytes===f.bytes&&r.etag===f.cloud.etag)good.push({...f,cloudVerifiedAt:new Date().toISOString()});else skipped.push({path:f.path,reason:'Live cloud proof changed or unavailable'});}
 catch{skipped.push({path:f.path,reason:'Live cloud recheck failed'});}
 if((good.length+skipped.length)%50===0)console.log(`Cloud refresh: ${good.length+skipped.length}/${proof.verified.length}`);
}}
await Promise.all(Array.from({length:3},worker));
const output={at:new Date().toISOString(),total:proof.verified.length,processed:good.length+skipped.length,verified:good,skipped};
const fd=fs.openSync(path.join(root,'deletion-ready.json'),'w');try{fs.writeFileSync(fd,JSON.stringify(output,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
console.log(JSON.stringify({approvedCandidates:proof.verified.length,ready:good.length,skipped:skipped.length,GB:+(good.reduce((a,f)=>a+f.bytes,0)/1e9).toFixed(2),deleted:0}));
