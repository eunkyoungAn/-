// M365 재취업 컨설팅 블로그 이미지 img1~5: 사용자 원본 밈을 템플릿으로 문구만 교체
// 사용: NODE_PATH=$(npm root -g) node build_images.js
// 템플릿 A(2.png, 사진 1·2·3·5): 제목·말풍선 글자만 흰색으로 덮고 새 문구 삽입(캐릭터·말풍선 외곽선·꼬리는 원본 그대로)
// 템플릿 B(3.webp, 사진 4): 위에 흰 띠를 붙이고 사진 위에 캡션 삽입(사진 원본 픽셀은 수정하지 않음)
// 폰트: @fontsource/noto-sans-kr 를 FONT_DIR/node_modules 에 npm 설치
const fs=require('fs'),os=require('os'),{execSync}=require('child_process');const {chromium}=require('playwright');
const SRC_DIR='/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/images/';
const SRC_A=SRC_DIR+'2.png',SRC_B=SRC_DIR+'3.webp';
const F=(process.env.FONT_DIR||'/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad/fnt')+'/node_modules/@fontsource/noto-sans-kr/';
const OUT=__dirname+'/images/',TMP=os.tmpdir()+'/m365_meme.html';
for(const f of [SRC_A,SRC_B])if(!fs.existsSync(f)){console.error('원본 밈 이미지를 찾을 수 없습니다: '+f+'\n사용자가 준 2.png(템플릿 A), 3.webp(템플릿 B)를 SRC_DIR 에 두고 다시 실행하세요.');process.exit(1)}
if(!fs.existsSync(F+'900.css')){console.error('폰트 없음: '+F+' (npm i @fontsource/noto-sans-kr 를 FONT_DIR 에 설치)');process.exit(1)}
fs.mkdirSync(OUT,{recursive:true});
const b64=(f,m)=>`data:${m};base64,`+fs.readFileSync(f).toString('base64');
const RED='#F0564A';
// 템플릿 A 말풍선 타원(원본 736x920 좌표) — 안쪽 흰 타원으로 글자만 덮는다
const BUB=[{cx:191,cy:344,rx:121,ry:70},{cx:497,cy:338,rx:122,ry:58},{cx:313,cy:673,rx:121,ry:65}];
const memes=[
 ['수료 직후 나랑 이력서 대화 수준:',['배운 건 많은데..','그래서 뭐<br>썼는데?','아니<br>배운 건 많다고;;;']],
 ['나랑 경험노트 대화 수준:',['나 쓸 경험이<br>없어..','실습한 건<br>뭔데?','아니<br>쓸 게 없다고;;;']],
 ['나랑 이력서 문장 대화 수준:',['관리 수업<br>들었어..','그래서 뭘<br>해결했는데?','아니<br>수업 들었다고;;;']],
 null,
 ['나랑 프로젝트 정리 대화 수준:',['프로젝트<br>했는데..','그 공고랑<br>연결은?','아니<br>프로젝트 했다고;;;']]];
const A=(t,b)=>`<div class="a"><img src="${b64(SRC_A,'image/png')}" style="position:absolute;left:0;top:0;width:736px;height:920px">
<div style="position:absolute;left:0;top:96px;width:736px;height:100px;background:#fff"></div>
<div class="fit title" style="position:absolute;left:0;top:112px;width:736px;height:62px;font-size:44px;font-weight:900;line-height:62px;text-align:center">${t}</div>
<div class="chip">가상 대화</div>
${BUB.map((e,i)=>`<div style="position:absolute;left:${e.cx-e.rx+9}px;top:${e.cy-e.ry+9}px;width:${2*e.rx-18}px;height:${2*e.ry-18}px;border-radius:50%;background:#fff"></div>
<div class="fit bt" style="position:absolute;left:${e.cx-e.rx*.72}px;top:${e.cy-e.ry*.66}px;width:${e.rx*1.44}px;height:${e.ry*1.32}px">${b[i]}</div>`).join('')}
<div class="brand">커리어캐쳐(CareerCatcher)</div></div>`;
const B=`<div class="a" style="width:1080px;height:1640px;background:#fff"><img src="${b64(SRC_B,'image/webp')}" style="position:absolute;left:0;top:200px;width:1080px;height:1440px">
<div class="fit title" style="position:absolute;left:0;top:28px;width:1080px;height:96px;font-size:76px;font-weight:900;line-height:96px;text-align:center">면접 전날 이동 중 나:</div>
<div class="chip" style="top:134px;font-size:44px;padding:2px 30px;border-width:4px;border-radius:36px">가상 장면</div>
<div class="brand" style="top:146px;bottom:auto;right:30px;font-size:22px">커리어캐쳐(CareerCatcher)</div>
<div style="position:absolute;left:0;top:1380px;width:1080px;height:260px;background:linear-gradient(transparent,rgba(0,0,0,.62) 35%)"></div>
<div class="cap" style="top:1440px;font-size:80px">머릿속 답변은 완벽함</div>
<div class="cap" style="top:1550px;font-size:50px;font-weight:800">입 밖으로 꺼내면 딴 얘기</div></div>`;
const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:'Noto Sans KR','Noto Sans CJK KR','WenQuanYi Zen Hei',sans-serif;background:#555}
.a{width:736px;height:920px;position:relative;overflow:hidden;background:#fff;margin-bottom:20px}
.title{color:#000;white-space:nowrap}.bt{display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;line-height:1.3;color:#111;font-size:28px}
.chip{position:absolute;left:50%;transform:translateX(-50%);top:180px;font-size:28px;font-weight:800;color:${RED};border:3px solid ${RED};border-radius:24px;padding:0 20px;line-height:1.35;background:#fff;white-space:nowrap}
.brand{position:absolute;right:20px;bottom:14px;font-size:17px;font-weight:700;color:#777}
.cap{position:absolute;left:0;width:1080px;text-align:center;font-weight:900;color:#fff;-webkit-text-stroke:10px #000;paint-order:stroke fill;line-height:1.2;white-space:nowrap}`;
const link=['500','700','800','900'].map(w=>`<link rel="stylesheet" href="file://${F}${w}.css">`).join('');
const cards=memes.map(m=>m?A(m[0],m[1]):B);
fs.writeFileSync(TMP,`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${cards.join('')}</body></html>`);
(async()=>{const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1200,height:1700},deviceScaleFactor:2});
await pg.goto('file://'+TMP);await pg.evaluate(()=>document.fonts.ready);
// 글자가 영역보다 크면 폰트를 줄여 맞춘다
await pg.evaluate(()=>{const rw=x=>{const r=document.createRange();r.selectNodeContents(x);return r.getBoundingClientRect()};
 document.querySelectorAll('.fit').forEach(e=>{let s=parseFloat(getComputedStyle(e).fontSize);const inner=e.classList.contains('bt');
 const over=()=>inner?(rw(e).width>e.clientWidth+1||rw(e).height>e.clientHeight):e.scrollWidth>e.clientWidth+1;
 let n=0;while(over()&&s>12&&n++<80){s-=1;e.style.fontSize=s+'px'}})});
await pg.waitForTimeout(800);
const els=await pg.$$('.a');for(let i=0;i<els.length;i++)await els[i].screenshot({path:OUT+'img'+(i+1)+'.png'});
await br.close();
execSync('zip -q -FS images_all.zip img1.png img2.png img3.png img4.png img5.png',{cwd:OUT});})();
