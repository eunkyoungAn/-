const fs=require('fs');const {catchy}=require('./coach.js');const F='/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad/fnt';
const tiles=(t,cols,size=120)=>`<div class="tiles">${[...t].map((ch,i)=>ch===' '?'<i style="width:30px"></i>':`<b style="background:${cols[i%cols.length]};font-size:${size}px;transform:rotate(${[-4,3,-2,5,-3,2][i%6]}deg) translateY(${[0,14,-6,10,-10,4][i%6]}px)">${ch}</b>`).join('')}</div>`;
const star=(c,s,x,y,r=0)=>`<svg class="dd" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)" width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M50 8 L61 38 L93 40 L67 59 L77 91 L50 72 L23 91 L33 59 L7 40 L39 38 Z" fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><path d="M8 20 l10 6 M90 18 l-10 7 M50 0 v-0 M4 70 l12 -3 M96 72 l-12 -4" stroke="${c}" stroke-width="5" stroke-linecap="round"/></svg>`;
const spark=(c,s,x,y)=>`<svg class="dd" style="left:${x}px;top:${y}px" width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M50 0 Q55 45 100 50 Q55 55 50 100 Q45 55 0 50 Q45 45 50 0Z" fill="${c}"/></svg>`;
const C=['#FFF6E5','#D7F25C','#FF6B5E','#4FA3E0','#FFF6E5','#D7F25C'];
const cards=[
`<div class="c cover">${spark('#FF5FA2',90,90,170)}${star('#F5D63D',200,760,140,12)}${spark('#fff',50,820,420)}
<div class="lab">CAREER CATCHER MAGAZINE · Vol.1</div>
<div class="hero" style="background-image:url(./ph/profile.png)"></div>
<div class="bub" style="left:60px;top:430px">너 혹시..<br>자소서에 <u>“GPT 써봤다”</u><br>만 썼어?</div>
${tiles('AI써봤어요',C,104)}
<div class="ttl">이 한 줄이 <span class="hl">감점</span>인 이유<br>기업이 원하는 AI 경험은 따로 있다</div>
<div class="foot">커리어캐쳐 · AI 자기소개서 코칭</div></div>`,
`<div class="c paper"><div class="hlbar">① 도구 말고 <em>‘문제’</em>를 쓰세요</div>
<div class="note n1"><div class="tape"></div><small>감점 답변</small><p>“ChatGPT, 미드저니<br>써봤습니다.”</p><svg class="x" viewBox="0 0 400 200"><path d="M20 30 L380 170 M380 30 L20 170" stroke="#FF4D3D" stroke-width="10" stroke-linecap="round"/></svg></div>
<div class="hand h1">누구나 쓰는 말 ㅠㅠ</div>
<div class="note n2"><div class="tape g"></div><small>통과 답변</small><p>“이 <mark>문제</mark>를 풀려고<br>AI를 <mark>이렇게</mark> 썼습니다.”</p><svg class="o" viewBox="0 0 500 260"><ellipse cx="250" cy="130" rx="235" ry="115" fill="none" stroke="#FF4D3D" stroke-width="7"/></svg></div>
<div class="hand h2">오! 너만의 판단이 보여 ✨</div>
<div class="polar" style="left:640px;top:640px;transform:rotate(3deg)"><div class="tape"></div><div class="ph2" style="width:340px;height:486px;background-image:url(./ph/palm.jpg)"></div></div>${star('#F5D63D',110,880,1180,-10)}</div>`,
`<div class="c paper"><div class="hlbar">② AI 경험은 <em>3단계</em>로</div>
<div class="strip s1"><b>STEP 1</b> 문제 <span>어떤 불편·비효율이 있었나</span></div>
<div class="strip s2"><b>STEP 2</b> AI 활용 + 직접 검증 <span>어떻게 쓰고, 무엇을 내가 확인했나</span></div>
<div class="strip s3"><b>STEP 3</b> 결과 <span>시간·품질 변화를 숫자로</span></div>
<div class="hand h3">여기가 핵심!!</div><svg class="dd" style="left:640px;top:530px" width="200" height="140" viewBox="0 0 200 140"><path d="M180 10 Q150 110 30 110 M30 110 l26 -22 M30 110 l30 16" fill="none" stroke="#FF4D3D" stroke-width="7" stroke-linecap="round"/></svg>
<div class="polar" style="left:790px;top:960px;transform:rotate(-4deg)"><div class="tape"></div><div class="ph2" style="width:240px;height:264px;background-image:url(./ph/thumb.jpg)"></div></div>${spark('#FF5FA2',70,40,1240)}</div>`,
`<div class="c paper"><div class="hlbar">③ 같은 경험, 문장만 바꾸면</div>
<div class="memo m1"><div class="mh">BEFORE</div><p class="strike">ChatGPT를 활용해 과제를 효율적으로 수행했습니다.</p></div>
<div class="hand h4">→ 뭘, 어떻게, 얼마나? 🤔</div>
<div class="memo m2"><div class="mh g">AFTER</div><p>팀 과제 자료조사가 늦어지는 <mark>문제</mark>를 풀려고, AI로 요약하고 <mark>원문 출처는 직접 확인</mark>하는 방식을 만들었습니다. 그 결과 조사 기간을 <mark>5일 → 3일</mark>로 줄였습니다.</p></div>
${star('#F5D63D',130,880,1150,8)}<div class="tiny">* 이해를 돕기 위한 예시 문장입니다</div></div>`,
`<div class="c cover end">${spark('#D7F25C',80,120,140)}${star('#F5D63D',170,800,120,-8)}
<div class="lab">CAREER CATCHER MAGAZINE</div>
${tiles('저장각',['#D7F25C','#FF6B5E','#4FA3E0'],150)}
<div class="ttl2">자소서 쓸 때 꺼내보세요</div>
<div class="bub" style="left:60px;top:700px">내 직무도 궁금하면<br><u>댓글</u>로 남겨줘! 💬</div>
<div class="polar" style="left:560px;top:560px;transform:rotate(4deg)"><div class="tape"></div><div class="ph2" style="width:400px;height:430px;background-image:url(./ph/v.jpg)"></div></div>
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
fs.writeFileSync(__dirname+'/cards.html',`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${cards.join('')}</body></html>`);
