const fs=require('fs');const {catchy}=require('./coach.js');const F='/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad/fnt';
const P=__dirname+'/ph/';const pol=(f,x,y,w,h,r)=>`<div class="polar" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)"><div class="tape"></div><div class="ph2" style="width:${w}px;height:${h}px;background-image:url(${P}${f})"></div></div>`;
const tiles=(t,cols,size=120)=>`<div class="tiles">${[...t].map((ch,i)=>ch===' '?'<i style="width:30px"></i>':`<b style="background:${cols[i%cols.length]};font-size:${size}px;transform:rotate(${[-4,3,-2,5,-3,2][i%6]}deg) translateY(${[0,14,-6,10,-10,4][i%6]}px)">${ch}</b>`).join('')}</div>`;
const star=(c,s,x,y,r=0)=>`<svg class="dd" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)" width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M50 8 L61 38 L93 40 L67 59 L77 91 L50 72 L23 91 L33 59 L7 40 L39 38 Z" fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><path d="M8 20 l10 6 M90 18 l-10 7 M50 0 v-0 M4 70 l12 -3 M96 72 l-12 -4" stroke="${c}" stroke-width="5" stroke-linecap="round"/></svg>`;
const spark=(c,s,x,y)=>`<svg class="dd" style="left:${x}px;top:${y}px" width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M50 0 Q55 45 100 50 Q55 55 50 100 Q45 55 0 50 Q45 45 50 0Z" fill="${c}"/></svg>`;
const C=['#FFF6E5','#D7F25C','#FF6B5E','#4FA3E0','#FFF6E5','#D7F25C'];

const cards=[
`<div class="c cover">${spark('#FF5FA2',90,90,170)}${star('#F5D63D',200,760,140,12)}
<div class="hero" style="background-image:url(${P}profile.png)"></div><div class="lab">CAREER CATCHER MAGAZINE · Vol.2</div>
<div class="bub" style="left:60px;top:430px">너 혹시..<br>면접 답변<br><u>통째로 외워</u> 가?</div>
${tiles('합격하는답변',C,100)}
<div class="ttl">면접에서 <span class="hl">붙는</span> 사람들의<br>답변 습관 3가지</div>
<div class="foot">커리어캐쳐 · AI면접 코칭</div></div>`,
`<div class="c paper"><div class="hlbar">① <em>결론</em>부터 말한다</div>
<div class="note n1"><div class="tape"></div><small>감점 답변</small><p>“제가 대학교 2학년 때<br>동아리에 들어갔는데요..”</p><svg class="x" viewBox="0 0 400 200"><path d="M20 30 L380 170 M380 30 L20 170" stroke="#FF4D3D" stroke-width="10" stroke-linecap="round"/></svg></div>
<div class="hand h1">서론 길면 안 들어요 ㅠㅠ</div>
<div class="note n2"><div class="tape g"></div><small>통과 답변</small><p>“결론부터 말씀드리면,<br>저는 <mark>○○ 역량</mark>이 있습니다.”</p><svg class="o" viewBox="0 0 500 260"><ellipse cx="250" cy="130" rx="235" ry="115" fill="none" stroke="#FF4D3D" stroke-width="7"/></svg></div>
<div class="hand h2">첫 문장에 답! ✨</div>
${pol('palm.jpg',640,640,340,486,3)}${star('#F5D63D',110,880,1180,-10)}</div>`,
`<div class="c paper"><div class="hlbar">② <em>내 역할</em>과 <em>숫자</em>가 있다</div>
<div class="strip s1"><b>CHECK 1</b> 내 역할 <span>‘우리 팀’ 말고 ‘내가’ 한 일</span></div>
<div class="strip s2"><b>CHECK 2</b> 숫자 <span>기간·인원·성과를 숫자로</span></div>
<div class="strip s3"><b>CHECK 3</b> 배운 점 <span>입사 후 어떻게 쓸지까지</span></div>
<div class="hand h3">여기서 갈려요!!</div><svg class="dd" style="left:640px;top:530px" width="200" height="140" viewBox="0 0 200 140"><path d="M180 10 Q150 110 30 110 M30 110 l26 -22 M30 110 l30 16" fill="none" stroke="#FF4D3D" stroke-width="7" stroke-linecap="round"/></svg>
${pol('thumb.jpg',790,960,240,264,-4)}${spark('#FF5FA2',70,40,1240)}</div>`,
`<div class="c paper"><div class="hlbar">③ 모르면 <em>솔직하게</em> 말한다</div>
<div class="memo m1"><div class="mh">BEFORE</div><p class="strike">아.. 그게.. 아마 이런 거 같은데요..</p></div>
<div class="hand h4">→ 얼버무리면 더 불안해 보여요 🤔</div>
<div class="memo m2"><div class="mh g">AFTER</div><p>정확히는 모르지만, <mark>제가 아는 범위</mark>에서 말씀드리면 ○○입니다. <mark>입사 전까지 꼭 확인</mark>하겠습니다.</p></div>
${star('#F5D63D',130,880,1150,8)}<div class="tiny">* 이해를 돕기 위한 예시 문장입니다</div></div>`,
`<div class="c cover end">${spark('#D7F25C',80,120,140)}${star('#F5D63D',170,800,120,-8)}
<div class="lab">CAREER CATCHER MAGAZINE</div>
${tiles('저장각',['#D7F25C','#FF6B5E','#4FA3E0'],150)}
<div class="ttl2">면접 전날 꺼내보세요</div>
<div class="bub" style="left:60px;top:700px">내 답변도 궁금하면<br><u>댓글</u>로 남겨줘! 💬</div>
${pol('v.jpg',560,560,400,430,4)}
<div class="sig"><b>@career_catcher_ek</b><br>커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭<br>카톡 open.kakao.com/o/gxIxJ3Si · dms5147@gmail.com</div></div>`];

const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:Pretendard;background:#555;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px}
.cover{background:radial-gradient(circle at 30% 20%,#3a2a22,#16110e 70%);color:#fff}
.cover:after,.paper:after{content:"";position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");mix-blend-mode:overlay;pointer-events:none}
.paper{background:#F4EEE3}
.dd{position:absolute}.lab{position:absolute;left:70px;top:60px;font-size:26px;letter-spacing:4px;font-weight:700;border:2px solid #fff;border-radius:40px;padding:10px 26px}
.polar{position:absolute;background:#fff;padding:24px 24px 70px;box-shadow:0 20px 50px rgba(0,0,0,.45)}.ph{background:linear-gradient(#FFE9E4,#FFD3CB);width:520px;height:520px;display:flex;align-items:center;justify-content:center}
.tape{position:absolute;top:-22px;left:50%;margin-left:-80px;width:160px;height:44px;background:rgba(215,242,92,.85);transform:rotate(-3deg)}.tape.g{background:rgba(79,163,224,.7)}
.bub{position:absolute;background:#fff;color:#111;font-family:'Nanum Pen Script';font-size:58px;line-height:1.05;padding:28px 40px;border-radius:50%/45%;border:4px solid #111;text-align:center;z-index:3}
.bub u{text-decoration-color:#FF4D3D;text-decoration-thickness:5px}
.tiles{position:absolute;left:60px;top:900px;display:flex;gap:6px;z-index:2}.tiles b{font-family:'Black Han Sans';color:#111;padding:6px 16px;border:4px solid #111;line-height:1.1;display:inline-block}
.ttl{position:absolute;left:70px;top:1110px;font-size:50px;font-weight:900;line-height:1.35}.hl{background:#FF4D3D;padding:0 10px}
.foot{position:absolute;left:70px;bottom:40px;font-size:26px;color:#bbb}
.hlbar{position:absolute;left:70px;top:90px;font-size:72px;font-weight:900;background:linear-gradient(transparent 45%,#D7F25C 45%);padding:0 10px;letter-spacing:-2px}.hlbar em,em{font-style:normal;color:#FF4D3D}
.note{position:absolute;background:#fff;padding:50px 50px;box-shadow:0 14px 30px rgba(0,0,0,.15);width:640px}.note small{font-size:30px;font-weight:800;color:#999}.note p{font-size:48px;font-weight:800;line-height:1.35;margin-top:10px}
.n1{left:90px;top:270px;transform:rotate(-3deg)}.n2{left:60px;top:760px;width:560px;transform:rotate(2deg);background:#FFFDF2}.n2 small{color:#FF4D3D}
.x{position:absolute;inset:40px;width:560px;height:200px}.o{position:absolute;left:-20px;top:-10px;width:600px;height:330px}
mark{background:linear-gradient(transparent 55%,#D7F25C 55%)}
.hand{position:absolute;font-family:'Nanum Pen Script';font-size:64px;color:#FF4D3D;transform:rotate(-4deg)}.h1{left:600px;top:560px}.h2{left:80px;top:1150px}.h3{left:690px;top:470px}.h4{left:420px;top:600px}
.strip{position:absolute;left:70px;width:900px;background:#fff;padding:34px 44px;font-size:52px;font-weight:900;box-shadow:0 10px 24px rgba(0,0,0,.12);clip-path:polygon(0 4%,3% 0,97% 3%,100% 0,99% 96%,96% 100%,2% 97%,0 100%)}
.strip b{display:block;font-size:26px;color:#4FA3E0;letter-spacing:3px}.strip span{display:block;font-size:34px;color:#666;font-weight:600;margin-top:6px}
.s1{top:280px;transform:rotate(-1.5deg)}.s2{top:640px;transform:rotate(1deg);background:#FFFDF2;outline:6px solid #FF4D3D}.s2 b{color:#FF4D3D}.s3{top:1000px;transform:rotate(-1deg);width:700px}
.ch{position:absolute;z-index:2}.hero{position:absolute;left:0;right:0;top:0;height:1000px;background-size:cover;background-position:center 15%;-webkit-mask-image:linear-gradient(#000 70%,transparent)}.ph2{background-size:cover;background-position:center}.cover .lab{z-index:3}
.memo{position:absolute;left:80px;width:920px;background:#fff;border-radius:30px;box-shadow:0 14px 30px rgba(0,0,0,.14);overflow:hidden}.memo p{padding:36px 44px;font-size:44px;font-weight:700;line-height:1.5}
.mh{background:#ddd;font-size:28px;font-weight:900;letter-spacing:4px;padding:16px 44px}.mh.g{background:#D7F25C}
.m1{top:280px;transform:rotate(-1.5deg)}.m1 p{color:#888}.strike{text-decoration:line-through;text-decoration-color:#FF4D3D;text-decoration-thickness:6px}
.m2{top:720px;transform:rotate(1deg)}.tiny{position:absolute;left:80px;bottom:50px;font-size:26px;color:#999}
.end .tiles{top:230px}.ttl2{position:absolute;left:70px;top:470px;font-size:56px;font-weight:900}
.sig{position:absolute;left:70px;right:70px;bottom:70px;border-top:3px solid #D7F25C;padding-top:28px;font-size:30px;line-height:1.6;color:#ddd}.sig b{color:#D7F25C;font-size:40px}`;
const link=`<link rel="stylesheet" href="${F}/fontsource-nanum-pen-script-5.3.0/index.css"><link rel="stylesheet" href="${F}/fontsource-black-han-sans-5.3.0/index.css">`;
fs.writeFileSync(__dirname+'/pass.html',`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${cards.join('')}</body></html>`);
