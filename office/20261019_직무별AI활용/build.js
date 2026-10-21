const fs=require('fs');const F=process.env.FNT,P=__dirname+'/ph/';
const grain=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`;
const sig=`<div class="sig">커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭 · @career_catcher_ek</div>`;
const rows=[['ChatGPT 써봤습니다 ㅠ'],['미드저니도 써봤어요..'],['AI 툴 10개 다뤄요 ㅠ'],['프롬프트 잘 씁니다..']];
const cards=[
`<div class="c wall"><div class="sign"><span>내 직무에 AI,</span><span>어디까지 써도 돼?</span></div>
<div class="sub">직무별 AI 활용 범위, 5초 정리</div><img class="cut" src="${P}profile_cut.png" style="right:40px;bottom:0;height:560px">
<div class="tag">커리어캐쳐 · AI 직무 1편</div></div>`,
`<div class="c white"><h1 class="mj">직무별로 이만큼은 써요.</h1>
<img class="cut" src="${P}profile_cut.png" style="left:110px;top:200px;height:470px;filter:grayscale(.6) brightness(.9)">
<img class="cut" src="${P}palm_cut.png" style="right:60px;top:200px;height:470px">
<div class="rows">${[['마케팅','카피 초안·트렌드 요약'],['영업','고객사 조사·제안서 초안'],['사무·인사','문서 정리·엑셀 수식'],['R&D·개발','논문 요약·코드 검토 보조']].map(r=>`<div><span style="width:300px">${r[0]}</span><i>➡</i><b>${r[1]}</b></div>`).join('')}</div>${sig}</div>`,
`<div class="c sky"><h2 class="mj"><span>2.</span> 근데 여기까지는<br>내가 해야 돼</h2>
<div class="sbox" style="left:150px;top:420px">최종 판단은 사람이</div>
<img class="cut" src="${P}thumb_cut.png" style="left:310px;top:380px;height:560px">
<div class="cap">🔒 회사 기밀·개인정보는 입력 금지<br>✅ 숫자·출처는 <u>직접 확인</u><br>🧠 결론과 책임은 내가</div>${sig}</div>`,
`<div class="c white"><div class="dict">AI리터러시</div><div class="pos">명사</div>
<div class="def">AI에게 맡길 일과 <u>내가 할 일</u>을 구분하는 능력.<br>기업이 말하는 ‘AI 활용 역량’의 진짜 뜻.</div>
<div class="oval">툴 많이 아는 거랑은<br>다른 얘기야..</div>
<img class="cut" src="${P}profile_cut.png" style="right:40px;bottom:0;height:640px">
<div class="ex"><b>자소서 한 줄</b> “초안은 AI로 만들고,<br>검증과 결정은 제가 했습니다.”</div>
<div class="note">* 이해를 돕기 위한 예시입니다</div></div>`,
`<div class="c photo"><div class="pbg"></div><div class="pg"></div>
<h1 class="mj big">일단 해보자고</h1><div class="mj d2">:내 직무 댓글로 남겨줘.<br>&nbsp;다음 편 주제로 참고할게.</div>
<div class="cta"><span>📌 저장</span><span>💬 내 직무 댓글</span><span>➕ 팔로우</span></div>
<div class="sig2"><b>@career_catcher_ek</b><br>커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭<br>카톡 open.kakao.com/o/gxIxJ3Si · dms5147@gmail.com</div></div>`];

const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:Pretendard;background:#555;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px}.cut{position:absolute}
.mj{font-family:'Nanum Myeongjo';font-weight:800}
.wall{background:#D9D4CC}.wall:after,.photo .pg{content:"";position:absolute;inset:0;background:${grain};mix-blend-mode:multiply;pointer-events:none}
.sign{position:absolute;left:90px;top:150px;width:900px;background:#F7F7F5;padding:60px 50px;box-shadow:0 6px 18px rgba(0,0,0,.12);display:flex;flex-direction:column}
.sign span{font-family:'Black Han Sans';font-size:118px;line-height:1.15;color:#2D5FA8;text-shadow:5px 5px 0 #B9C6DA;letter-spacing:-2px}
.sub{position:absolute;left:100px;top:620px;font-size:40px;font-weight:800;color:#333}
.tag{position:absolute;left:100px;bottom:80px;background:#111;color:#fff;font-size:30px;font-weight:700;padding:14px 26px}
.white{background:#F6F6F6}h1{text-align:center;font-size:84px;margin-top:70px}
.rows{position:absolute;left:40px;right:40px;top:720px}.rows div{display:flex;align-items:center;height:120px;font-size:42px;font-weight:900}
.rows span{width:430px}.rows i{color:#F0453A;font-style:normal;font-size:70px;width:110px}.rows b{font-size:44px}
.sig{position:absolute;left:0;right:0;bottom:36px;text-align:center;font-size:24px;color:#888}
.sky{background:radial-gradient(ellipse at 50% 60%,#8EC0FF,#E9F3FF 55%,#fff 80%)}
h2{position:absolute;left:90px;top:90px;font-size:96px;line-height:1.25}h2 span{margin-left:-10px}
.sbox{position:absolute;background:#fff;border:3px solid #222;font-size:38px;font-weight:700;padding:18px 34px;z-index:2}
.sbox:after{content:"";position:absolute;right:50px;bottom:-26px;border:13px solid transparent;border-top:14px solid #222}
.cap{position:absolute;left:60px;right:60px;top:950px;background:#fff;border:3px solid #222;padding:30px 40px;font-size:38px;font-weight:600;line-height:1.6;z-index:2}
u{text-decoration-color:#F0453A;text-decoration-thickness:5px}
.dict{position:absolute;left:80px;top:110px;font-size:120px;font-weight:900;color:#2D5FA8;letter-spacing:-3px}
.pos{position:absolute;left:84px;top:270px;border:3px solid #2D5FA8;color:#2D5FA8;border-radius:30px;font-size:30px;font-weight:700;padding:4px 18px}
.def{position:absolute;left:84px;top:350px;font-size:40px;font-weight:600;line-height:1.55;color:#333}
.oval{position:absolute;left:70px;top:620px;width:470px;height:300px;border:3px solid #333;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-size:38px;font-weight:600;line-height:1.4;z-index:2}
.ex{position:absolute;left:80px;top:1010px;background:#fff;border:3px solid #222;padding:24px 34px;font-size:34px;line-height:1.5;z-index:2}.ex b{color:#F0453A}
.note{position:absolute;left:84px;bottom:40px;font-size:24px;color:#999}
.photo{background:linear-gradient(#C9D3E8,#E8D9E2)}.photo .pbg{position:absolute;left:0;right:0;bottom:0;top:400px;-webkit-mask-image:linear-gradient(transparent,#000 18%);background:url(${P}v_full.jpg) 62% 25%/cover;filter:saturate(.8) contrast(.95) brightness(1.05)}
.photo .pg{mix-blend-mode:overlay;opacity:1}
.big{position:absolute;left:80px;top:60px;font-size:150px;color:#111;margin:0;text-align:left}.d2{position:absolute;left:80px;top:250px;font-size:58px;line-height:1.35;color:#111;text-shadow:0 0 12px rgba(255,255,255,.9)}
.cta{position:absolute;left:80px;bottom:260px;display:flex;gap:18px}.cta span{background:#fff;border:3px solid #111;font-size:34px;font-weight:800;padding:14px 26px}
.sig2{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.72);color:#eee;padding:30px 80px;font-size:28px;line-height:1.6}.sig2 b{color:#fff;font-size:36px}`;
const link=['nanum-myeongjo','black-han-sans-5.3.0'].map(n=>`<link rel="stylesheet" href="${F}/fontsource-${n}/index.css">`).join('');
fs.writeFileSync(__dirname+'/job.html',`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${cards.join('')}</body></html>`);
