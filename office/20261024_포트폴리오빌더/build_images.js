// 블로그 이미지 6장(1200x800) + 인스타 1장(1080x1350) 생성. 실행: node build_images.js
const fs=require('fs');
const SP='/tmp/claude-0/-home-user--/922154c2-f7c3-51b6-9809-e606cc8d84d3/scratchpad';
const F=process.env.FNT||SP+'/fnt';
const J=__dirname+'/';
const S='/home/user/-/templates/character_coach/';
const SHOT=J+'_assets/sample_shot.png';
const sig=(c='#666')=>`<div class="sig" style="color:${c}"><b>@career_catcher_ek</b> · 커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭 · 📌저장 💬댓글</div>`;
const rows=r=>r.map(x=>`<div><span>${x[0]}</span><i>➡</i><b>${x[1]}</b></div>`).join('');
const stk=(n,st)=>`<img class="cut" src="${S}${n}.png" style="${st}">`;
const sections=[['Contact','기본 정보'],['About me','한 줄 소개'],['Skills','도구·기술'],['AI 역량','AI Competency'],['Projects','프로젝트'],['Experiences','경험'],['Education','학력'],['Language·Other','어학·기타']];

const blog=[
// img1 사진1
`<div class="b sky"><div class="kick">커리어캐쳐 · 노션 AI 포트폴리오 빌더</div>
<h1 class="mj" style="font-size:54px">노션 양식 순서로 입력하면<br>AI가 포트폴리오로 정리해 줍니다</h1>
${stk('hello','right:10px;bottom:0;height:330px')}
<div class="flow">
 <div class="inp"><em>입력 (노션 양식 순서)</em>${sections.slice(0,5).map((s,i)=>`<p><u>${i+1}</u>${s[0]}</p>`).join('')}<p class="dots">⋯ Language·Other</p></div>
 <div class="arr"><b>AI 정리</b><i>➡</i></div>
 <div class="win"><div class="wbar"><s></s><s></s><s></s></div><div class="wb"><h4>디지털 마케터 | 김공순 포트폴리오</h4><div class="q">작은 예산으로 실험하고, 숫자로 성과를 키우는 마케터입니다.</div><h5>About me</h5><div class="ln"></div><div class="ln s"></div><h5>Projects</h5><div class="ln"></div><div class="ln s"></div><div class="btns"><span>노션용 복사</span><span class="r">HTML 저장</span></div></div></div>
</div>
<div class="foot">※ 예시 화면 · 가상 인물입니다</div></div>`,
// img2 사진2
`<div class="b white"><div class="kick">신입 포트폴리오 체크 3가지</div><h1 class="mj" style="font-size:54px">이 세 가지를 먼저 확인하세요</h1>
${stk('ok','right:10px;bottom:0;height:380px')}
<div class="trio">${[['1','왜 했나','한 일만 나열하지 말고 왜 했고 무엇을 알게 됐는지'],['2','내 역할','팀 안에서 내가 맡은 일과 기여가 분명한지'],['3','열리는 링크','비공개·깨진 링크 없이 구성이 정리돼 있는지']].map((c,i)=>`<div class="${i==0?'hi':''}"><em>${c[0]}</em><b>${c[1]}</b><p>${c[2]}</p></div>`).join('')}</div>
<div class="foot">※ 검색 요약으로 확인한 개인·업체 의견이며, 직무에 따라 다를 수 있습니다</div></div>`,
// img3 사진3
`<div class="b sky"><div class="kick">노션 포트폴리오 양식 · 예시 화면</div><h1 class="mj" style="font-size:52px">입력은 이 순서, 위에서부터</h1>
${stk('think','right:10px;bottom:0;height:430px')}
<div class="chips">${sections.map((s,i)=>`<div class="${i==4?'hi':''}"><em>${i+1}</em><b>${s[0]}</b><small>${s[1]}</small></div>`).join('')}</div>
<div class="tips"><p><em>성과 칸</em> “전 → 후” 숫자로</p><p><em>문제해결 칸</em> 문제 → 원인 → 시도 → 결과</p><p><em>역할 칸</em> 내가 맡은 일과 기여도</p></div>
<div class="foot">※ 지원 직무와 프로젝트 1개 이상은 꼭 적어야 합니다</div></div>`,
// img4 사진4
`<div class="b white"><div class="kick">AI 포트폴리오 완성 방법</div><h1 class="mj" style="font-size:52px">두 가지 중 편한 쪽으로</h1>
${stk('fight','right:10px;bottom:0;height:420px')}
<div class="vs"><div class="col"><h4><u>A</u>API 키 방식</h4><p>키(열쇠 같은 번호)를 붙여넣고 <b>버튼 한 번</b></p><p>Gemini 또는 Claude 키 사용</p><p class="n">무료 키는 사용 한도가 있을 수 있어요</p></div>
<div class="col hi"><h4><u>B</u>프롬프트 복사 방식</h4><p><b>키 없이</b> 프롬프트를 복사</p><p>ChatGPT·Claude 웹에 붙여넣고, 받은 답을 다시 빌더에 붙여넣기</p><p class="n">키 발급이 필요 없어요</p></div></div>
<div class="foot">완성 후: 노션형 미리보기 → [HTML 저장] 또는 [노션용 복사]</div></div>`,
// img5 사진5
`<div class="b dark"><div class="kick" style="background:#fff;color:#111">포트폴리오 완성 예시 · 예시 화면</div><h1 class="mj" style="font-size:40px;color:#fff;margin-top:14px">가상 인물 ‘디지털 마케터 | 김공순’</h1>
<div class="shotwin"><img src="${SHOT}"></div>
<div class="stamp">가상 인물 · 예시 화면<br><small>실제 인물이 아닙니다</small></div>
${stk('congrats','right:16px;bottom:0;height:380px;border-radius:24px 24px 0 0')}
<div class="rn">※ 이메일·연락처는 비워 둔 상태<br>(보완 필요 표시)입니다</div></div>`,
// img6 사진6
`<div class="b white"><div class="kick">사용 전 확인 4가지</div><h1 class="mj" style="font-size:54px">쓰기 전에 이것만 체크하세요</h1>
${stk('sorry','right:10px;bottom:0;height:400px')}
<ul class="ck">${[['경험·숫자','내가 직접 채워야 해요. 빌더는 정리를 돕는 도구'],['사실 확인','AI 결과가 사실과 맞는지 직접 확인'],['파일 형식','결과는 HTML 파일 하나. PDF만 받는 곳은 변환 필요'],['이미지 포트폴리오','이미지 업로드는 없어요. 디자인 직무는 따로 준비']].map(t=>`<li><i>✓</i><b>${t[0]}</b><span>${t[1]}</span></li>`).join('')}</ul></div>`
];

const single=`<div class="c sky"><div class="kick">커리어캐쳐 · 노션 AI 포트폴리오</div>
<h1 class="mj">신입 포트폴리오,<br>뭐부터 써야 할지<br>막막하다면</h1>
${stk('best','right:30px;top:40px;height:400px')}
<div class="jobs">${rows([['한 일 나열','“왜 했고, 뭘 알게 됐나”'],['결과 크기만','과정과 내 역할'],['깨진 링크·난잡한 구성','열리는 링크, 정리된 구성']])}</div>
<div class="src">※ 취업 커뮤니티·현직자 의견(검색 요약 기준)</div>
<div class="box red"><div class="bt">노션 양식 순서대로 입력하면 AI가 정리해 줘요</div><div class="ord">Contact → About me → Skills → AI 역량 → Projects → Experiences → Education → Language·Other</div></div>
<div class="dic"><b>성과</b> 전 → 후 숫자 · <b>문제해결</b> 문제→원인→시도→결과 · <b>역할</b> 내가 맡은 일</div>
<div class="cta"><div class="ct1">👉 AI 포트폴리오 빌더 (무료 예시로 채우기 가능)</div><div class="ct2">https://eunkyoungan.github.io/-/portfolio-builder/</div>
<div class="ct3">문의 · 카톡 https://open.kakao.com/o/gxIxJ3Si<br>메일 dms5147@gmail.com</div></div>
<div class="sig" style="color:#555"><b>@career_catcher_ek</b> · 커리어캐쳐 안은경 | AI 자기소개서·AI면접·진로 코칭 · 📌저장 💬댓글</div></div>`;

const css=`*{margin:0;box-sizing:border-box;word-break:keep-all}body{font-family:Pretendard;background:#555;padding:20px}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px;padding:64px 64px}
.b{width:1200px;height:800px;position:relative;overflow:hidden;margin-bottom:20px;padding:50px 64px}
.cut{position:absolute}.mj{font-family:'Nanum Myeongjo';font-weight:800}em{font-style:normal;color:#F0453A}
.kick{display:inline-block;background:#111;color:#fff;font-size:24px;font-weight:700;padding:8px 18px}
.white{background:#F6F6F6}.sky{background:radial-gradient(ellipse at 70% 20%,#9CC8FF,#E9F3FF 50%,#fff 80%)}.dark{background:radial-gradient(circle at 50% 30%,#22324d,#0f1218 70%)}
h1{font-size:84px;line-height:1.18;margin-top:26px;letter-spacing:-2px;position:relative;z-index:2}.c h1{font-size:82px;margin-top:40px}
.foot{position:absolute;left:64px;bottom:30px;font-size:22px;color:#666}
.sig{position:absolute;left:0;right:0;bottom:26px;text-align:center;font-size:21px}.sig b{font-size:23px}
/* img1 */
.flow{display:flex;align-items:center;gap:0;margin-top:34px;width:880px}
.inp{width:290px;background:#fff;border:3px solid #111;padding:14px 18px}.inp em{display:block;font-size:19px;font-weight:800;color:#F0453A;margin-bottom:6px}.inp p{font-size:25px;font-weight:900;height:46px;display:flex;align-items:center}.inp u{text-decoration:none;display:inline-block;width:30px;height:30px;border-radius:50%;background:#F0453A;color:#fff;font-size:18px;text-align:center;line-height:30px;margin-right:12px}.inp .dots{font-size:20px;color:#777;font-weight:700}
.arr{width:100px;text-align:center}.arr b{display:block;font-size:20px;font-weight:900;background:#111;color:#fff;padding:4px 0;border-radius:20px;margin:0 8px}.arr i{font-style:normal;color:#F0453A;font-size:48px;line-height:1.1}
.win{width:450px;border:3px solid #111;background:#fff;border-radius:10px;overflow:hidden}.wbar{background:#ddd;height:26px;padding:7px 10px}.wbar s{display:inline-block;width:11px;height:11px;border-radius:50%;background:#999;margin-right:6px}
.wb{background:#f0eafb;padding:14px 18px;height:300px}.wb h4{font-size:21px;font-weight:900}.wb .q{margin:8px 0;padding:8px 10px;background:#e4d9f7;border-left:4px solid #6b3fa0;font-size:15px;font-weight:600}.wb h5{font-size:17px;color:#6b3fa0;font-weight:900;margin-top:8px;border-bottom:2px solid #d9caf2}.wb .ln{height:9px;background:#d9d0e8;margin-top:8px;border-radius:5px}.wb .ln.s{width:70%}
.btns{margin-top:14px;text-align:right}.btns span{display:inline-block;font-size:15px;font-weight:800;padding:6px 12px;border:2px solid #6b3fa0;color:#6b3fa0;border-radius:8px;margin-left:8px;background:#fff}.btns .r{background:#6b3fa0;color:#fff}
/* img2 */
.trio{display:flex;gap:18px;margin-top:40px;width:850px}.trio div{flex:1;background:#fff;border:3px solid #111;padding:20px 18px;min-height:250px}.trio div.hi{border-color:#F0453A;background:#FFF5F3}
.trio em{display:block;font-size:44px;font-weight:900}.trio b{display:block;font-size:36px;font-weight:900;margin:6px 0 14px}.trio p{font-size:25px;line-height:1.5;color:#444;font-weight:600}
/* img3 */
.chips{display:grid;grid-template-columns:repeat(4,180px);gap:18px 22px;margin-top:30px}.chips div{background:#fff;border:3px solid #111;padding:10px 8px;text-align:center;min-height:110px;position:relative}.chips div.hi{border-color:#F0453A;background:#FFF0EC}
.chips em{position:absolute;left:-3px;top:-3px;background:#F0453A;color:#fff;width:30px;height:30px;font-size:17px;font-weight:900;line-height:30px}.chips b{display:block;font-size:21px;font-weight:900;margin-top:12px;letter-spacing:-1px}.chips small{display:block;font-size:17px;color:#666;margin-top:4px}
.tips{margin-top:26px;width:780px;background:#fff;border:4px solid #F0453A;padding:14px 24px}.tips p{font-size:26px;font-weight:700;line-height:1.65}.tips em{font-weight:900;margin-right:10px}
/* img4 */
.vs{display:flex;gap:20px;margin-top:34px;width:760px}.col{flex:1;background:#F6F6F6;border:3px solid #111;padding:18px 20px;min-height:320px;background:#fff}.col.hi{border-color:#F0453A;background:#FFF5F3}
.col h4{font-size:29px;font-weight:900;margin-bottom:14px}.col u{text-decoration:none;display:inline-block;width:42px;height:42px;line-height:42px;text-align:center;border-radius:50%;background:#F0453A;color:#fff;margin-right:10px;font-size:25px}.col p{font-size:24px;font-weight:600;line-height:1.5;margin-bottom:12px;color:#222}.col p.n{font-size:21px;color:#777;font-weight:700}
/* img5 */
.shotwin{position:absolute;left:64px;top:178px;width:800px;height:622px;border:4px solid #fff;border-bottom:0;border-radius:14px 14px 0 0;overflow:hidden;background:#fff}.shotwin img{width:800px;display:block}
.stamp{position:absolute;right:36px;top:200px;border:4px solid #FF7B6E;color:#FF7B6E;padding:10px 14px;font-size:25px;font-weight:900;text-align:center;transform:rotate(5deg);background:rgba(15,18,24,.7)}.stamp small{font-size:19px;font-weight:700;color:#fff}
.ck{list-style:none;margin-top:30px;width:800px}.ck li{background:#fff;border:3px solid #111;padding:12px 22px;margin-bottom:12px;display:flex;align-items:center;min-height:84px}.ck i{color:#F0453A;font-style:normal;font-size:34px;font-weight:900;margin-right:16px}.ck b{font-size:27px;font-weight:900;width:210px;flex:none}.ck span{font-size:23px;font-weight:600;color:#444;line-height:1.35}
.rn{position:absolute;right:24px;top:330px;width:290px;font-size:21px;color:#aab;line-height:1.5;text-align:center}
/* single */
.jobs{margin-top:44px;background:rgba(255,255,255,.88);border:3px solid #111;padding:12px 26px;position:relative;z-index:2}.jobs div{display:flex;align-items:center;min-height:84px;font-size:30px;font-weight:900}.jobs span{width:370px}.jobs i{color:#F0453A;font-style:normal;font-size:38px;width:62px}.jobs b{font-weight:700;font-size:28px;flex:1}
.src{margin-top:8px;font-size:21px;color:#555;text-align:right}
.box{margin-top:22px;background:#fff;border:4px solid #F0453A;padding:18px 28px;position:relative;z-index:2}.bt{font-size:32px;font-weight:900;margin-bottom:10px}.ord{font-size:26px;font-weight:700;line-height:1.55;color:#333}
.dic{margin-top:20px;font-size:25px;color:#333;font-weight:600;line-height:1.6}.dic b{color:#2D5FA8;font-weight:900}
.cta{position:absolute;left:64px;right:64px;bottom:76px;background:#111;color:#fff;padding:22px 30px}.ct1{font-size:28px;font-weight:900;color:#FF7B6E}.ct2{font-size:32px;font-weight:900;margin:6px 0 12px;letter-spacing:-.5px}.ct3{font-size:25px;line-height:1.55;color:#ddd;font-weight:600}`;
const link=['nanum-myeongjo','black-han-sans-5.3.0','nanum-pen-script-5.3.0'].map(n=>`<link rel="stylesheet" href="file://${F}/fontsource-${n}/index.css">`).join('');
const html=b=>`<html><head><meta charset="utf-8">${link}<style>${css}</style></head><body>${b}</body></html>`;
fs.writeFileSync(J+'all.html',html(blog.join('')+single));
(async()=>{
 const {chromium}=require('/opt/node22/lib/node_modules/playwright');
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const p=await br.newPage({viewport:{width:1300,height:1000}});
 await p.goto('file://'+J+'all.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 const els=await p.$$('.b,.c');
 for(let i=0;i<els.length;i++){const out=i<6?J+`blog_images/img${i+1}.png`:J+'post_single.png';await els[i].screenshot({path:out})}
 await br.close();
 fs.unlinkSync(J+'all.html');
})();
