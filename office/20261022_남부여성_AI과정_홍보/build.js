// 교육과정 홍보 포스터형 카드뉴스 4장 (파란 프레임 + 초록 잔디 + 흰 카드)
const fs=require('fs'),path=require('path');const F='file://'+path.resolve(__dirname,'../../templates/카드뉴스_매거진_사진형/fonts');
const person=`<svg viewBox="0 0 300 260" width="330"><ellipse cx="150" cy="245" rx="120" ry="12" fill="#1a9a4c" opacity=".35"/>
<path d="M60 230 Q70 170 120 160 L180 160 Q230 170 240 230Z" fill="#fff"/><circle cx="150" cy="110" r="42" fill="#f6c9a8"/>
<path d="M108 100 Q112 58 150 60 Q192 60 194 104 Q170 84 140 90 Q120 92 108 100Z" fill="#2a2a3a"/>
<circle cx="135" cy="112" r="5" fill="#222"/><circle cx="165" cy="112" r="5" fill="#222"/><path d="M138 128 Q150 138 162 128" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/>
<rect x="95" y="175" width="110" height="70" rx="8" fill="#5b5bd6"/><rect x="85" y="240" width="130" height="10" rx="5" fill="#3d3db0"/>
<circle cx="150" cy="210" r="8" fill="#fff" opacity=".8"/></svg>`;
const deco=`<i class="st" style="left:70px;top:150px">✳</i><i class="st" style="right:80px;top:120px">✳</i><i class="st sm" style="left:120px;top:620px">&lt;/&gt;</i><i class="st sm" style="right:110px;top:560px">♪</i>`;
const balloons=`<svg class="bl" viewBox="0 0 200 260" style="left:60px;top:60px"><ellipse cx="60" cy="70" rx="40" ry="50" fill="#3b82f6"/><path d="M60 120 Q70 180 55 250" stroke="#999" fill="none" stroke-width="3"/><ellipse cx="140" cy="60" rx="34" ry="44" fill="#ffc83d"/><path d="M140 104 Q130 170 145 250" stroke="#999" fill="none" stroke-width="3"/></svg>
<svg class="bl" viewBox="0 0 200 260" style="right:60px;top:60px"><ellipse cx="70" cy="70" rx="38" ry="48" fill="#2ecc71"/><path d="M70 118 Q80 180 65 250" stroke="#999" fill="none" stroke-width="3"/><ellipse cx="145" cy="80" rx="32" ry="42" fill="#ff8a3d"/><path d="M145 122 Q135 180 150 250" stroke="#999" fill="none" stroke-width="3"/></svg>`;
const courses=[
['10.23·30','챗GPT·코파일럿 프롬프트 실무(기획)','금 10:00-13:00','2회','30,000원','q'],
['11.06·13','챗GPT·코파일럿 프롬프트 실무(업무활용)','금 10:00-13:00','2회','30,000원','q'],
['11.16·18','AI활용 오피스 문서작성 실무(Claude AI)','월·수 19:00-21:30','2회','30,000원','d'],
['11.17','AI시대, 자기소개서 작성법','화 10:00-13:00','1회','20,000원','j'],
['11.17','AI활용 기업·직무분석','화 14:00-17:00','1회','20,000원','j'],
['11.20·27','AI활용 스마트 문서작성 실무','금 10:00-13:00','2회','30,000원','d'],
['12.03·10','AI활용 자녀맞춤 학습자료 제작','목 10:00-13:00','2회','30,000원','l'],
['12.04·11','AI활용 여행콘텐츠 기획 실무','금 10:00-13:00','2회','30,000원','l']];
const tagN={q:'질문',d:'문서',j:'취업',l:'생활'};
const cards=[
`<div class="c blue cover">${deco}
 <div class="squig">∽∽∽∽∽</div>
 <div class="org">남부여성발전센터 × 안은경 강사와 함께하는</div>
 <h1>실무에 바로<br>적용하는 AI</h1>
 <div class="ribbon">질문에서 문서로, 생활에서 실무로!</div>
 <div class="season">2026년 4분기 · 10월~12월 개강 · 8개 과정</div>
 <div class="hero">${person}<b class="ok">OK!</b></div>
 <div class="grass"></div></div>`,
`<div class="c blue"><div class="card">
 <div class="pill">AI, 이제 전문가만의 도구가 아니에요!</div>
 <h2>배운 그대로<br>내 일에 바로 쓰는 AI 수업!</h2>
 <div class="chat"><div class="me">바쁜데, 정말 실무에<br>도움이 될까요?</div>
 <div class="you">그럼요! 내 업무·생활 문제에 바로<br>연결해서 직접 실습해요 😊</div>
 <div class="me">배우면 어디에 쓸 수 있어요?</div>
 <div class="you">질문 설계, 업무 문서, 자기소개서,<br>자녀 학습자료와 여행 계획까지!</div></div>
 <div class="four"><span><b>01</b>질문 설계</span><span><b>02</b>업무 문서</span><span><b>03</b>취업·커리어</span><span><b>04</b>생활·학습</span></div>
 <p class="phil">생각하는 주체는 나, 실행을 돕는 도구는 AI</p>
 </div><div class="grass"></div></div>`,
`<div class="c green"><div class="card">
 <div class="pill g">2026년 4분기 과정 일정</div>
 <h2 class="s">골라 듣는 8개 실무 과정</h2>
 <table>${courses.map(c=>`<tr><td class="dt">${c[0]}</td><td><span class="tg ${c[5]}">${tagN[c[5]]}</span><b>${c[1]}</b><small>${c[2]} · ${c[3]}</small></td><td class="fee">${c[4]}</td></tr>`).join('')}</table>
 <p class="note">담당강사 안은경 · 게시 일정·수강료는 변경될 수 있습니다</p>
 </div></div>`,
`<div class="c green"><div class="card">${balloons}
 <div class="pill g">놓치지 말고 신청하세요!</div>
 <h2>배운 날부터<br>내 일에 연결되는 AI!</h2>
 <p class="q3t">수업을 관통하는 세 가지 질문</p>
 <div class="q3"><div><b>문제정의</b>내가 해결하려는 문제는 무엇인가?</div><div><b>자동화 업무 발굴</b>어떤 반복 업무를 자동화할 것인가?</div><div><b>데이터의 중요성</b>어떤 데이터가 필요하고 믿을 만한가?</div></div>
 <p class="slogan">생각하는 주체는 나, 실행을 돕는 도구는 AI.</p>
 <p class="note">최신 일정은 과정별 공식 안내를 확인해 주세요</p>
 <div class="sig">담당강사 안은경 | 커리어캐쳐(CareerCatcher) · @career_catcher_ek</div>
 </div></div>`];
const css=`@font-face{font-family:P;font-weight:500;src:url(${F}/Pretendard-Medium.woff2)}@font-face{font-family:P;font-weight:700;src:url(${F}/Pretendard-Bold.woff2)}@font-face{font-family:P;font-weight:800;src:url(${F}/Pretendard-ExtraBold.woff2)}@font-face{font-family:P;font-weight:900;src:url(${F}/Pretendard-Black.woff2)}
*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:P;background:#888;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px}
.blue{background:#1f5fd6}.green{background:#3ccf7a}
.grass{position:absolute;left:-40px;right:-40px;bottom:-60px;height:260px;background:#2fd17a;border-radius:50% 50% 0 0/80px 80px 0 0;box-shadow:0 -30px 0 #24b866 inset}
.st{position:absolute;color:#fff;font-style:normal;font-size:56px;opacity:.85}.st.sm{font-size:36px;color:#9fd0ff}
.cover{color:#fff;text-align:center}.squig{margin-top:110px;font-size:64px;color:#3ce38a;letter-spacing:-6px;font-weight:900}
.org{margin-top:20px;font-size:34px;font-weight:700}
.cover h1{margin-top:40px;font-size:150px;font-weight:900;line-height:1.08;letter-spacing:-6px;color:#fff;text-shadow:0 10px 0 #1748a8}
.ribbon{display:inline-block;margin-top:56px;background:#fff;color:#18a957;font-size:50px;font-weight:900;padding:22px 50px;border-radius:12px;transform:rotate(-3deg);box-shadow:0 10px 0 #0f8a43}
.season{margin-top:46px;font-size:32px;font-weight:700;color:#cfe2ff}
.hero{position:absolute;left:0;right:0;bottom:150px;z-index:2;display:flex;justify-content:center}
.ok{position:absolute;margin-left:330px;margin-top:10px;font-size:76px;color:#fff;font-weight:900;transform:rotate(-8deg)}
.card{position:absolute;left:60px;right:60px;top:60px;bottom:170px;background:#fff;border-radius:28px;padding:56px 50px;text-align:center;z-index:1;box-shadow:0 14px 0 rgba(0,0,0,.12)}
.green .card{bottom:60px}
.pill{display:inline-block;background:#1f5fd6;color:#fff;font-size:34px;font-weight:800;padding:14px 34px;border-radius:40px}.pill.g{background:#18a957}
h2{margin-top:30px;font-size:66px;font-weight:900;line-height:1.25;letter-spacing:-2px;color:#111}h2.s{font-size:58px}
.chat{margin-top:40px;display:flex;flex-direction:column;gap:16px;text-align:left}
.chat div{max-width:80%;font-size:31px;font-weight:700;line-height:1.4;padding:18px 28px;border-radius:26px}
.me{align-self:flex-start;background:#eef1f6;color:#333;border-bottom-left-radius:4px}.you{align-self:flex-end;background:#1f5fd6;color:#fff;border-bottom-right-radius:4px}
.four{margin-top:32px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.four span{background:#e8f8ef;border-radius:18px;padding:18px 6px;font-size:28px;font-weight:800;color:#127a3e}.four b{display:block;font-size:24px;color:#18a957}
.phil{margin-top:26px;font-size:32px;font-weight:800;color:#1f5fd6}
table{margin-top:34px;width:100%;border-collapse:separate;border-spacing:0 8px;text-align:left}
td{background:#f3f6fb;padding:11px 16px;font-size:28px;vertical-align:middle}td:first-child{border-radius:14px 0 0 14px}td:last-child{border-radius:0 14px 14px 0}
.dt{width:150px;font-weight:900;color:#1f5fd6;font-size:30px}td b{font-size:27px;font-weight:800;color:#111}td small{display:block;margin-top:2px;font-size:22px;color:#666;font-weight:500}
.fee{width:150px;text-align:right;font-weight:900;color:#18a957;font-size:30px}
.tg{display:inline-block;font-size:20px;font-weight:800;color:#fff;border-radius:8px;padding:3px 10px;margin-right:10px;vertical-align:3px}.tg.q{background:#1f5fd6}.tg.d{background:#7a5af5}.tg.j{background:#ff8a3d}.tg.l{background:#18a957}
.note{margin-top:20px;font-size:24px;color:#888}
.bl{position:absolute;width:200px}
.fees{margin-top:80px;display:flex;gap:30px;justify-content:center}.fees div{flex:1;background:#eaf2ff;border-radius:24px;padding:36px 10px}.fees small{display:block;font-size:32px;font-weight:700;color:#1f5fd6}.fees b{font-size:84px;font-weight:900;color:#111;letter-spacing:-2px}.fees i{font-style:normal;font-size:40px}
.apply{margin-top:70px;text-align:left}.row{display:flex;align-items:center;gap:24px;font-size:38px;font-weight:800;padding:22px 0;border-bottom:2px dashed #ddd}.row span{background:#18a957;color:#fff;font-size:28px;padding:8px 20px;border-radius:10px}.row em{font-style:normal;color:#666;font-size:30px}
.q3t{margin-top:50px;font-size:34px;font-weight:800;color:#18a957}.q3{margin-top:26px;display:flex;flex-direction:column;gap:18px}.q3 div{background:#eaf2ff;border-radius:22px;padding:22px 30px;font-size:32px;font-weight:700;line-height:1.4;color:#222;text-align:left}.q3 b{display:block;font-size:28px;color:#1f5fd6;margin-bottom:6px}
.slogan{margin-top:50px;font-size:40px;font-weight:900;color:#1f5fd6}
.sig{position:absolute;left:0;right:0;bottom:50px;font-size:26px;color:#666;font-weight:700}`;
fs.writeFileSync(__dirname+'/cards.html',`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${cards.join('')}</body></html>`);
(async()=>{const {chromium}=require('playwright');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1120,height:1400}});
await p.goto('file://'+__dirname+'/cards.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
const cs=await p.$$('.c');for(let i=0;i<cs.length;i++)await cs[i].screenshot({path:`${__dirname}/png/card_0${i+1}.png`});await b.close()})();
