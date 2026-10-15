const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const out=process.argv[2],video=process.argv[3]==='video';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:1400}});
await p.goto('file://'+out+'/cards.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(1500);
const seek=t=>p.evaluate(t=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=t}),t);
const cs=await p.$$('.c');const names=['00_cover','01','02','03','04','05','06_cta'];
for(let i=0;i<cs.length;i++){await seek(4800);await cs[i].screenshot({path:`${out}/png/${names[i]}.png`});
 if(video){const d=`${out}/frames`;fs.rmSync(d,{recursive:true,force:true});fs.mkdirSync(d);
  for(let f=0;f<5*30;f++){await seek(f*1000/30);await cs[i].screenshot({path:`${d}/${String(f).padStart(4,'0')}.png`})}
  execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${d}/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 ${out}/mp4/${names[i]}.mp4`);fs.rmSync(d,{recursive:true})}}
await b.close()})()
