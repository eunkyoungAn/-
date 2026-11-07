// M365 재취업 컨설팅 블로그 이미지 img1~5 (1200x800, 밈 스타일) 생성 + zip
// 사용: NODE_PATH=$(npm root -g) node build_images.js
// 폰트: fontsource(@fontsource/noto-sans-kr)를 FONT_DIR/node_modules 에 npm 설치해 둘 것. 캐릭터는 코치 스티커 + 캐치 SVG(직접 그림)
const fs=require('fs'),os=require('os'),{execSync}=require('child_process');const {chromium}=require('playwright');
const F=(process.env.FONT_DIR||'/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad/fnt')+'/node_modules/@fontsource/';
const OUT=__dirname+'/images/',ST='/home/user/-/templates/character_coach/';
const TMP=os.tmpdir()+'/m365_blog_imgs.html';
fs.mkdirSync(OUT,{recursive:true});
const RED='#F0564A',INK='#2B2B33';
// ---- 캐치 SVG: 표정(face)·팔(arm) 변형 ----
const FACES={
 smile:`<circle cx="126" cy="160" r="9" fill="${INK}"/><circle cx="174" cy="160" r="9" fill="${INK}"/><circle cx="129" cy="157" r="3" fill="#fff"/><circle cx="177" cy="157" r="3" fill="#fff"/><path d="M136 186 Q150 200 164 186" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
 // 난감(cry 계열 대체): 팔자 눈썹 + 물결 입 + 땀방울
 trouble:`<circle cx="126" cy="162" r="9" fill="${INK}"/><circle cx="174" cy="162" r="9" fill="${INK}"/><circle cx="129" cy="159" r="3" fill="#fff"/><circle cx="177" cy="159" r="3" fill="#fff"/><path d="M106 146 L140 134 M194 146 L160 134" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M130 196 Q140 186 150 196 Q160 206 170 196" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M214 140 q10 16 0 26 q-10 -10 0 -26z" fill="#6EB6FF"/>`,
 think:`<circle cx="126" cy="160" r="9" fill="${INK}"/><circle cx="174" cy="160" r="9" fill="${INK}"/><circle cx="130" cy="156" r="3" fill="#fff"/><circle cx="178" cy="156" r="3" fill="#fff"/><path d="M110 140 L140 138 M162 128 L192 134" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M138 192 L162 190" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
 // sorry: 팔자 눈썹 + 작은 한숨 입 + 땀방울
 sorry:`<path d="M114 164 Q126 154 138 164 M162 164 Q174 154 186 164" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M106 144 L140 132 M194 144 L160 132" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M136 196 Q150 184 164 196" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M214 138 q10 16 0 26 q-10 -10 0 -26z" fill="#6EB6FF"/>`,
 fight:`<circle cx="126" cy="162" r="9" fill="${INK}"/><circle cx="174" cy="162" r="9" fill="${INK}"/><circle cx="129" cy="159" r="3" fill="#fff"/><circle cx="177" cy="159" r="3" fill="#fff"/><path d="M106 140 L140 150 M194 140 L160 150" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M132 184 Q150 210 168 184 Z" fill="#8A2D26" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
 hello:`<circle cx="126" cy="160" r="9" fill="${INK}"/><circle cx="174" cy="160" r="9" fill="${INK}"/><circle cx="129" cy="157" r="3" fill="#fff"/><circle cx="177" cy="157" r="3" fill="#fff"/><path d="M128 182 Q150 214 172 182 Z" fill="#8A2D26" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
};
const mitt=(cx,cy)=>`<ellipse cx="${cx}" cy="${cy}" rx="30" ry="34" fill="#8A5A3B"/><ellipse cx="${cx}" cy="${cy+2}" rx="17" ry="21" fill="#A87150"/>`;
const ARMS={
 down:`<path d="M78 200 Q50 222 48 254" stroke="${RED}" stroke-width="24" fill="none" stroke-linecap="round"/>${mitt(48,266)}<path d="M222 200 Q250 220 258 248" stroke="${RED}" stroke-width="24" fill="none" stroke-linecap="round"/>`,
 wave:`<path d="M78 200 Q40 190 34 150" stroke="${RED}" stroke-width="24" fill="none" stroke-linecap="round"/>${mitt(34,128)}<path d="M222 200 Q250 220 258 248" stroke="${RED}" stroke-width="24" fill="none" stroke-linecap="round"/>`,
 strap:`<path d="M78 200 Q50 222 48 254" stroke="${RED}" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M222 200 Q268 178 264 118" stroke="${RED}" stroke-width="24" fill="none" stroke-linecap="round"/>${mitt(264,96)}`
};
const phones=`<path d="M64 166 Q62 28 150 24 Q238 28 236 166" stroke="#33343C" stroke-width="12" fill="none" stroke-linecap="round"/><rect x="48" y="136" width="34" height="62" rx="15" fill="#33343C"/><rect x="218" y="136" width="34" height="62" rx="15" fill="#33343C"/><rect x="54" y="146" width="12" height="42" rx="6" fill="${RED}"/><rect x="234" y="146" width="12" height="42" rx="6" fill="${RED}"/>`;
const catchy=(h,face,arm,hp)=>`<svg viewBox="0 0 300 320" height="${h}" width="${h*300/320}" style="overflow:visible">
<ellipse cx="150" cy="305" rx="90" ry="10" fill="rgba(0,0,0,.12)"/>
<rect x="70" y="60" width="160" height="200" rx="80" fill="${RED}"/>
<path d="M82 112 Q150 30 218 112 Z" fill="${INK}"/><rect x="200" y="98" width="52" height="14" rx="7" fill="${INK}"/>
<circle cx="150" cy="58" r="7" fill="${INK}"/>
<ellipse cx="150" cy="165" rx="62" ry="54" fill="#FFF3EE"/>
<ellipse cx="108" cy="184" rx="10" ry="6" fill="#FFB4A8"/><ellipse cx="192" cy="184" rx="10" ry="6" fill="#FFB4A8"/>
${FACES[face]}
<rect x="105" y="250" width="28" height="45" rx="14" fill="#C8433A"/><rect x="167" y="250" width="28" height="45" rx="14" fill="#C8433A"/>
${ARMS[arm]}${hp?phones:''}</svg>`;
// ---- 배치 도우미 (모든 좌표 절대값, 1200x800) ----
const abs=(x,y,inner,extra='')=>`<div style="position:absolute;left:${x}px;top:${y}px;${extra}">${inner}</div>`;
const C=(x,y,h,face,arm,hp)=>abs(x,y,catchy(h,face,arm,hp));
const K=(x,y,h,name)=>abs(x,y,`<img src="file://${ST}${name}.png" style="height:${h}px;display:block">`);
// 타원 말풍선 + 꼬리(tx,ty는 캔버스 좌표, bx는 꼬리 밑변 중심 x 비율)
const bubble=(x,y,w,h,html,tx,ty,bx,fs=36)=>{
 const rx=w/2-3,ry=h/2-3,cx=w/2,cy=h/2;const yOn=px=>cy+(ty>y+h/2?1:-1)*ry*Math.sqrt(Math.max(0,1-((px-cx)/rx)**2));
 const b=bx*w,d=34,inset=(ty>y+h/2?-4:4);
 const p1=[b-d,yOn(b-d)+inset],p2=[b+d,yOn(b+d)+inset],tp=[tx-x,ty-y];
 return abs(x,y,`<svg width="${w}" height="${h}" style="position:absolute;left:0;top:0;overflow:visible">
 <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="#111" stroke-width="4.5"/>
 <path d="M${p1} L${tp} L${p2}" fill="none" stroke="#111" stroke-width="4.5" stroke-linejoin="round"/>
 <path d="M${p1} L${tp} L${p2} Z" fill="#fff"/>
 <path d="M${p1} L${tp} L${p2}" fill="none" stroke="#111" stroke-width="4.5" stroke-linejoin="round"/>
 <path d="M${p1[0]+2},${p1[1]} L${p2[0]-2},${p2[1]}" stroke="#fff" stroke-width="9"/></svg>
 <div class="bt" style="width:${w}px;height:${h}px;font-size:${fs}px"><span>${html}</span></div>`,`width:${w}px;height:${h}px`)};
const em=t=>`<em>${t}</em>`;
const wrap=(title,tag,inner,tagMode)=>`<div class="s"><h1>${title}</h1>${tagMode==='corner'?`<div class="tag" style="right:34px;top:26px;left:auto;transform:none">${tag}</div>`:`<div class="tag">${tag}</div>`}${inner}<div class="brand">커리어캐쳐(CareerCatcher)</div></div>`;
const cards={};
// 1: 수료 직후 이력서 (캐치 난감 / 코치 think)
cards.img1=wrap('수료 직후 나랑 이력서 대화 수준:','가상 대화',
 K(838,330,420,'think').replace('left:838px','left:830px')+C(40,340,410,'trouble','down')+
 bubble(40,160,420,140,'교육 열심히<br>들었어요!',215,418,.5)+
 bubble(590,150,520,160,'그래서 이력서엔<br>뭐라고 쓸까요?',950,360,.7)+
 bubble(405,440,330,120,'...수료했습니다?',350,540,.12,34));
// 2: 경험노트 (코치 ok / 캐치 think)
cards.img2=wrap('나랑 경험노트 대화 수준:','가상 대화',
 K(90,330,420,'ok')+C(740,340,410,'think','down')+
 bubble(40,160,560,170,'수업이나 실습에서<br>해본 것도 경험이에요.',270,362,.4,35)+
 bubble(640,150,500,160,'쓸 경험이 없는 것<br>같은데요?',930,418,.55));
// 3: 좌우 비교 (좌 sorry / 우 best)
const panel=(x,col)=>abs(x,160,'',`width:540px;height:505px;border:5px solid ${col};border-radius:26px;background:#FFF`);
cards.img3=wrap('수업명 말고 해결한 일로 말하기:','가상 예시',
 panel(50,'#BBB')+panel(610,RED)+
 bubble(80,185,480,170,'관리 도구 수업을<br>들었습니다',320,420,.5,36)+C(210,385,280,'sorry','down')+
 bubble(640,185,480,170,`${em('[문제]')}를 ${em('[방법]')}으로<br>해결했습니다`,880,388,.5,35)+K(790,375,285,'best')+
 abs(0,690,'괄호는 내 기록으로 채우기','width:1200px;text-align:center;font-size:32px;font-weight:900;color:#111'));
// 4: 지하철 (헤드폰 캐치 + 손잡이)
const strap=(x,col,len)=>`<g><path d="M${x} 188 L${x} ${188+len}" stroke="#555" stroke-width="6"/><path d="M${x-36} ${188+len+84} L${x} ${188+len} L${x+36} ${188+len+84} Z" fill="none" stroke="${col}" stroke-width="13" stroke-linejoin="round"/><path d="M${x-36} ${188+len+84} L${x+36} ${188+len+84}" stroke="${col}" stroke-width="13" stroke-linecap="round"/></g>`;
const scene=`<svg width="1200" height="800" style="position:absolute;left:0;top:0"><defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF3F8"/><stop offset="1" stop-color="#DCE5EE"/></linearGradient></defs>
<rect y="150" width="1200" height="650" fill="url(#w)"/><rect y="735" width="1200" height="65" fill="#C9D2DC"/>
<rect y="176" width="1200" height="14" fill="#AEB6C0"/><rect y="190" width="1200" height="5" fill="#8E96A0"/>
${strap(100,'#F27BA8',60)}${strap(900,'#E5453A',60)}${strap(1090,'#F27BA8',60)}${strap(300,'#E5453A',60)}
${strap(560+60,'#F27BA8',140)}</svg>`;
cards.img4=wrap('면접 전날 이동 중 나:','가상 장면',
 scene+C(250,285,460,'fight','strap',true)+
 abs(780,440,`머릿속으로는<br><span style="color:${RED}">답변 완벽함</span>`,'font-size:50px;font-weight:900;line-height:1.25;color:#111')+
 abs(780,640,'입 밖으로 꺼내면 다른 이야기','font-size:27px;font-weight:700;color:#555'),'corner');
// 5: 컨설팅 준비물 (캐치 hello / 코치 ok)
cards.img5=wrap('나랑 컨설팅 준비물 대화 수준:','가상 대화',
 C(50,320,420,'hello','wave')+K(850,330,420,'ok')+
 bubble(30,150,430,150,'서류가 완성돼야<br>하죠?',230,395,.5)+
 bubble(580,150,560,170,'초안이나 메모만<br>있어도 괜찮아요.',950,350,.7,36)+
 bubble(450,430,300,120,'그건 있어요!',330,520,.1,36));
const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:'Noto Sans KR','Noto Sans CJK KR','WenQuanYi Zen Hei',sans-serif;background:#555}
.s{width:1200px;height:800px;position:relative;overflow:hidden;background:#fff;margin-bottom:20px}
h1{position:absolute;left:0;right:0;top:34px;text-align:center;font-size:60px;font-weight:900;color:#000;letter-spacing:-1.5px;white-space:nowrap}
.tag{position:absolute;left:50%;transform:translateX(-50%);top:108px;font-size:23px;font-weight:700;color:${RED};border:2.5px solid ${RED};border-radius:20px;padding:1px 16px;background:#fff;z-index:5}
.brand{position:absolute;right:30px;bottom:16px;font-size:22px;font-weight:700;color:#777;z-index:5}
.bt{position:absolute;left:0;top:0;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;line-height:1.3;color:#111;padding:0 8%}
.bt em{font-style:normal;color:${RED}}`;
const link=['500','700','800','900'].map(w=>`<link rel="stylesheet" href="file://${F}noto-sans-kr/${w}.css">`).join('');
fs.writeFileSync(TMP,`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${Object.values(cards).join('')}</body></html>`);
(async()=>{const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1300,height:900}});
await pg.goto('file://'+TMP);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(1500);
const els=await pg.$$('.s');const names=Object.keys(cards);
for(let i=0;i<els.length;i++)await els[i].screenshot({path:OUT+names[i]+'.png'});
await br.close();
execSync('zip -q -FS images_all.zip img1.png img2.png img3.png img4.png img5.png',{cwd:OUT});})();
