// 포스터 HTML → PNG. 사용: node ai-report/tools/render_poster.js <poster.html 절대경로> <poster.png 절대경로> [배율=2]
const { chromium } = require('playwright');
(async () => {
  const [,, html, png, scale] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: Number(scale || 2) });
  await p.goto('file://' + html); await p.evaluate(() => document.fonts.ready);
  const el = await p.$('.poster'); await el.screenshot({ path: png });
  const over = await p.evaluate(() => { const r = document.querySelector('.poster'); const f = document.querySelector('.foot').getBoundingClientRect(); const i = document.querySelector('.insight').getBoundingClientRect(); return { insightBottom: i.bottom, footTop: f.top, overflow: r.scrollHeight > r.clientHeight }; });
  console.log(JSON.stringify(over)); await b.close();
})();
