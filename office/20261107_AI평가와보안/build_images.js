// 블로그 이미지 img2~img5 (1200x800) 생성 + img1 변환 + zip
// 사용: node build_images.js  (폰트: fontsource 패키지를 FONT_DIR에 npm 설치해 둘 것)
const fs=require('fs'),os=require('os'),{execSync}=require('child_process');const {chromium}=require('playwright');
const F=(process.env.FONT_DIR||'/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad/fnt')+'/node_modules/@fontsource/';
const J=__dirname+'/',OUT=J+'blog_images/',ST='/home/user/-/templates/character_coach/';
const SRC1='/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/images/1.webp';
const TMP=os.tmpdir()+'/blog_all_20261107.html';
fs.mkdirSync(OUT,{recursive:true});
const brand=`<div class="brand">커리어캐쳐 | CareerCatcher</div>`;
const st=(n,h)=>`<img class="cut" src="file://${ST}${n}.png" style="right:24px;bottom:0;height:${h}px">`;
const cards={
img2:`<div class="b sky"><div class="kick">AI 평가 기준 이동</div><h1 class="mj" style="font-size:54px">시험 점수 vs 끝까지 해내는 평가</h1>
<div class="cmp">
<div class="col"><h2>시험 점수형 평가</h2><p>정해진 문제</p><s>▼</s><p>정답 맞히기</p><s>▼</s><p>점수</p></div>
<div class="vs">vs</div>
<div class="col red"><h2>과제 완수형 평가</h2><p>실제 일 (예: 생활 과제)</p><s>▼</s><p>끝까지 수행</p><s>▼</s><p>해냈는지 확인</p></div></div>
<div class="note" style="width:800px">두 방식이 함께 쓰여요 · LifeVal(생활 과제 169개)은 보도 기준, OpenAI 자체 결과, 외부 검증은 아직</div>${st('think',290)}${brand}</div>`,
img3:`<div class="b white"><div class="kick">확인 수준 정리</div><h1 class="mj" style="font-size:50px">11월 7일 AI 소식, 어디까지 확인했나</h1>
<div class="tb">${[['GPT-6 Cyber','보도 기준','공식 발표 여부 원문 확인 전'],['LifeVal','보도 기준','OpenAI 자체 결과'],['Kimi K3.1 Pro','보도 기준','가중치는 공개 예정으로 보도'],['조코딩·안될공학 영상','제목 기준','내용 미확인'],['Claude','검색요약','이름·시점 확인 필요']].map(r=>`<div><b>${r[0]}</b><span class="lv">${r[1]}</span><em>${r[2]}</em></div>`).join('')}</div>
${st('ok',300)}${brand}</div>`,
img4:`<div class="b sky"><div class="kick">자소서 AI 경험 · 제안 틀</div><h1 class="mj" style="font-size:50px">AI 경험은 네 칸으로 나눠 쓰세요</h1>
<div class="four">${[['1','목표','무엇을 해결하려 했는지'],['2','내가 한 일','AI에게 맡긴 부분과 내가 직접 판단·수정한 부분'],['3','결과','실제 기록으로 말할 수 있는 변화'],['4','검증','출처 대조, 직접 테스트 등 확인 방법']].map(x=>`<div><i>${x[0]}</i><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')}</div>
<div class="sent">“[목표]를 위해 AI에게 [맡긴 일]을 맡기고, [내가 직접 확인·수정한 부분]을 거쳐 [결과]를 냈습니다. 결과는 [검증 방법]으로 확인했습니다.”</div>
<div class="note" style="width:760px;margin-top:12px">가상의 일반 문장이며 실제 사례가 아닙니다</div>${st('fight',270)}${brand}</div>`,
img5:`<div class="b white"><div class="kick">면접 대비 · 제안</div><h1 class="mj" style="font-size:50px">AI 경험 면접 점검 체크리스트</h1>
<ul class="ck">${['문장마다 근거 자료를 말로 설명할 수 있나요?','AI가 만든 수치·성과를 내 기록과 대조했나요?','“내가 어디까지 판단했는지” 말할 수 있나요?','수정하거나 실패한 지점을 하나 말할 수 있나요?'].map(t=>`<li><i>☑</i>${t}</li>`).join('')}</ul>
<div class="box"><b>(제안)</b> 연습용 예상 질문: “그 일을 AI에게 맡길 때 무엇을 직접 확인하셨나요?”</div>${st('best',340)}${brand}</div>`};
const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:'Noto Sans KR','WenQuanYi Zen Hei',sans-serif;background:#555}
.b{width:1200px;height:800px;position:relative;overflow:hidden;padding:50px 64px;margin-bottom:20px}
.cut{position:absolute}.mj{font-family:'Nanum Myeongjo','WenQuanYi Zen Hei',serif;font-weight:800}
.kick{display:inline-block;background:#111;color:#fff;font-size:24px;font-weight:700;padding:8px 18px}
.white{background:#F6F6F6}.sky{background:radial-gradient(ellipse at 70% 20%,#9CC8FF,#E9F3FF 50%,#fff 80%)}
h1{line-height:1.18;margin-top:22px;letter-spacing:-1px;position:relative;z-index:2}
.brand{position:absolute;left:64px;bottom:28px;font-size:21px;font-weight:700;color:#666}
.note{font-size:22px;color:#333;font-weight:500;line-height:1.5;margin-top:22px}
.cmp{display:flex;align-items:stretch;gap:18px;margin-top:28px;width:1000px}
.col{flex:1;background:#fff;border:3px solid #111;padding:16px 20px;text-align:center}.col.red{border-color:#F0564A;background:#FFF5F3}
.col h2{font-size:30px;font-weight:900;margin-bottom:8px}.col.red h2{color:#F0564A}
.col p{font-size:25px;font-weight:700;padding:8px 0;background:#F0F0F0}.col.red p{background:#FFE4DF}
.col s{display:block;text-decoration:none;color:#F0564A;font-size:20px;line-height:1.1}
.vs{align-self:center;font-size:30px;font-weight:900;color:#F0564A}
.tb{margin-top:26px;width:830px}.tb div{display:flex;align-items:center;height:70px;background:#fff;border:3px solid #111;margin-bottom:-3px;padding:0 18px}
.tb b{width:270px;font-size:24px;font-weight:900}.lv{width:130px;text-align:center;background:#F0564A;color:#fff;font-size:20px;font-weight:700;padding:4px 0;margin-right:22px;border-radius:4px}.tb em{font-style:normal;font-size:22px;font-weight:500;flex:1}
.four{display:flex;gap:14px;margin-top:26px;width:1072px}.four div{flex:1;background:#fff;border:3px solid #111;padding:16px 16px;min-height:200px}
.four i{display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;font-style:normal;background:#F0564A;color:#fff;font-weight:900;border-radius:50%;font-size:20px}
.four b{display:block;font-size:30px;font-weight:900;margin:8px 0}.four small{display:block;font-size:20px;line-height:1.5;color:#444;font-weight:500}
.sent{margin-top:22px;width:830px;background:#fff;border:4px solid #F0564A;padding:16px 24px;font-size:23px;font-weight:700;line-height:1.55}
.ck{list-style:none;padding:0;margin-top:26px;width:830px}.ck li{font-size:26px;font-weight:700;background:#fff;border:3px solid #111;padding:13px 22px;margin-bottom:12px}.ck i{color:#F0564A;font-style:normal;margin-right:14px;font-weight:900}
.box{margin-top:16px;width:830px;background:#fff;border:4px solid #F0564A;padding:14px 24px;font-size:23px;font-weight:700;line-height:1.5}.box b{color:#F0564A}`;
const link=['noto-sans-kr/500','noto-sans-kr/700','noto-sans-kr/900','nanum-myeongjo/800'].map(n=>{const[a,w]=n.split('/');return `<link rel="stylesheet" href="file://${F}${a}/${w}.css">`}).join('');
fs.writeFileSync(TMP,`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${Object.values(cards).join('')}</body></html>`);
(async()=>{const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1300,height:900}});
await pg.goto('file://'+TMP);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(1000);
const els=await pg.$$('.b');const names=Object.keys(cards);
for(let i=0;i<els.length;i++)await els[i].screenshot({path:OUT+names[i]+'.png'});
// img1: 원본 데일리 카드를 PNG로 변환만 (가로 1080, 비율 유지)
if(fs.existsSync(SRC1)){const p2=await br.newPage({viewport:{width:1080,height:1350}});
 fs.writeFileSync(TMP+'.1.html',`<body style="margin:0"><img id=i src="file://${SRC1}" style="width:1080px;display:block">`);await p2.goto('file://'+TMP+'.1.html');
 await p2.waitForFunction(()=>document.getElementById('i').complete);
 const i=await p2.$('#i');const bb=await i.boundingBox();console.log('img1 box',bb.width,bb.height);
 await p2.setViewportSize({width:1080,height:Math.ceil(bb.height)});await i.screenshot({path:OUT+'img1.png'})}else console.log('NO img1 source');
await br.close();
execSync('zip -q -FS blog_images_all.zip img1.png img2.png img3.png img4.png img5.png',{cwd:OUT});})();
