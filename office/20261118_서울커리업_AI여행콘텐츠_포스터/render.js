const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
await p.goto('file://'+__dirname+'/poster.html');await p.evaluate(()=>document.fonts.ready);
await p.locator('.poster').screenshot({path:__dirname+'/poster.png'});await b.close()})();
