const {chromium}=require('/opt/node-tools/node_modules/playwright');const fs=require('fs');
const D=__dirname+'/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1300,height:2000}});
await p.goto('file://'+D+'all.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
fs.mkdirSync(D+'blog_images',{recursive:true});
const bs=await p.$$('.b');for(let i=0;i<bs.length;i++)await bs[i].screenshot({path:`${D}blog_images/img${i+1}.png`});
const c=await p.$('.c');await c.screenshot({path:D+'post_single.png'});await b.close()})()
