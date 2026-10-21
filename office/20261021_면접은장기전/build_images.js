const fs=require('fs');const F='/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad/fnt',P='/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad/ai_exp/ph/',J=__dirname+'/';
const sig=(c='#666')=>`<div class="sig" style="color:${c}"><b>@career_catcher_ek</b> · 커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭 · 📌저장 💬댓글</div>`;
const rows=r=>r.map(x=>`<div><span>${x[0]}</span><i>➡</i><b>${x[1]}</b></div>`).join('');
const cards=[
// 인스타 1장
`<div class="c sky"><div class="kick">커리어캐쳐 · AI면접</div>
<h1 class="mj">서류는 붙는데<br>면접에서 떨어진다면</h1>
<img class="cut" src="${P}thumb_cut.png" style="right:10px;top:70px;height:300px;-webkit-mask-image:linear-gradient(#000 82%,transparent)">
<div class="jobs">${rows([['“열심히 했습니다”','“이 문제를, 이렇게 해결했습니다”'],['내 경험이 학교뿐이라면','맡은 일과 결과 중심으로'],['외우듯 줄줄','핵심만 내 말로'],['“AI 써 봤어요”','“AI로 이것을 완성했어요”']])}</div>
<div class="box red"><div class="li">서류는 <em>‘해 온 일을 글로 표현한 것’</em>을 봅니다<br>면접은 <em>‘해 온 일을 말로 설명하는 능력’</em>을 확인합니다<br>경험노트 → 스크립트 → 리허설</div></div>
<div class="dic"><b>면접스크립트</b> <span>명사</span> 내 일 경험을 질문 의도에 맞춰 말로 꺼낼 수 있게 미리 써 둔 답변 설계도</div>${sig()}</div>`,
// img0
`<div class="b sky"><div class="kick">커리어캐쳐 · 면접은 장기전</div><h1 class="mj" style="font-size:66px">서류는 해 온 일을 글로 표현한 것,<br>면접은 해 온 일을 말로 설명하는 능력</h1>
<img class="cut" src="${J}hello.png" style="right:10px;bottom:0;height:540px"><div class="stat"><b>서류 합격 대비 면접 탈락 100%</b><span>경력 약 2년 코칭 사례</span></div></div>`,
// img1
`<div class="b white"><div class="kick">코칭 사례 · 경력 약 2년</div><h1 class="mj" style="font-size:56px">내가 직접 꼽은 면접 탈락 원인</h1>
<img class="cut" src="${J}cry.png" style="right:10px;bottom:0;height:470px"><ul class="ck" style="width:720px">${['기업이 어떤 관점으로 질문하는지 몰랐다','내가 일한 내용을 어떻게 정리하는지 몰랐다','경험노트의 중요성을 몰랐다','면접 스크립트의 중요성을 몰랐다'].map(t=>`<li><i>✓</i>${t}</li>`).join('')}</ul><div class="foot">※ 코칭을 시작할 때의 상황입니다</div></div>`,
// img2
`<div class="b sky"><div class="kick">면접 질문의 숨은 의도</div><h1 class="mj" style="font-size:56px">질문마다 확인하려는 것이 있습니다</h1>
<img class="cut" src="${J}think.png" style="right:10px;bottom:0;height:560px"><div class="jobs" style="margin-top:34px;width:690px">${rows([['직무역량','이 일을 할 수 있는 사람인가'],['조직적합','우리 조직의 인재상과 맞는가'],['지원동기','왜 이 회사, 이 직무인가'],['성장 가능성','앞으로 어떻게 달라질 사람인가']])}</div>
<div class="foot" style="color:#333;font-size:26px">예) “가장 힘들었던 일은?” ➡ 문제를 어떻게 해결하는 사람인가</div></div>`,
// img3
`<div class="b white"><div class="kick">경험노트 예시 · 개인정보 없음</div><h1 class="mj" style="font-size:52px">일 경험은 이 순서로 정리합니다</h1>
<img class="cut" src="${J}ok.png" style="right:20px;bottom:0;height:400px"><div class="st5">${[['상황','어떤 문제가 있었나'],['역할','내가 맡은 일은'],['행동','내가 한 것과 이유'],['결과','숫자·변화로'],['배운 점','다음에 쓸 것']].map((x,i)=>`<p class="${i==2?'hi':''}"><em>${x[0]}</em><small>${x[1]}</small></p>`).join('<s>→</s>')}</div><div class="foot">STAR-L 템플릿 (예시 형식)</div></div>`,
// img4
`<div class="b dark"><div class="kick" style="background:#fff;color:#111">면접 리허설 앱 · 무료</div><h1 class="mj" style="font-size:50px;color:#fff;margin-top:20px">말로 답하면 바로 피드백</h1>
<img class="cut" src="${J}fight.png" style="right:10px;bottom:0;height:480px"><div class="phs" style="justify-content:flex-start;gap:18px;margin-top:6px">${['34177ad3','86cbb38f','4a9e527c'].map((n,i)=>`<div class="ph" style="transform:rotate(${[-5,0,5][i]}deg)"><div style="background-image:url(${J}${n}-image.jpg)"></div></div>`).join('')}</div></div>`
];
const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:Pretendard;background:#555;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px;padding:70px 64px}
.b{width:1200px;height:800px;position:relative;overflow:hidden;margin-bottom:20px;padding:50px 64px}
.cut{position:absolute}.mj{font-family:'Nanum Myeongjo';font-weight:800}em{font-style:normal;color:#F0453A}
.kick{display:inline-block;background:#111;color:#fff;font-size:24px;font-weight:700;padding:8px 18px}
.white{background:#F6F6F6}.sky{background:radial-gradient(ellipse at 70% 20%,#9CC8FF,#E9F3FF 50%,#fff 80%)}.dark{background:radial-gradient(circle at 50% 30%,#22324d,#0f1218 70%)}
h1{font-size:84px;line-height:1.18;margin-top:26px;letter-spacing:-2px;position:relative;z-index:2}.c h1{font-size:80px;margin-top:70px}
.jobs{margin-top:60px;background:rgba(255,255,255,.88);border:3px solid #111;padding:14px 26px;position:relative;z-index:2}.c .jobs{margin-top:90px}
.jobs div{display:flex;align-items:center;min-height:78px;font-size:30px;font-weight:900}.jobs span{width:420px}.b .jobs span{width:180px}.jobs i{color:#F0453A;font-style:normal;font-size:40px;width:70px}.jobs b{font-weight:700;font-size:26px}.b .jobs i{width:56px;font-size:34px}
.box{margin-top:26px;background:#fff;border:4px solid #F0453A;padding:20px 30px;position:relative;z-index:2}.li{font-size:30px;font-weight:700;line-height:1.7}
.dic{margin-top:26px;font-size:23px;color:#333;font-weight:600}.dic b{color:#2D5FA8;font-size:34px;font-weight:900}.dic span{border:2px solid #2D5FA8;color:#2D5FA8;border-radius:20px;font-size:20px;padding:2px 12px;margin:0 8px;vertical-align:middle}
.sig{position:absolute;left:0;right:0;bottom:34px;text-align:center;font-size:21px}.sig b{font-size:23px}
.stat{position:absolute;left:64px;bottom:60px;background:#111;color:#fff;padding:22px 30px}.stat b{display:block;font-size:42px;color:#FF7B6E}.stat span{font-size:24px;color:#ccc}
.ck{list-style:none;margin-top:36px}.ck li{font-size:30px;font-weight:900;background:#fff;border:3px solid #111;padding:16px 26px;margin-bottom:16px}.ck i{color:#F0453A;font-style:normal;margin-right:16px}
.foot{position:absolute;left:64px;bottom:34px;font-size:22px;color:#777}
.st5{display:flex;align-items:center;gap:8px;margin-top:70px}.st5 p{flex:1;background:#fff;border:3px solid #111;padding:22px 10px;text-align:center}.st5 p.hi{background:#FFF0EC;border-color:#F0453A}.st5 em{display:block;font-size:34px;font-weight:900}.st5 small{display:block;font-size:20px;color:#666;margin-top:8px}.st5 s{text-decoration:none;font-size:30px;color:#F0453A}
.phs{display:flex;gap:30px;justify-content:center;margin-top:20px}.ph{width:215px;height:420px;background:#000;border-radius:36px;padding:10px;border:3px solid #3a3f4a}.ph div{width:100%;height:100%;border-radius:28px;background-size:cover;background-position:center 20%}`;
const link=['nanum-myeongjo','black-han-sans-5.3.0','nanum-pen-script-5.3.0'].map(n=>`<link rel="stylesheet" href="${F}/fontsource-${n}/index.css">`).join('');
fs.writeFileSync(J+'all.html',`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${cards.join('')}</body></html>`);
