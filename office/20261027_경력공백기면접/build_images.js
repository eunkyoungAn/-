// 블로그 이미지 6장(1200x800) + 인스타 1장(1080x1350) HTML 생성. 렌더는 render.js
const fs=require('fs');
const F='/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad/fnt';
const S='/home/user/-/templates/character_coach/';
const J=__dirname+'/';
const rows=(r,w)=>r.map(x=>`<div><span${w?` style="width:${w}px"`:''}>${x[0]}</span><i>➡</i><b>${x[1]}</b></div>`).join('');
const sig=(c='#666')=>`<div class="sig" style="color:${c}"><b>@career_catcher_ek</b> · 커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭 · 📌저장 💬댓글<br><span>문의 카톡 https://open.kakao.com/o/gxIxJ3Si · dms5147@gmail.com</span></div>`;
const blog=[
// 1 대표
`<div class="b sky"><div class="kick">커리어캐쳐 · 경력 단절 면접</div>
<h1 class="mj" style="font-size:74px">공백기 질문,<br>이렇게 정리해요</h1>
<div class="scene"><div class="bub1">면접관<br><b>“공백기가 있으시네요.”</b></div><div class="bub2">나<br><b>“사유부터 짧고 사실대로.”</b></div></div>
<img class="cut" src="${S}hello.png" style="right:30px;bottom:0;height:520px"></div>`,
// 2 통계
`<div class="b white"><div class="kick">두 조사 숫자 · 서로 비교하지 않습니다</div>
<h1 class="mj" style="font-size:48px">공백기를 겪는 분은 생각보다 많습니다</h1>
<div class="stats">
<div class="sc"><small>성평등가족부 「2025년 여성의 경제활동 및 경력단절 실태조사」<br>2026년 7월 발표 · 만 19~54세 여성 · 언론 보도 기준</small>
<p><b>56.7%</b><span>한 번이라도 경력이 끊긴 적 있음</span></p><p><b>7.5년</b><span>결혼·임신·출산 등 단절 후 재취업까지 평균</span></p></div>
<div class="sc"><small>통계청 「2024년 상반기 지역별고용조사」<br>기혼여성 대상 · 2024년 11월 언론 보도 기준</small>
<p><b>15.9%</b><span>기혼여성 중 경력단절 비중</span></p><p><b>41.1%</b><span>사유 1위는 육아</span></p></div></div>
<img class="cut" src="${S}think.png" style="right:40px;bottom:0;height:260px">
<div class="foot">※ 조사 대상과 기준이 달라 두 수치는 서로 비교하지 않습니다</div></div>`,
// 3 4단계
`<div class="b sky"><div class="kick">공백기 설명 4단계 · 정리 방법의 한 예</div>
<h1 class="mj" style="font-size:52px">이 순서로 짧게 정리해 보세요</h1>
<div class="st4">${[['1','사유','한두 문장, 사실만'],['2','배운 점·유지한 역량','지원 직무와 연결'],['3','복귀 준비','돌봄 정리·교육·자격'],['4','지금 가능한 것','근무 시간·시작 시점']].map((x,i)=>`<p class="${i==0?'':''}"><em>${x[0]}</em><strong>${x[1]}</strong><small>${x[2]}</small></p>`).join('<s>→</s>')}</div>
<img class="cut" src="${S}ok.png" style="right:30px;bottom:0;height:300px">
<div class="note3">사과하는 말투는 피하고, 없는 경력·직책은 만들지 않는 것이 좋다고 합니다<br><span>※ 해외 커리어 사이트에서 일반적으로 권하는 방식이며 공식 틀은 아닙니다</span></div></div>`,
// 4 가상 예시
`<div class="b white"><div class="kick">가상 상황 예시 · 실제 사례 아님</div>
<h1 class="mj" style="font-size:46px">내 말로 바꿔 쓰세요</h1>
<div class="qa"><div class="q"><em>예시 A</em> 육아로 약 3년 쉰 뒤 사무·행정 지원<p>“육아로 3년간 쉬었습니다. 그동안 문서 작성 자격 과정을 마쳤습니다. 지금은 돌봄 환경이 정리되어 평일 근무가 가능합니다. 다음 달부터 출근할 수 있습니다.”</p></div>
<div class="q"><em>예시 B</em> 가족 돌봄으로 쉰 뒤 데이터·사무 지원<p>“가족 돌봄으로 쉬었고, 지금은 정리되어 근무에 지장이 없습니다. 쉬는 동안 엑셀 활용 교육을 들었고, 데이터 정리 업무에 바로 쓸 수 있습니다.”</p></div></div>
<img class="cut" src="${S}fight.png" style="right:20px;bottom:0;height:290px">
<div class="foot" style="width:760px">사유를 어디까지 말할지는 본인이 정합니다. 필요한 만큼만 말해도 됩니다.</div></div>`,
// 5 불편한 질문
`<div class="b sky"><div class="kick">불편한 질문을 받았을 때</div>
<h1 class="mj" style="font-size:52px">선택지는 이렇게 3가지</h1>
<div class="jobs" style="width:760px">${rows([['① 짧게 답하기','답하고 업무 이야기로 돌리기'],['② 범위 정하기','개인 계획은 어디까지 말할지 내가 정하기'],['③ 문의하기','계속 불편하면 고용노동청·지청에 문의']],190)}</div>
<img class="cut" src="${S}think.png" style="right:20px;bottom:0;height:430px">
<div class="foot" style="width:780px;font-size:20px">서류에 혼인 여부 등을 요구하는 것은 채용절차법 제4조의3이 제한하는 사항으로 알려져 있습니다. 면접의 구두 질문은 상황에 따라 해석이 다를 수 있습니다. (법령 검색 요약 기준, 원문 확인 필요)</div></div>`,
// 6 체크리스트+문의
`<div class="b white"><div class="kick">면접 전에 준비할 것</div>
<h1 class="mj" style="font-size:50px">공백기 활동 ➡ 직무 역량 연결</h1>
<ul class="ck" style="width:720px">${['공백기에 한 일 적기 (교육·자격·봉사·돌봄 중 익힌 것)','지원 직무가 요구하는 역량 확인','둘을 연결해 한두 문장으로 정리'].map(t=>`<li><i>✓</i>${t}</li>`).join('')}</ul>
<div class="ct"><b>답변 정리가 필요하면 커리어캐쳐에 문의해 주세요</b><br>카톡 https://open.kakao.com/o/gxIxJ3Si<br>메일 dms5147@gmail.com</div>
<img class="cut" src="${S}thanks.png" style="right:30px;bottom:0;height:430px"></div>`
];
const post=`<div class="c sky"><div class="kick">커리어캐쳐 · 경력 단절 면접</div>
<h1 class="mj">공백기 질문에<br>“죄송합니다”부터<br>나온다면</h1>
<img class="cut" src="${S}cry.png" style="right:40px;top:90px;height:380px">
<div class="jobs">${rows([['① 사유','한두 문장, 사실만'],['② 배운 점·역량','지원 직무와 연결'],['③ 복귀 준비','돌봄 정리·교육·자격'],['④ 지금 가능한 것','근무 시간·시작 시점']],330)}</div>
<div class="box red"><div class="li">사과하는 말투는 <em>줄이고</em>, 없는 경력은 <em>만들지 않기</em><br>성평등가족부 2025 실태조사: 경력 단절 경험 <em>56.7%</em><br><span style="font-size:21px;color:#666;font-weight:500">만 19~54세 여성 대상 · 2026년 7월 발표 · 언론 보도 기준</span></div></div>
<div class="ex"><span>가상 상황 예시</span> “육아로 3년간 쉬었고, 그동안 문서 작성 자격 과정을 마쳤습니다. 지금은 평일 근무가 가능합니다.”</div>
${sig()}</div>`;
const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:Pretendard;background:#555;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px;padding:70px 64px}
.b{width:1200px;height:800px;position:relative;overflow:hidden;margin-bottom:20px;padding:50px 64px}
.cut{position:absolute}.mj{font-family:'Nanum Myeongjo';font-weight:800}em{font-style:normal;color:#F0453A}
.kick{display:inline-block;background:#111;color:#fff;font-size:24px;font-weight:700;padding:8px 18px}
.white{background:#F6F6F6}.sky{background:radial-gradient(ellipse at 70% 20%,#9CC8FF,#E9F3FF 50%,#fff 80%)}
h1{font-size:84px;line-height:1.18;margin-top:26px;letter-spacing:-2px;position:relative;z-index:2}.c h1{font-size:76px;margin-top:50px}
.jobs{margin-top:44px;background:rgba(255,255,255,.88);border:3px solid #111;padding:14px 26px;position:relative;z-index:2}.c .jobs{margin-top:70px}
.jobs div{display:flex;align-items:center;min-height:74px;font-size:30px;font-weight:900}.jobs span{width:420px;flex:none}.jobs i{color:#F0453A;font-style:normal;font-size:38px;width:62px;flex:none}.jobs b{font-weight:700;font-size:26px}
.box{margin-top:26px;background:#fff;border:4px solid #F0453A;padding:20px 30px;position:relative;z-index:2}.li{font-size:30px;font-weight:700;line-height:1.7}
.ex{margin-top:26px;font-size:26px;line-height:1.55;color:#333;font-weight:600}.ex span{display:inline-block;background:#2D5FA8;color:#fff;font-size:22px;font-weight:800;padding:2px 12px;margin-right:10px;border-radius:6px}
.sig{position:absolute;left:0;right:0;bottom:34px;text-align:center;font-size:21px;line-height:1.7}.sig b{font-size:23px}.sig span{font-size:22px;color:#333;font-weight:700}
.foot{position:absolute;left:64px;bottom:34px;width:860px;font-size:22px;color:#666;line-height:1.5}
.scene{margin-top:34px;width:640px}.scene div{background:#fff;border:3px solid #111;padding:16px 24px;font-size:22px;color:#555;margin-bottom:18px;border-radius:18px}.scene b{font-size:30px;color:#111}.bub2{background:#FFF0EC!important;border-color:#F0453A!important;margin-left:60px}
.stats{display:flex;gap:26px;margin-top:26px;position:relative;z-index:2}.sc{flex:1;background:#fff;border:3px solid #111;padding:18px 22px}.sc small{display:block;font-size:17px;color:#666;line-height:1.5;margin-bottom:10px;min-height:52px}.sc p{margin-top:18px}.sc b{display:block;font-size:72px;color:#F0453A;font-weight:900;line-height:1.1}.sc span{font-size:24px;font-weight:700;color:#222}
.st4{display:flex;align-items:stretch;gap:8px;margin-top:70px}.st4 p{flex:1;background:#fff;border:3px solid #111;padding:34px 12px;text-align:center}.st4 em{display:block;font-size:34px;font-weight:900}.st4 strong{display:block;font-size:26px;font-weight:900;margin-top:4px;line-height:1.3}.st4 small{display:block;font-size:20px;color:#666;margin-top:10px}.st4 s{text-decoration:none;font-size:30px;color:#F0453A;align-self:center}
.note3{position:absolute;left:64px;bottom:34px;width:760px;font-size:24px;font-weight:700;line-height:1.5}.note3 span{font-size:19px;color:#666;font-weight:500}
.qa{margin-top:24px;width:800px}.q{background:#fff;border:3px solid #111;padding:14px 22px;margin-bottom:14px;font-size:22px;font-weight:800}.q em{display:inline-block;background:#F0453A;color:#fff;padding:0 10px;margin-right:8px;border-radius:6px}.q p{font-size:22px;font-weight:500;line-height:1.5;margin-top:6px;color:#333}
.ck{list-style:none;margin-top:32px}.ck li{font-size:28px;font-weight:900;background:#fff;border:3px solid #111;padding:14px 24px;margin-bottom:14px}.ck i{color:#F0453A;font-style:normal;margin-right:14px}
.ct{position:absolute;left:64px;bottom:34px;width:720px;background:#111;color:#fff;padding:18px 28px;font-size:23px;line-height:1.65}.ct b{color:#FF7B6E;font-size:26px}`;
const link=['nanum-myeongjo'].map(n=>`<link rel="stylesheet" href="${F}/fontsource-${n}/index.css">`).join('');
fs.writeFileSync(J+'all.html',`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${blog.join('')}${post}</body></html>`);
