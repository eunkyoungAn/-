const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
await p.goto('file://'+__dirname+'/cards.html');await p.evaluate(()=>document.fonts.ready);
for(const i of [1,2,3]){await p.locator('#c'+i).screenshot({path:__dirname+'/card'+i+'.png'});}
const o=await p.evaluate(()=>[...document.querySelectorAll('.card')].map(c=>{const f=c.querySelector('.foot').getBoundingClientRect();let m=0;[...c.children].forEach(e=>{if(!e.classList.contains('foot')&&!e.classList.contains('pg'))m=Math.max(m,e.getBoundingClientRect().bottom)});return [Math.round(m),Math.round(f.top)]}));
console.log(JSON.stringify(o));await b.close()})();
