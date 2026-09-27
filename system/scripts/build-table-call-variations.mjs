import {readFileSync,writeFileSync,mkdirSync,linkSync,existsSync,unlinkSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve('projects/table-call-variations');
const variants=[
 {id:'01-natural',label:'Natural exchange',ranges:[[3.12,44.20]],description:'The continuous message, with the opening setup chatter removed and the goodbye retained.'},
 {id:'02-tight',label:'Tighter story',ranges:[[3.12,5.40],[14.46,19.04],[24.65,26.95],[30.72,43.60]],description:'A shorter chronological cut: daughter, love, reunion, goodbye.'},
 {id:'03-hook-first',label:'Strongest line first',ranges:[[15.42,19.04],[3.12,15.42],[19.04,24.65],[30.72,43.60]],description:'Opens on his wish to see her, then returns to the start of the message. The opening line is not repeated.'}
];
// Phrase timing follows the source transcript; ranges remain editable in seconds.
const captions=[
 [3.12,4.12,'How are you,'],[4.12,5.30,'my sweet daughter?'],
 [5.55,8.70,'I miss you so much.'],
 [14.46,15.38,'I love you.'],
 [15.42,17.98,'I love to see you'],[17.98,19.04,'before I die.'],
 [19.04,20.35,'God bless you'],[20.35,21.70,'and save you,'],
 [21.70,24.65,'for you and your children.'],
 [24.65,25.60,'I love you,'],[25.60,26.95,'my sweet daughter.'],
 [28.05,29.10,'Take care'],[29.10,30.70,'and God bless you.'],
 [30.72,32.80,'I hope we meet again.'],
 [32.82,33.92,'America is not far.'],
 [33.92,34.74,'In any time,'],[34.74,36.85,'we can be close together.'],
 [36.88,37.77,'Take care'],[37.77,39.65,'and God bless you.'],
 [39.73,42.27,'Bye-bye, darling.'],[42.33,43.12,'I love you.']
];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const time=s=>{const n=Math.round(s*1000);return `${String(Math.floor(n/3600000)).padStart(2,'0')}:${String(Math.floor(n/60000)%60).padStart(2,'0')}:${String(Math.floor(n/1000)%60).padStart(2,'0')},${String(n%1000).padStart(3,'0')}`;};
mkdirSync(path.join(root,'renders'),{recursive:true});
for(const variant of variants){
 let offset=0;const media=[],subs=[];
 for(const [i,[start,end]] of variant.ranges.entries()){
  const duration=end-start;
  media.push(`<video id="video-${i}" class="clip footage" src="assets/C0247-vertical.mp4" data-start="${offset.toFixed(3)}" data-duration="${duration.toFixed(3)}" data-media-start="${start}" data-track-index="0" muted playsinline></video>`);
  media.push(`<audio id="audio-${i}" src="assets/C0247-vertical.mp4" data-start="${offset.toFixed(3)}" data-duration="${duration.toFixed(3)}" data-media-start="${start}" data-track-index="1" data-volume="1"></audio>`);
  for(const [a,b,text] of captions){const from=Math.max(a,start),to=Math.min(b,end);if(to-from>.08)subs.push({start:offset+from-start,end:offset+to-start,text});}
  offset+=duration;
 }
 const markup=subs.map((s,i)=>`<div id="caption-${i}" class="clip caption" data-start="${s.start.toFixed(3)}" data-duration="${(s.end-s.start).toFixed(3)}" data-track-index="2"><span>${esc(s.text)}</span></div>`).join('\n');
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1080,height=1920"><title>${variant.label} - Call Someone You Love</title><script src="assets/gsap.min.js"></script><style>
 @font-face{font-family:ReferenceCaption;src:url('assets/arial-bold.ttf')}*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#111}#root{position:relative;width:1080px;height:1920px;overflow:hidden}.footage{position:absolute;inset:0;width:1080px;height:1920px;object-fit:contain}.caption{position:absolute;left:90px;top:1360px;width:900px;height:140px;display:flex;align-items:center;justify-content:center;z-index:10;text-align:center;font-family:ReferenceCaption,Arial,sans-serif;font-weight:700;font-size:48px;line-height:1.16;color:#fff;letter-spacing:0}.caption span{max-width:880px;text-shadow:0 2px 5px #000,0 0 3px #000;-webkit-text-stroke:1px #000;paint-order:stroke fill}
 </style></head><body><div id="root" data-composition-id="table-call" data-start="0" data-duration="${offset.toFixed(3)}" data-width="1080" data-height="1920">${media.join('\n')}\n${markup}</div><script>window.__timelines=window.__timelines||{};window.__timelines['table-call']=gsap.timeline({paused:true});</script></body></html>`;
 const variantDir=path.join(root,variant.id);
 mkdirSync(path.join(variantDir,'assets'),{recursive:true});
 for(const asset of ['C0247-vertical.mp4','gsap.min.js','arial-bold.ttf']){
  const linked=path.join(variantDir,'assets',asset);
  if(!existsSync(linked))linkSync(path.join(root,'assets',asset),linked);
 }
 writeFileSync(path.join(variantDir,'index.html'),html);
 writeFileSync(path.join(variantDir,'hyperframes.json'),readFileSync(path.join(root,'hyperframes.json')));
 if(existsSync(path.join(root,variant.id+'.html')))unlinkSync(path.join(root,variant.id+'.html'));
 if(variant.id==='01-natural')writeFileSync(path.join(root,'index.html'),html);
 writeFileSync(path.join(root,'renders',variant.id+'.srt'),subs.map((s,i)=>`${i+1}\n${time(s.start)} --> ${time(s.end)}\n${s.text}\n`).join('\n'));
 variant.duration=Number(offset.toFixed(3));variant.captions=subs;
}
writeFileSync(path.join(root,'edit-decisions.json'),JSON.stringify({source:'C:/Users/taldo/Downloads/table asking a. Question/C0247.MP4',rotation:'90 degrees clockwise',fps:25,width:1080,height:1920,variants},null,2));
writeFileSync(path.join(root,'source-captions.json'),JSON.stringify(captions,null,2));
console.log(variants.map(v=>`${v.id}: ${v.duration}s`).join('\n'));
