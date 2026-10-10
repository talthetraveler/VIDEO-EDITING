// Read-only size inventory. Never determines whether a personal document is unused.
import fs from 'node:fs';import path from 'node:path';
const profile='C:/Users/taldo';
const out=path.join(profile,'Downloads/videos to edit/system/projects/_frameio/cleanup-2026-10-07/storage-audit.json');
const buckets=new Map(),largest=[],errors=[],repos=[];let files=0,bytes=0;
const cloud=/^(OneDrive[^/\\]*|iCloudDrive|iCloudPhotos|Dropbox)$/i;
function walk(dir,depth=0){
 let kids;try{kids=fs.readdirSync(dir,{withFileTypes:true});}catch(e){errors.push({path:dir,code:e.code});return 0;}
 let subtotal=0;
 for(const e of kids){const p=path.join(dir,e.name);
  if(e.isSymbolicLink()||cloud.test(e.name))continue;
  if(e.isDirectory()){
   if(e.name==='.git')repos.push(dir);
   const n=walk(p,depth+1);subtotal+=n;
   if(depth<=3||['node_modules','Cache','Caches','Media Cache','Media Cache Files','Temp','.cache','.npm','.git'].includes(e.name))buckets.set(p,n);
  }else if(e.isFile())try{
   const s=fs.statSync(p);files++;bytes+=s.size;subtotal+=s.size;
   if(s.size>=250e6)largest.push({path:p,bytes:s.size});
  }catch(e){errors.push({path:p,code:e.code});}
 }
 return subtotal;
}
walk(profile);
for(const root of ['C:/content for media kit','C:/common_attachment'])if(fs.existsSync(root))buckets.set(root,walk(root));
const report={at:new Date().toISOString(),profile,files,logicalBytes:bytes,cloudFoldersExcluded:true,repositories:[...new Set(repos)],directories:[...buckets].map(([path,bytes])=>({path,bytes})).sort((a,b)=>b.bytes-a.bytes),largeFiles:largest.sort((a,b)=>b.bytes-a.bytes),errors};
const fd=fs.openSync(out,'w');try{fs.writeFileSync(fd,JSON.stringify(report,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
console.log(JSON.stringify({files,logicalGB:+(bytes/1e9).toFixed(2),repositories:report.repositories.length,errors:errors.length,top:report.directories.slice(0,18).map(x=>({path:x.path,GB:+(x.bytes/1e9).toFixed(2)}))}));
