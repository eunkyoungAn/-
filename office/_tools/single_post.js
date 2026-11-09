// 주제당 1장 인스타 게시물(1080x1350)
const fs=require('fs');const F=process.env.FNT,P=__dirname+'/ph/';
const grain=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.25'/%3E%3C/svg%3E")`;
const tiles=(t,cols,size)=>`<div class="tiles">${[...t].map((ch,i)=>`<b style="background:${cols[i%cols.length]};font-size:${size}px;transform:rotate(${[-4,3,-2,5,-3,2][i%6]}deg) translateY(${[0,10,-5,8,-8,3][i%6]}px)">${ch}</b>`).join('')}</div>`;
const sig=(c='#666')=>`<div class="sig" style="color:${c}"><b>@career_catcher_ek</b> · 커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭 · 📌저장 💬댓글</div>`;
const cards=[
// 1 AI 활용 경험 (병맛형)
`<div class="c white">
<div class="kick">커리어캐쳐 · AI 자소서</div>
<h1 class="mj">자소서 문장을<br>바꾸세요.</h1>
<img class="cut" src="${P}palm_cut.png" style="right:20px;top:20px;height:380px">
<div class="rows">${['ChatGPT 써봤습니다 ㅠ','AI 툴 10개 다뤄요 ㅠ','프롬프트 잘 씁니다..'].map(r=>`<div><span>${r}</span><i>➡</i><b>그래서 뭘 해결했는데</b></div>`).join('')}</div>
<div class="box"><div class="bt">기업이 원하는 AI 경험 = 3단계</div>
<div class="st"><p><em>1</em>문제<small>뭐가 불편했나</small></p><s>→</s><p class="hi"><em>2</em>AI 활용 + 직접 검증<small>내가 확인한 것</small></p><s>→</s><p><em>3</em>결과<small>숫자로</small></p></div></div>
<div class="ba"><div class="b4">BEFORE <span>ChatGPT로 과제를 효율적으로 수행했습니다.</span></div>
<div class="a4">AFTER <span>자료조사가 늦어지는 <u>문제</u>를 풀려고 AI로 요약하고 <u>출처는 직접 확인</u>해, 조사 기간을 <u>5일→3일</u>로 줄였습니다.</span></div></div>
<div class="note">* 예시 문장입니다</div>${sig()}</div>`,
// 2 직무별 AI (병맛형)
`<div class="c sky">
<div class="kick">커리어캐쳐 · AI 직무</div>
<h1 class="mj">내 직무에 AI,<br>어디까지 써도 돼?</h1>
<img class="cut" src="${P}thumb_cut.png" style="right:10px;top:150px;height:330px">
<div class="jobs">${[['마케팅','카피 초안·트렌드 요약'],['영업','고객사 조사·제안서 초안'],['사무·인사','문서 정리·엑셀 수식'],['R&D·개발','논문 요약·코드 검토 보조']].map(r=>`<div><span>${r[0]}</span><i>➡</i><b>${r[1]}</b></div>`).join('')}</div>
<div class="box red"><div class="bt">근데 여기까지는 <em>내가</em> 해야 돼</div>
<div class="li">🔒 회사 기밀·개인정보는 입력 금지<br>✅ 숫자·출처는 직접 확인<br>🧠 결론과 책임은 내가</div></div>
<div class="dic"><b>AI리터러시</b> <span>명사</span> AI에게 맡길 일과 내가 할 일을 구분하는 능력</div>${sig()}</div>`,
// 3 면접 답변 습관 (트렌디형)
`<div class="c dark">
<div class="pol"><div class="tape"></div><div class="ph" style="background-image:url(${P}profile.png)"></div></div>
<div class="lab">CAREER CATCHER MAGAZINE · Vol.2</div>
<div class="bub">면접 답변<br><u>통째로 외워</u> 가?</div>
${tiles('합격하는답변',['#FFF6E5','#D7F25C','#FF6B5E','#4FA3E0'],78)}
<div class="sub2">면접에서 붙는 사람들의 답변 습관 3가지</div>
<div class="notes">
<div class="nt" style="transform:rotate(-1.5deg)"><em>①</em><b>결론부터 말한다</b><p><s>“제가 2학년 때 동아리에서..”</s> → “결론부터 말씀드리면, 저는 ○○ 역량이 있습니다.”</p></div>
<div class="nt y" style="transform:rotate(1deg)"><em>②</em><b>내 역할과 숫자가 있다</b><p>‘우리 팀’ 말고 ‘내가’ 한 일 + 기간·인원·성과를 숫자로</p></div>
<div class="nt" style="transform:rotate(-1deg)"><em>③</em><b>모르면 솔직하게</b><p>“정확히는 모르지만, 제가 아는 범위에서는 ○○입니다. 꼭 확인하겠습니다.”</p></div></div>
${sig('#bbb')}</div>`];
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
.jobs{margin-top:90px;background:rgba(255,255,255,.85);border:3px solid #111;padding:18px 30px;position:relative;z-index:2}.jobs div{display:flex;align-items:center;height:86px;font-size:34px;font-weight:900}.jobs span{width:240px}.jobs i{color:#F0453A;font-style:normal;font-size:44px;width:80px}.jobs b{font-weight:700}
.red{border-color:#F0453A;border-width:4px}.li{font-size:32px;font-weight:700;line-height:1.7}
.dic{margin-top:50px;font-size:28px;color:#333;font-weight:600}.dic b{color:#2D5FA8;font-size:40px;font-weight:900}.dic span{border:2px solid #2D5FA8;color:#2D5FA8;border-radius:20px;font-size:20px;padding:2px 12px;margin:0 8px;vertical-align:middle}
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
fs.writeFileSync(__dirname+'/single.html',`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${cards.join('')}</body></html>`);
