// 주제당 1장 인스타 게시물(1080x1350)
const fs=require('fs');const F=process.env.FNT,P=__dirname+'/ph/';
const grain=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.25'/%3E%3C/svg%3E")`;
const tiles=(t,cols,size)=>`<div class="tiles">${[...t].map((ch,i)=>`<b style="background:${cols[i%cols.length]};font-size:${size}px;transform:rotate(${[-4,3,-2,5,-3,2][i%6]}deg) translateY(${[0,10,-5,8,-8,3][i%6]}px)">${ch}</b>`).join('')}</div>`;
const sig=(c='#666')=>`<div class="sig" style="color:${c}"><b>@career_catcher_ek</b> · 커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭 · 📌저장 💬댓글</div>`;
const cards=[
`<div class="c sky">
<div class="kick">커리어캐쳐 · 무료 면접 연습</div>
<h1 class="mj">면접 질문,<br>말로 답해 봤어?</h1>
<img class="cut" src="${P}palm_cut.png" style="right:10px;top:110px;height:400px;-webkit-mask-image:linear-gradient(#000 80%,transparent)">
<div class="jobs">${[['① 질문 듣기','앱이 소리로 읽어줘요'],['② 말로 답하기','말하면 바로 글자로'],['③ 피드백','고칠 한 가지 + 바꿔 말하기'],['④ 다시 답하기','처음 답변과 비교']].map(r=>`<div><span>${r[0]}</span><i>➡</i><b>${r[1]}</b></div>`).join('')}</div>
<div class="box red"><div class="bt">이건 <em>걱정</em> 안 해도 돼</div>
<div class="li">🔒 답변은 서버로 안 보내요 (내 휴대폰 안에서만)<br>🙅 회원가입 없음 · 무료<br>➕ 받기 두려운 질문, 직접 추가해서 연습</div></div>
<div class="dic"><b>면접리허설</b> <span>명사</span> 실전 전에 말로 한 번 더 해 보는 연습</div>
<div class="go">🔗 프로필 링크에서 바로 시작 <small>· Chrome·Safari로 열기</small></div>${sig()}</div>`];

const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:Pretendard;background:#555;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px;padding:70px 64px}.cut{position:absolute}
.c:after{content:"";position:absolute;inset:0;background:${grain};mix-blend-mode:multiply;pointer-events:none;opacity:.6}
.mj{font-family:'Nanum Myeongjo';font-weight:800}em{font-style:normal;color:#F0453A}u{text-decoration-color:#F0453A;text-decoration-thickness:4px}
.kick{display:inline-block;background:#111;color:#fff;font-size:24px;font-weight:700;padding:8px 18px}
.white{background:#F6F6F6}.sky{background:radial-gradient(ellipse at 70% 20%,#9CC8FF,#E9F3FF 50%,#fff 80%)}
h1{font-size:84px;line-height:1.18;margin-top:26px;letter-spacing:-2px;position:relative;z-index:2}
.rows{margin-top:110px}.rows div{display:flex;align-items:center;height:86px;font-size:34px;font-weight:900}.rows span{width:420px}.rows i{color:#F0453A;font-style:normal;font-size:50px;width:90px}
.box{margin-top:44px;background:#fff;border:3px solid #111;padding:24px 30px;position:relative;z-index:2}.bt{font-size:34px;font-weight:900;margin-bottom:16px}
.st{display:flex;align-items:center;gap:10px}.st p{flex:1;background:#F3F3F5;border-radius:16px;padding:16px;font-size:28px;font-weight:900;text-align:center}.st p.hi{flex:1.5;background:#FFF0EC;outline:3px solid #F0453A}
.st em{display:block;font-size:22px}.st small{display:block;font-size:20px;color:#777;font-weight:600;margin-top:4px}.st s{text-decoration:none;font-size:30px;color:#F0453A;font-weight:900}
.ba{margin-top:36px;font-size:30px;line-height:1.5}.ba>div{padding:16px 22px;font-weight:900}.ba span{font-weight:600;margin-left:8px}
.b4{background:#E9E9EC;color:#888}.b4 span{text-decoration:line-through;text-decoration-color:#F0453A;text-decoration-thickness:3px}.a4{background:#EEF9C9;margin-top:8px}.a4{color:#111}
.note{position:absolute;right:64px;bottom:96px;font-size:20px;color:#999}
.sig{position:absolute;left:0;right:0;bottom:40px;text-align:center;font-size:22px}.sig b{font-size:24px}
.jobs{margin-top:60px;background:rgba(255,255,255,.85);border:3px solid #111;padding:18px 30px;position:relative;z-index:2}.jobs div{display:flex;align-items:center;height:76px;font-size:34px;font-weight:900}.jobs span{width:240px}.jobs i{color:#F0453A;font-style:normal;font-size:44px;width:80px}.jobs b{font-weight:700}
.red{border-color:#F0453A;border-width:4px}.li{font-size:32px;font-weight:700;line-height:1.7}
.go{margin-top:18px;display:inline-block;background:#111;color:#fff;font-size:30px;font-weight:800;padding:14px 26px}.go small{font-size:22px;color:#bbb;font-weight:600}.dic{margin-top:30px;font-size:28px;color:#333;font-weight:600}.dic b{color:#2D5FA8;font-size:40px;font-weight:900}.dic span{border:2px solid #2D5FA8;color:#2D5FA8;border-radius:20px;font-size:20px;padding:2px 12px;margin:0 8px;vertical-align:middle}
.dark{background:radial-gradient(circle at 30% 20%,#3a2a22,#16110e 70%);color:#fff}
.pol{position:absolute;right:60px;top:70px;background:#fff;padding:16px 16px 50px;transform:rotate(4deg);box-shadow:0 18px 40px rgba(0,0,0,.5)}.ph{width:330px;height:380px;background:center 12%/cover}
.tape{position:absolute;top:-18px;left:50%;margin-left:-70px;width:140px;height:38px;background:rgba(215,242,92,.85);transform:rotate(-3deg)}
.lab{font-size:22px;letter-spacing:3px;font-weight:700;border:2px solid #fff;border-radius:40px;padding:8px 20px;display:inline-block}
.bub{position:absolute;left:64px;top:170px;background:#fff;color:#111;font-family:'Nanum Pen Script';font-size:56px;line-height:1.05;padding:26px 40px;border-radius:50%/45%;border:4px solid #111;text-align:center}
.tiles{position:absolute;left:50px;top:420px;display:flex;gap:4px;z-index:2}.tiles b{font-family:'Black Han Sans';color:#111;padding:4px 12px;border:4px solid #111;line-height:1.1}
.sub2{position:absolute;left:64px;top:560px;font-size:36px;font-weight:900}
.notes{position:absolute;left:64px;right:64px;top:640px}.nt{background:#fff;color:#111;padding:26px 30px 20px 96px;margin-bottom:26px;position:relative;box-shadow:0 10px 24px rgba(0,0,0,.35)}.nt.y{background:#F6FFD6}
.nt em{position:absolute;left:24px;top:14px;font-size:52px;font-weight:900;color:#F0453A}.nt b{font-size:40px;font-weight:900}.nt p{font-size:30px;line-height:1.5;color:#444;margin-top:6px}.nt s{color:#999;text-decoration-color:#F0453A;text-decoration-thickness:3px}
.hand{position:absolute;right:70px;bottom:100px;font-family:'Nanum Pen Script';font-size:52px;color:#D7F25C;transform:rotate(-4deg)}`;
const link=['nanum-myeongjo','black-han-sans-5.3.0','nanum-pen-script-5.3.0'].map(n=>`<link rel="stylesheet" href="${F}/fontsource-${n}/index.css">`).join('');
fs.writeFileSync(__dirname+'/iv.html',`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${cards.join('')}</body></html>`);
