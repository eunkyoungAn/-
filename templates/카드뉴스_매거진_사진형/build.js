// 매거진 사진형 카드뉴스: 사진 배경 + 하단 큰 흰 글씨
// 사용: NODE_PATH=$(npm root -g) node templates/카드뉴스_매거진_사진형/build.js <작업폴더 절대경로>
// 작업폴더에 cards.json 이 있어야 하고, 결과는 cards.html + png/ 로 나온다.
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const T = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(dir, 'cards.json'), 'utf8'));
const brand = data.brand || 'CareerCatcher Magazine';

// 사진이 없을 때 쓰는 분위기 배경 (사진처럼 보이도록 빛 번짐 + 노이즈)
const scenes = {
  night: 'radial-gradient(60% 40% at 70% 35%,#5b7cff88,transparent 70%),radial-gradient(40% 30% at 20% 20%,#ff9a6a55,transparent 70%),linear-gradient(160deg,#1b2140,#0b0d18 70%)',
  cafe: 'radial-gradient(50% 35% at 25% 25%,#ffd29a99,transparent 70%),radial-gradient(45% 35% at 80% 45%,#c87a4a88,transparent 70%),linear-gradient(170deg,#6b4a35,#22160f 75%)',
  window: 'radial-gradient(55% 45% at 65% 20%,#fff4d6cc,transparent 70%),radial-gradient(40% 40% at 15% 60%,#9fb8c288,transparent 70%),linear-gradient(175deg,#a9b4b8,#2c3236 80%)',
  office: 'radial-gradient(50% 40% at 50% 15%,#e6f1ffaa,transparent 70%),radial-gradient(35% 30% at 85% 60%,#6fd3c066,transparent 70%),linear-gradient(170deg,#56677a,#151b22 78%)',
  dawn: 'radial-gradient(60% 40% at 50% 30%,#ffb38acc,transparent 70%),radial-gradient(40% 30% at 85% 15%,#ff7aa866,transparent 70%),linear-gradient(175deg,#7a5d8c,#1d1626 80%)',
  mint: 'radial-gradient(55% 40% at 30% 25%,#cfeee0cc,transparent 70%),radial-gradient(40% 30% at 80% 50%,#7fd1b488,transparent 70%),linear-gradient(170deg,#5f8f80,#13201c 80%)'
};
// 사물 실루엣 (흐릿한 소품: 노트북·컵·폰)
const props = {
  laptop: '<svg class="prop" viewBox="0 0 600 400" style="left:330px;top:300px;width:720px"><rect x="90" y="40" width="420" height="270" rx="18" fill="#0d0f16"/><rect x="110" y="60" width="380" height="230" rx="8" fill="#8fb3ff" opacity=".55"/><path d="M40 320h520l-40 40H80z" fill="#1a1d26"/></svg>',
  cup: '<svg class="prop" viewBox="0 0 300 380" style="left:620px;top:330px;width:380px"><path d="M60 80h180l-22 280H82z" fill="#f4ece2"/><rect x="50" y="60" width="200" height="30" rx="10" fill="#e8ddd0"/><path d="M95 170h110v70H95z" fill="#c8a27a" opacity=".7"/></svg>',
  phone: '<svg class="prop" viewBox="0 0 300 560" style="left:640px;top:220px;width:300px;transform:rotate(12deg)"><rect x="20" y="10" width="260" height="540" rx="40" fill="#111"/><rect x="36" y="30" width="228" height="500" rx="28" fill="#b9f0d8" opacity=".55"/></svg>',
  chart: '<svg class="prop" viewBox="0 0 500 400" style="left:470px;top:260px;width:560px"><rect width="500" height="400" rx="30" fill="#ffffff" opacity=".12"/><rect x="60" y="250" width="70" height="100" rx="8" fill="#fff" opacity=".5"/><rect x="170" y="180" width="70" height="170" rx="8" fill="#fff" opacity=".6"/><rect x="280" y="90" width="70" height="260" rx="8" fill="#7fe3c2" opacity=".85"/></svg>',
  none: ''
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// 제목 문법: 줄바꿈은 \n, "따옴표" 줄은 더 크고 굵게, *강조* 는 포인트색
const fmt = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
const title = t => t.split('\n').map(l => /^[“"].*[”"]$/.test(l.trim()) ? `<span class="q">${fmt(l)}</span>` : `<span>${fmt(l)}</span>`).join('');

const n = data.cards.length;
const html = data.cards.map((c, i) => {
  const photo = c.photo && fs.existsSync(path.join(dir, c.photo));
  const bg = photo ? `url('${c.photo}') center/cover` : (scenes[c.scene] || scenes.night);
  const dots = Array.from({ length: n }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
  return `<div class="c ${c.layout || ''}">
  <div class="bg" style="background:${bg}"></div>${photo ? '' : `<div class="blur">${props[c.prop || 'none']}</div><div class="grain"></div>`}
  <div class="shade"></div>
  ${c.kicker ? `<div class="kicker">${fmt(c.kicker)}</div>` : ''}
  <div class="txt">
    <h1>${title(c.title)}</h1>
    ${c.sub ? `<p class="sub">${fmt(c.sub)}</p>` : ''}
    ${c.body ? `<p class="body">${fmt(c.body).replace(/\n/g, '<br>')}</p>` : ''}
    ${c.stat ? `<div class="stat"><b>${esc(c.stat[0])}</b><span>${fmt(c.stat[1])}</span></div>` : ''}
  </div>
  ${c.source ? `<div class="src">${esc(c.source)}</div>` : ''}
  <div class="brand">${esc(brand)}</div>
  <div class="dots">${dots}</div>
</div>`;
}).join('\n');

const F = 'file://' + T + '/fonts';
const css = `
@font-face{font-family:P;font-weight:500;src:url(${F}/Pretendard-Medium.woff2)}
@font-face{font-family:P;font-weight:600;src:url(${F}/Pretendard-SemiBold.woff2)}
@font-face{font-family:P;font-weight:700;src:url(${F}/Pretendard-Bold.woff2)}
@font-face{font-family:P;font-weight:800;src:url(${F}/Pretendard-ExtraBold.woff2)}
@font-face{font-family:P;font-weight:900;src:url(${F}/Pretendard-Black.woff2)}
*{margin:0;box-sizing:border-box;word-break:keep-all}
body{font-family:P,sans-serif;background:#333;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px;color:#fff}
.bg,.blur,.grain,.shade{position:absolute;inset:0}
.blur{filter:blur(14px);opacity:.9}.prop{position:absolute}
.grain{opacity:.18;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>")}
.shade{background:linear-gradient(180deg,rgba(0,0,0,.25) 0%,transparent 22%,transparent 38%,rgba(0,0,0,.55) 62%,rgba(0,0,0,.82) 100%)}
.kicker{position:absolute;left:80px;top:80px;font-size:30px;font-weight:700;letter-spacing:1px;padding:12px 24px;border:2px solid rgba(255,255,255,.8);border-radius:40px}
.txt{position:absolute;left:80px;right:80px;bottom:190px;text-shadow:0 4px 24px rgba(0,0,0,.45)}
h1{font-weight:600;font-size:104px;line-height:1.16;letter-spacing:-3px}
h1 span{display:block}h1 .q{font-weight:900;font-size:124px;letter-spacing:-4px}
h1 em,.sub em,.body em,.stat em{font-style:normal;color:#7FE3C2}
.sub{margin-top:30px;font-size:50px;font-weight:800;letter-spacing:-1px}
.body{margin-top:28px;font-size:38px;font-weight:500;line-height:1.55;color:#eee}
.stat{margin-top:34px;display:flex;align-items:baseline;gap:24px}.stat b{font-size:150px;font-weight:900;letter-spacing:-5px;color:#7FE3C2;line-height:1}.stat span{font-size:38px;font-weight:600;line-height:1.4}
.src{position:absolute;left:80px;bottom:130px;font-size:22px;color:rgba(255,255,255,.65)}
.brand{position:absolute;left:0;right:0;bottom:70px;text-align:center;font-size:30px;font-weight:600;opacity:.92}
.dots{position:absolute;left:0;right:0;bottom:30px;display:flex;justify-content:center;gap:14px}
.dots i{width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.45)}.dots i.on{background:#fff}
.top .txt{bottom:auto;top:200px}.top .shade{background:linear-gradient(180deg,rgba(0,0,0,.8) 0%,rgba(0,0,0,.5) 45%,transparent 70%,rgba(0,0,0,.5) 100%)}
.small h1{font-size:84px}.small h1 .q{font-size:100px}`;
fs.writeFileSync(path.join(dir, 'cards.html'), `<html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`);

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1120, height: 1400 } });
  await p.goto('file://' + path.join(dir, 'cards.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  fs.mkdirSync(path.join(dir, 'png'), { recursive: true });
  const cs = await p.$$('.c');
  for (let i = 0; i < cs.length; i++) await cs[i].screenshot({ path: path.join(dir, 'png', `card_${String(i + 1).padStart(2, '0')}.png`) });
  await b.close(); console.log('rendered', cs.length);
})();
