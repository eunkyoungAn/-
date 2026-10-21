const fs=require('fs');const F=process.env.FNT,D=__dirname+'/';
const tiles=(t,cols,size)=>`<div class="tiles">${[...t].map((ch,i)=>`<b style="background:${cols[i%cols.length]};font-size:${size}px;transform:rotate(${[-4,3,-2,5,-3][i%5]}deg) translateY(${[0,10,-5,8,-8][i%5]}px)">${ch}</b>`).join('')}</div>`;
const phone=(f,x,y,r,z)=>`<div class="ph" style="left:${x}px;top:${y}px;transform:rotate(${r}deg);z-index:${z}"><div class="scr" style="background-image:url(${D}${f})"></div></div>`;
const html=`<div class="c">
<div class="lab">CAREER CATCHER · 무료 면접 연습</div>
${tiles('면접리허설',['#FFF6E5','#D7F25C','#FF6B5E','#4FA3E0','#FFF6E5'],92)}
<h1>면접 질문, <em>말로 답하면</em><br>바로 피드백이 와요</h1>
${phone('s3.jpg',70,500,-6,1)}${phone('s1.jpg',380,470,0,3)}${phone('s2.jpg',690,500,6,2)}
<div class="bub">한 가지만 고쳐서<br><u>다시</u> 답해 보기!</div>
<div class="flow"><span>① 질문 듣기</span><i>→</i><span>② 말로 답하기</span><i>→</i><span>③ 피드백</span><i>→</i><span class="hi">④ 고쳐서 다시</span></div>
<div class="chips"><span>회원가입 없음</span><span>무료</span><span>답변은 내 휴대폰 안에서만</span><span>내 질문 추가</span></div>
<div class="foot"><img src="${D}qr.png"><div><b>🔗 프로필 링크에서 바로 시작</b><br>카톡 안 말고 Chrome·Safari로 열어 주세요<br><small>@career_catcher_ek · 커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭</small></div></div></div>`;
const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:Pretendard;background:#555;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 45%,#22324d,#0f1218 65%);color:#fff;padding:60px 64px}
.lab{display:inline-block;font-size:24px;letter-spacing:3px;font-weight:700;border:2px solid #fff;border-radius:40px;padding:8px 20px}
.tiles{display:flex;gap:6px;margin-top:34px}.tiles b{font-family:'Black Han Sans';color:#111;padding:4px 14px;border:4px solid #111;line-height:1.1}
h1{margin-top:28px;font-size:60px;font-weight:900;line-height:1.25;letter-spacing:-1.5px}em{font-style:normal;color:#8AB4F8}
.ph{position:absolute;width:320px;height:560px;background:#000;border-radius:44px;padding:12px;box-shadow:0 24px 50px rgba(0,0,0,.6);border:3px solid #3a3f4a}
.scr{width:100%;height:100%;border-radius:34px;background-size:cover;background-position:center 30%}
.bub{position:absolute;right:40px;top:400px;z-index:5;background:#fff;color:#111;font-family:'Nanum Pen Script';font-size:46px;line-height:1.05;padding:20px 30px;border-radius:50%/45%;border:4px solid #111;text-align:center;transform:rotate(4deg)}
u{text-decoration-color:#FF4D3D;text-decoration-thickness:4px}
.flow{position:absolute;left:50px;right:50px;top:1080px;display:flex;align-items:center;justify-content:center;gap:8px}
.flow span{background:#1e2533;border:2px solid #3a4560;border-radius:30px;padding:10px 16px;font-size:24px;font-weight:800}.flow span.hi{background:#D7F25C;color:#111;border-color:#D7F25C}.flow i{font-style:normal;color:#8AB4F8;font-weight:900}
.chips{position:absolute;left:0;right:0;top:1150px;text-align:center;font-size:22px;color:#c8cfdb}.chips span{margin:0 10px}.chips span:before{content:"✓ ";color:#D7F25C}
.foot{position:absolute;left:64px;right:64px;bottom:34px;display:flex;align-items:center;gap:22px;border-top:2px solid #2c3445;padding-top:18px}
.foot img{width:96px;height:96px;background:#fff;padding:6px;border-radius:10px}.foot div{font-size:22px;color:#c8cfdb;line-height:1.5}.foot b{font-size:30px;color:#fff}.foot small{font-size:19px;color:#8b93a3}`;
const link=['black-han-sans-5.3.0','nanum-pen-script-5.3.0'].map(n=>`<link rel="stylesheet" href="${F}/fontsource-${n}/index.css">`).join('');
fs.writeFileSync(D+'post.html',`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${html}</body></html>`);
