// 커리어캐쳐 캐릭터 "캐치" + 카드 5장
const fs=require('fs');
const catchy=(pose='mitt',s=1)=>`<svg viewBox="0 0 300 320" width="${300*s}" height="${320*s}">
<ellipse cx="150" cy="305" rx="90" ry="10" fill="rgba(0,0,0,.12)"/>
<!-- 몸 -->
<rect x="70" y="60" width="160" height="200" rx="80" fill="#F0564A"/>
<!-- 모자(뒤로 쓴 캐쳐 캡) -->
<path d="M82 112 Q150 30 218 112 Z" fill="#2B2B33"/><rect x="200" y="98" width="52" height="14" rx="7" fill="#2B2B33"/>
<circle cx="150" cy="58" r="7" fill="#2B2B33"/>
<!-- 얼굴 -->
<ellipse cx="150" cy="165" rx="62" ry="54" fill="#FFF3EE"/>
<circle cx="126" cy="160" r="9" fill="#2B2B33"/><circle cx="174" cy="160" r="9" fill="#2B2B33"/>
<circle cx="129" cy="157" r="3" fill="#fff"/><circle cx="177" cy="157" r="3" fill="#fff"/>
<ellipse cx="108" cy="184" rx="10" ry="6" fill="#FFB4A8"/><ellipse cx="192" cy="184" rx="10" ry="6" fill="#FFB4A8"/>
<path d="M136 186 Q150 200 164 186" stroke="#2B2B33" stroke-width="5" fill="none" stroke-linecap="round"/>
<!-- 다리 -->
<rect x="105" y="250" width="28" height="45" rx="14" fill="#C8433A"/><rect x="167" y="250" width="28" height="45" rx="14" fill="#C8433A"/>
${pose==='mitt'?`
<!-- 왼팔 + 미트(별을 잡음) -->
<path d="M78 200 Q40 190 34 150" stroke="#F0564A" stroke-width="24" fill="none" stroke-linecap="round"/>
<ellipse cx="34" cy="128" rx="34" ry="38" fill="#8A5A3B"/><ellipse cx="34" cy="130" rx="20" ry="24" fill="#A87150"/>
<path d="M34 96 l7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2z" fill="#FFD23F"/>
<path d="M222 200 Q250 220 258 248" stroke="#F0564A" stroke-width="24" fill="none" stroke-linecap="round"/>`
:pose==='point'?`
<path d="M78 205 Q55 230 52 252" stroke="#F0564A" stroke-width="24" fill="none" stroke-linecap="round"/>
<path d="M222 190 Q262 160 280 120" stroke="#F0564A" stroke-width="24" fill="none" stroke-linecap="round"/>
<circle cx="282" cy="114" r="14" fill="#FFF3EE"/>`
:`
<path d="M78 200 Q45 170 40 120" stroke="#F0564A" stroke-width="24" fill="none" stroke-linecap="round"/>
<path d="M222 200 Q255 170 260 120" stroke="#F0564A" stroke-width="24" fill="none" stroke-linecap="round"/>
<circle cx="40" cy="112" r="14" fill="#FFF3EE"/><circle cx="260" cy="112" r="14" fill="#FFF3EE"/>`}
</svg>`;
const bubble=(t)=>`<div class="bub">${t}</div>`;
const cards=[
// 1 표지
`<div class="c dark">
 <div class="lab">● 커리어캐쳐 · AI 자소서</div>
 <div class="hook">자소서에<br><span class="q">“ChatGPT 써봤어요”</span><br>만 쓰면 감점입니다</div>
 <div class="sub">기업이 진짜 원하는 AI 활용 경험</div>
 <div class="char r">${bubble('끝까지 보면<br>바로 고칠 수 있어요!')}${catchy('mitt',1.25)}</div>
 <div class="swipe">넘겨보기 →</div></div>`,
// 2
`<div class="c light">
 <div class="num">1</div>
 <h2>기업이 보는 건<br><em>도구</em>가 아니라 <em>문제 해결</em></h2>
 <div class="vs"><div class="bad"><b>✕ 감점 답변</b>“ChatGPT, 미드저니<br>써봤습니다.”<small>→ 누구나 쓸 수 있는 말</small></div>
 <div class="good"><b>○ 통과 답변</b>“이 문제를 풀려고<br>AI를 이렇게 썼습니다.”<small>→ 나만의 판단이 보임</small></div></div>
 <div class="char bl">${catchy('point',.85)}</div></div>`,
// 3
`<div class="c light">
 <div class="num">2</div>
 <h2>AI 경험은<br><em>3단계</em>로 쓰세요</h2>
 <ol class="steps">
 <li><b>문제</b><span>어떤 불편·비효율이 있었나</span></li>
 <li><b>AI 활용 + 내 판단</b><span>어떻게 쓰고, 무엇을 직접 검증했나</span></li>
 <li><b>결과</b><span>시간·품질이 어떻게 달라졌나 (숫자)</span></li></ol>
 <div class="tip">💡 핵심은 2단계의 <em>“직접 검증”</em>이에요</div>
 <div class="char br">${catchy('mitt',.8)}</div></div>`,
// 4
`<div class="c light">
 <div class="num">3</div>
 <h2>같은 경험,<br>문장만 바꿔도 달라져요</h2>
 <div class="ba"><div class="before"><b>BEFORE</b>ChatGPT를 활용해 과제를 효율적으로 수행했습니다.</div>
 <div class="arrow">↓</div>
 <div class="after"><b>AFTER</b>팀 과제의 자료조사가 늦어지는 <em>문제</em>를 풀려고, AI로 요약하고 <em>원문 출처는 직접 확인</em>하는 방식을 만들었습니다. 그 결과 조사 기간을 <em>5일 → 3일</em>로 줄였습니다.</div></div>
 <div class="note">* 이해를 돕기 위한 예시 문장입니다</div></div>`,
// 5 CTA
`<div class="c pink">
 <div class="lab2">● 커리어캐쳐</div>
 <h2 class="big">AI 시대 자소서,<br><em>혼자 고민하지 마세요</em></h2>
 <div class="act"><span>📌 저장</span><span>💬 내 직무 댓글</span><span>➕ 팔로우</span></div>
 <div class="char c5">${catchy('hi',1.1)}</div>
 <div class="sig"><b>@career_catcher_ek</b><br>커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭<br>카톡 open.kakao.com/o/gxIxJ3Si · dms5147@gmail.com</div></div>`
];
const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:Pretendard,sans-serif;background:#555;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px;padding:110px 90px}
.dark{background:#0e0e10;color:#fff}.light{background:#fff;color:#18181b}.pink{background:#FFF0EC;color:#18181b}
.lab,.lab2{font-size:30px;font-weight:700;color:#F0564A}
.hook{margin-top:90px;font-size:96px;font-weight:900;line-height:1.22;letter-spacing:-3px}.q{color:#F0564A}
.sub{margin-top:40px;font-size:40px;color:#bbb;font-weight:600}
.char{position:absolute}.char.r{right:70px;bottom:120px;text-align:center}.bl{left:60px;bottom:40px}.br{right:60px;bottom:40px}.c5{right:80px;bottom:300px}
.bub{background:#fff;color:#18181b;font-size:32px;font-weight:800;padding:22px 30px;border-radius:30px;margin-bottom:6px;line-height:1.35;position:relative}
.swipe{position:absolute;left:90px;bottom:110px;font-size:34px;color:#F0564A;font-weight:800}
.num{width:84px;height:84px;border-radius:50%;background:#F0564A;color:#fff;font-size:46px;font-weight:900;display:flex;align-items:center;justify-content:center}
h2{margin-top:40px;font-size:76px;font-weight:900;line-height:1.25;letter-spacing:-2px}em{font-style:normal;color:#F0564A}
.vs{margin-top:70px;display:flex;flex-direction:column;gap:30px}.vs div{border-radius:28px;padding:40px 46px;font-size:42px;font-weight:700;line-height:1.4}
.vs b{display:block;font-size:32px;margin-bottom:12px}.vs small{display:block;font-size:30px;color:#888;margin-top:12px;font-weight:600}
.bad{background:#F3F3F5}.bad b{color:#888}.good{background:#FFF0EC;border:4px solid #F0564A}.good b{color:#F0564A}
.vs{margin-left:280px}
.steps{list-style:none;margin-top:70px;counter-reset:s}.steps li{counter-increment:s;background:#F7F7F8;border-radius:28px;padding:34px 40px 34px 130px;margin-bottom:26px;position:relative}
.steps li:before{content:counter(s);position:absolute;left:40px;top:34px;width:60px;height:60px;border-radius:50%;background:#18181b;color:#fff;font-size:34px;font-weight:900;display:flex;align-items:center;justify-content:center}
.steps li:nth-child(2){background:#FFF0EC;border:4px solid #F0564A}.steps li:nth-child(2):before{background:#F0564A}
.steps b{display:block;font-size:46px;font-weight:900}.steps span{font-size:32px;color:#666;font-weight:600}
.tip{margin-top:30px;font-size:38px;font-weight:800;width:700px}
.ba{margin-top:60px}.ba>div{border-radius:28px;padding:40px 46px;font-size:40px;font-weight:600;line-height:1.5}.ba b{display:block;font-size:30px;font-weight:900;margin-bottom:10px}
.before{background:#F3F3F5;color:#777}.after{background:#FFF0EC;border:4px solid #F0564A}.after b{color:#F0564A}
.arrow{text-align:center;font-size:60px;color:#F0564A;padding:10px!important}
.note{position:absolute;bottom:70px;left:90px;font-size:26px;color:#999}
.big{margin-top:60px;font-size:84px}.act{margin-top:60px;display:flex;flex-direction:column;gap:22px;width:520px}
.act span{background:#fff;border-radius:60px;padding:26px 40px;font-size:40px;font-weight:800;box-shadow:0 6px 20px rgba(240,86,74,.15)}
.sig{position:absolute;left:90px;right:90px;bottom:90px;border-top:3px solid #F0564A;padding-top:30px;font-size:30px;line-height:1.6;color:#444}.sig b{color:#F0564A;font-size:38px}`;
fs.writeFileSync(__dirname+'/cards.html',`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${cards.join('')}</body></html>`);
fs.writeFileSync(__dirname+'/char.html',`<html><head><meta charset="utf-8"><style>body{margin:0;background:#FFF0EC;font-family:Pretendard}.s{display:flex;gap:40px;padding:60px;width:1200px;height:600px;align-items:center;justify-content:center}</style></head><body><div class="s" id="s">${catchy('mitt',1.2)}${catchy('point',1.2)}${catchy('hi',1.2)}</div></body></html>`);
