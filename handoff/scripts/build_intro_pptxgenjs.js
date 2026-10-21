const pptxgen = require('pptxgenjs');
const pres = new pptxgen(); pres.layout='LAYOUT_WIDE'; pres.title='AI 실무 활용 교육 도입부'; pres.author='커리어캐쳐(CareerCatcher)';
const NAVY='101456',BLUE='213EDB',INK='15171C',GRAY='616773',LIGHT='EEF1FC',WHITE='FFFFFF',F='Malgun Gothic';
const SRC1='출처: Anthropic, Handa·Tamkin 외 「Which Economic Tasks are Performed with AI? Evidence from Millions of Claude Conversations」(arXiv:2503.04761, 2025.2)';
const SRC2='출처: Anthropic, Massenkoff·McCrory 「Labor market impacts of AI: A new measure and early evidence」(2026.3.5)';
function base(kicker,title,num,src,notes){
  const s=pres.addSlide(); s.background={color:WHITE};
  s.addText(kicker,{x:0.6,y:0.35,w:9,h:0.3,fontFace:F,fontSize:11,color:GRAY,margin:0,isTextBox:true});
  s.addText(title,{x:0.6,y:0.75,w:12.1,h:0.8,fontFace:F,fontSize:28,bold:true,color:INK,margin:0,fit:'shrink',isTextBox:true});
  s.addText(src,{x:0.6,y:6.75,w:11.2,h:0.45,fontFace:F,fontSize:10,color:GRAY,margin:0,valign:'top',isTextBox:true});
  s.addText(num,{x:12.0,y:6.95,w:0.8,h:0.25,fontFace:F,fontSize:11,bold:true,color:NAVY,align:'right',margin:0,isTextBox:true});
  if(notes) s.addNotes(notes); return s;
}
function cards(s,items,keymsg){
  const W=3.95,G=0.2,X0=0.6;
  items.forEach((it,i)=>{
    const x=X0+i*(W+G), hc=it.hi?BLUE:NAVY;
    s.addShape(pres.shapes.RECTANGLE,{x,y:1.9,w:W,h:0.55,fill:{color:hc},line:{color:hc}});
    s.addText(it.h,{x,y:1.9,w:W,h:0.55,fontFace:F,fontSize:15,bold:true,color:WHITE,valign:'middle',margin:[0,0.15,0,0.15],isTextBox:true});
    s.addShape(pres.shapes.RECTANGLE,{x,y:2.45,w:W,h:2.75,fill:{color:LIGHT},line:{color:LIGHT}});
    s.addText(it.b.map((t,k)=>({text:t,options:{breakLine:k<it.b.length-1,paraSpaceAfter:6}})),{x,y:2.45,w:W,h:2.75,fontFace:F,fontSize:14,color:INK,valign:'top',margin:[0.15,0.15,0.1,0.15],isTextBox:true});
  });
  s.addText(keymsg,{x:0.6,y:5.5,w:12.1,h:0.9,fontFace:F,fontSize:18,bold:true,color:BLUE,valign:'top',margin:0,isTextBox:true});
}
// 0 cover
let s=pres.addSlide(); s.background={color:NAVY};
s.addText('INTRO · 도입',{x:0.9,y:2.0,w:10,h:0.4,fontFace:F,fontSize:14,bold:true,color:'AAB4F0',margin:0,isTextBox:true});
s.addText('AI 시대, 지금 우리는 어디에 있나',{x:0.9,y:2.55,w:11.5,h:1.0,fontFace:F,fontSize:38,bold:true,color:WHITE,margin:0,isTextBox:true});
s.addText('데이터로 보는 AI와 일의 변화 → AI 역량은 어떻게 측정되는가 → 직접 풀어보기',{x:0.9,y:3.7,w:11.5,h:0.5,fontFace:F,fontSize:18,color:'D2D7F5',margin:0,isTextBox:true});
s.addText('자료: Anthropic Economic Index 연구(2025·2026) · AI 활용평가 유형 분석  |  커리어캐쳐(CareerCatcher)',{x:0.9,y:6.5,w:11.5,h:0.4,fontFace:F,fontSize:11,color:'AAB4F0',margin:0,isTextBox:true});
// 1
s=base('도입 ① · 지금 우리는 어떤 시대에 있나','AI는 이미 ‘일의 과제’ 단위로 들어와 있습니다','I-1',SRC1,'2025년 2월 Anthropic Economic Index 첫 보고서. 개인정보 보호 분석 시스템으로 대화를 집계. 단일 플랫폼(Claude.ai) 데이터라는 한계가 있음.');
cards(s,[{h:'약 400만 건의 대화 분석',b:['Claude.ai 대화를 미국 노동부 O*NET 직업·과제 분류에 연결','“AI가 실제로 어떤 일에 쓰이는가”를 처음 대규모로 측정']},{h:'소프트웨어·글쓰기 ≈ 절반',b:['전체 사용의 절반 가까이가 개발·글쓰기 과제','신체 작업 직군(건설·마취 등)은 사용이 거의 없음']},{h:'직업의 약 36%',hi:1,b:['과제의 25% 이상에 AI를 쓰는 직업 비율','과제의 75% 이상 사용 직업은 약 4%']}],'핵심  직업이 통째로 사라지기보다, 직업 안의 ‘과제’부터 AI와 나눠 하기 시작했습니다.');
// 2
s=base('도입 ② · AI를 쓰는 방식','‘대신 해주는 AI’와 ‘함께 하는 AI’','I-2',SRC1+'\n'+SRC2,'관찰 노출(observed exposure): 이론적 LLM 가능성(Eloundou 외 2023)과 실제 Claude 사용 데이터를 결합. 수치는 2026.3 보고서.');
cards(s,[{h:'증강 57% · 자동화 43%',b:['증강: 배우고, 다듬고, 함께 반복','자동화: 사람 개입 최소로 결과물 수행','(2025.2 보고서 기준)']},{h:'역량은 아직 다 쓰이지 않음',b:['Computer·Math 과제의 94%가 이론상 AI 가능','실제 관찰된 사용(커버리지)은 33%','→ 활용 격차가 큼']},{h:'가장 노출된 직업',hi:1,b:['프로그래머 75%','고객상담·데이터 입력 직군 상위','노출 0% 근로자도 약 30%']}],'핵심  AI가 ‘할 수 있는 일’과 실제 ‘하고 있는 일’ 사이의 간격을 채우는 사람이 경쟁력입니다.');
// 3
s=base('도입 ③ · 일자리에 미치는 영향','일자리 충격은 아직 작지만, 신입 채용부터 신호가 보입니다','I-3',SRC2,'미국 데이터(CPS, BLS) 기반. 보고서도 인과 해석에 신중함을 명시. 한국 상황에 그대로 적용하지 않도록 안내.');
cards(s,[{h:'실업률: 뚜렷한 증가 없음',b:['2022년 말 이후 고노출 직군의 실업률이 체계적으로 늘지는 않음']},{h:'22~25세 신규 취업 ↓',hi:1,b:['고노출 직군 입직률이 2022년 대비 약 14% 하락','“시사적 근거” 수준이며 확정은 아님']},{h:'성장 전망 둔화',b:['노출 10%p ↑ → 2034년까지 BLS 고용 성장 전망 0.6%p ↓','고노출 근로자: 고학력·고임금·여성 비율 높음']}],'핵심  ‘AI를 쓸 줄 아는가’가 첫 일자리의 문턱이 되고 있습니다. 그래서 AI 역량을 측정합니다.');
// 4
s=base('도입 ④ · AI 역량은 이렇게 측정됩니다','AI 활용평가: 아는가 → 고르는가 → 해내는가','I-4','출처: AI 활용평가(AI Assessment) 미리보기 화면 — 강사 제공 캡처 5종 재구성. 실제 시험 구성·배점은 시행 기관 공지 기준으로 확인 필요','형식: 지문(상황) → 4지선다 객관식 + 파일 첨부 실습. 실습형은 AI가 “특정할 수 없다”고 답해도 사람이 조건을 다시 적용해 검증해야 함.');
[['1. 개념 이해','텍스트 생성형(다음 단어 확률 예측)·이미지 생성형 AI의 기능 차이, 모달리티 구분'],['2. 프롬프트 설계','상황 지문을 읽고 페르소나·기준·출력 형식 등 다중 조건을 모두 갖춘 프롬프트 고르기'],['3. 결과 검증','AI 산출물의 오류(예: 결측치를 0으로 일괄 대체)를 찾아 바로잡기'],['4. 윤리·규제','개인정보·동의 규정을 지키면서 마감을 맞추는 방법(예: 합성 데이터) 판단'],['5. 실습형 과제','첨부 파일(PDF·이미지)을 AI 어시스턴트(질문 횟수 제한)와 함께 분석해 정답 도출']].forEach((r,i)=>{
  const y=1.75+i*0.82;
  s.addShape(pres.shapes.RECTANGLE,{x:0.6,y,w:2.8,h:0.72,fill:{color:NAVY},line:{color:NAVY}});
  s.addText(r[0],{x:0.6,y,w:2.8,h:0.72,fontFace:F,fontSize:15,bold:true,color:WHITE,valign:'middle',margin:[0,0.15,0,0.15],isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:3.4,y,w:9.3,h:0.72,fill:{color:LIGHT},line:{color:LIGHT}});
  s.addText(r[1],{x:3.4,y,w:9.3,h:0.72,fontFace:F,fontSize:14,color:INK,valign:'middle',margin:[0,0.2,0,0.2],isTextBox:true});
});
s.addText('추천 연습 사이트  프로그래머스(programmers.co.kr) — 코딩·AI 관련 문제를 직접 풀며 실전 감각을 기르기 좋습니다.',{x:0.6,y:5.95,w:12.1,h:0.55,fontFace:F,fontSize:14,bold:true,color:BLUE,valign:'middle',margin:[0,0.15,0,0.15],line:{color:BLUE,width:1},isTextBox:true});
// 5 exam1
function exam(s,kind,passage,q,opts){
  s.addText(kind,{x:0.6,y:1.55,w:3,h:0.4,fontFace:F,fontSize:16,bold:true,color:INK,margin:0,isTextBox:true});
  s.addText('다시 풀 문제 ⚑',{x:2.2,y:1.58,w:1.7,h:0.34,fontFace:F,fontSize:10,color:GRAY,align:'center',valign:'middle',margin:0,line:{color:GRAY,width:0.75},isTextBox:true});
  s.addText('다음 지문을 읽고 물음에 답하세요.',{x:0.6,y:2.0,w:12,h:0.35,fontFace:F,fontSize:14,color:INK,margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:0.6,y:2.45,w:0.07,h:1.05,fill:{color:NAVY},line:{color:NAVY}});
  s.addText(passage,{x:0.8,y:2.45,w:11.9,h:1.05,fontFace:F,fontSize:13,color:GRAY,valign:'middle',margin:0,isTextBox:true});
  s.addText(q,{x:0.6,y:3.65,w:12.1,h:0.7,fontFace:F,fontSize:14,bold:true,color:INK,valign:'top',margin:0,isTextBox:true});
  s.addText('답안을 선택하세요 ↴',{x:0.6,y:4.4,w:4,h:0.25,fontFace:F,fontSize:10,color:GRAY,margin:0,isTextBox:true});
  s.addText(opts.map((t,k)=>({text:t,options:{breakLine:k<opts.length-1,paraSpaceAfter:5}})),{x:0.6,y:4.7,w:12.1,h:1.95,fontFace:F,fontSize:13,color:INK,valign:'top',margin:0,isTextBox:true});
}
s=base('도입 ⑤ · 직접 풀어보기 1','[연습 1] 실제 시험처럼 풀어보기 — 프롬프트 설계','I-5','연습문제: 커리어캐쳐 자체 제작(AI 활용평가 객관식 유형·화면 구성 참고). 정답·해설은 슬라이드 노트','정답 ③. ① 잘못된 처리 기준 유지, ② 페르소나 불일치, ④ 표 출력 조건 누락. 보기 4개가 한 조건씩만 어긋나도록 출제됨.');
exam(s,'1. 객관식','고용센터 취업지원팀의 김 주임은 참여자 만족도 설문 결과를 정리하기 위해 대화형 AI 도구를 사용했습니다. 그런데 AI의 1차 산출물을 검토한 결과, 응답하지 않은 문항(무응답)을 인공지능이 임의로 ‘매우 불만족(1점)’으로 일괄 처리하여 프로그램 만족도가 실제보다 비정상적으로 낮게 계산되는 오류가 발생했습니다.','위 지문의 오류를 해결하기 위해 1) 설문 분석 전문가 페르소나 부여, 2) 올바른 무응답 처리 기준 제시, 3) 최종 결과의 표 형태 출력이라는 다중 제약 조건을 모두 만족하는 최적의 프롬프트는 무엇인가요?',['①  너는 설문 분석 전문가야. 통계 왜곡을 막기 위해 무응답을 모두 1점으로 유지하되, 문항별 평균 만족도를 한눈에 볼 수 있도록 표 형태로 정리해 줘.','②  너는 취업지원팀 팀장이야. 통계 왜곡을 막기 위해 무응답은 평균 계산에서 제외하고 문항별 응답 수를 함께 적어, 최종 결과를 표 형태로 다시 제시해 줘.','③  너는 설문 분석 전문가야. 통계 왜곡을 막기 위해 무응답은 평균 계산에서 제외하고 문항별 응답 수를 함께 적어, 최종 결과를 표 형태로 다시 제시해 줘.','④  너는 설문 분석 전문가야. 통계 왜곡을 막기 위해 무응답은 평균 계산에서 제외하고, 무응답이 발생하게 된 원인을 서술형 문장으로 자세히 설명해 줘.']);
// 6 exam2
s=base('도입 ⑥ · 직접 풀어보기 2','[연습 2] 실제 시험처럼 풀어보기 — 파일 실습형','I-6','연습문제: 커리어캐쳐 자체 제작(AI 활용평가 실습형 화면 구성 참고). 데이터는 가상이며 정답·해설은 슬라이드 노트','정답 ②. 최종: 민준→자소서반, 서연→면접반, 하은→면접반, 지우→면접반 → 면접반 3명, 자소서반 1명. 도윤은 기록 없음. AI는 신청 건수(4·3)를 셌고 명단 대조도 틀림.');
s.addText([{text:'주의사항',options:{bold:true,breakLine:true}},{text:'• 한 명당 하나의 반만 신청 가능합니다. 한 사람이 여러 번 신청한 경우, 가장 마지막 신청 이외에는 모두 취소됩니다. 예) 민준:면접반 → 민준:자소서반 순서로 신청 시 앞의 신청은 취소됨'}],{x:0.6,y:1.55,w:12.1,h:0.85,fontFace:F,fontSize:12,color:INK,valign:'top',margin:0,isTextBox:true});
s.addShape(pres.shapes.RECTANGLE,{x:0.6,y:2.5,w:2.7,h:1.2,fill:{color:LIGHT},line:{color:LIGHT}});
s.addText([{text:'파일 목록',options:{bold:true,breakLine:true}},{text:'특강신청.pdf   412',options:{breakLine:true}},{text:'참여자명단.png   236'}],{x:0.6,y:2.5,w:2.7,h:1.2,fontFace:F,fontSize:12,color:INK,valign:'top',margin:0.12,isTextBox:true});
s.addText([{text:'특강신청.pdf',options:{bold:true,breakLine:true}},...['09:02  민준 : 면접반','09:10  서연 : 자소서반','09:15  민준 : 자소서반','09:21  하은 : 면접반','09:33  지우 : 자소서반','09:40  서연 : 면접반','09:52  지우 : 면접반'].map(t=>({text:t,options:{breakLine:true}})),{text:'참여자명단.png : 민준·서연·하은·지우·도윤 (5명)',options:{color:GRAY,fontSize:11}}],{x:3.5,y:2.5,w:4.2,h:3.2,fontFace:F,fontSize:12,color:INK,valign:'top',margin:0.12,line:{color:GRAY,width:0.75},isTextBox:true});
s.addShape(pres.shapes.RECTANGLE,{x:7.9,y:2.5,w:4.8,h:3.2,fill:{color:LIGHT},line:{color:LIGHT}});
s.addText([{text:'AI 어시스턴트  ● 3회 남음',options:{bold:true,breakLine:true,paraSpaceAfter:8}},{text:'나: “특강신청.pdf에서 반별 최종 인원과, 참여자명단.png 중 미신청자를 알려줘”',options:{color:NAVY,breakLine:true,paraSpaceAfter:8}},{text:'AI: “면접반 4명, 자소서반 3명입니다. 명단 5명 모두 신청 기록이 있어 미신청자는 없습니다.”'}],{x:7.9,y:2.5,w:4.8,h:3.2,fontFace:F,fontSize:12,color:INK,valign:'top',margin:0.15,isTextBox:true});
s.addText([{text:'Q. 주의사항을 적용한 면접반 최종 인원과 미신청자로 옳은 것은?',options:{bold:true,breakLine:true,paraSpaceAfter:4}},{text:'①  면접반 4명 · 미신청자 없음      ②  면접반 3명 · 도윤      ③  면접반 3명 · 미신청자 없음      ④  면접반 2명 · 도윤'}],{x:0.6,y:5.85,w:12.1,h:0.85,fontFace:F,fontSize:13,color:INK,valign:'top',margin:0,isTextBox:true});
// 7 ans1
function tbl(s,rows){
  s.addShape(pres.shapes.RECTANGLE,{x:0.6,y:2.35,w:12.1,h:0.5,fill:{color:NAVY},line:{color:NAVY}});
  [['보기',0.6,1.3],['판정',1.9,1.5],['이유',3.4,9.3]].forEach(h=>s.addText(h[0],{x:h[1],y:2.35,w:h[2],h:0.5,fontFace:F,fontSize:14,bold:true,color:WHITE,valign:'middle',margin:[0,0.15,0,0.15],isTextBox:true}));
  rows.forEach((r,i)=>{const y=2.9+i*0.7,ok=r[1]==='정답';
    s.addShape(pres.shapes.RECTANGLE,{x:0.6,y,w:12.1,h:0.65,fill:{color:LIGHT},line:{color:LIGHT}});
    s.addText(r[0],{x:0.6,y,w:1.3,h:0.65,fontFace:F,fontSize:14,bold:true,color:INK,valign:'middle',margin:[0,0.15,0,0.15],isTextBox:true});
    s.addText(r[1],{x:1.9,y,w:1.5,h:0.65,fontFace:F,fontSize:14,bold:true,color:ok?BLUE:GRAY,valign:'middle',margin:[0,0.15,0,0.15],isTextBox:true});
    s.addText(r[2],{x:3.4,y,w:9.3,h:0.65,fontFace:F,fontSize:13,color:INK,valign:'middle',margin:[0,0.15,0,0.15],isTextBox:true});});
}
s=base('도입 ⑦ · 정답 해설 1','[연습 1 해설] 정답 ③ — 조건 세 가지를 모두 갖춘 보기','I-7','연습문제: 커리어캐쳐 자체 제작(AI 활용평가 객관식 유형 참고)');
s.addText('풀이 방법  보기마다 조건 ① 페르소나 ② 무응답 처리 기준 ③ 표 출력을 하나씩 대조해, 셋 다 맞는 보기를 고릅니다.',{x:0.6,y:1.6,w:12.1,h:0.55,fontFace:F,fontSize:14,color:INK,valign:'middle',fill:{color:LIGHT},margin:[0,0.15,0,0.15],isTextBox:true});
tbl(s,[['①','오답','무응답을 1점으로 유지 → 왜곡을 일으킨 기준을 그대로 둠 (조건 ② 위반)'],['②','오답','“취업지원팀 팀장” 역할 → 설문 분석 전문가 페르소나가 아님 (조건 ① 위반)'],['③','정답','전문가 역할 + 무응답 제외·응답 수 표기 + 표 출력 → 세 조건 모두 충족'],['④','오답','결과 대신 원인을 서술형 문장으로 요청 → 표 출력이 빠짐 (조건 ③ 위반)']]);
s.addText('실무 팁  프롬프트를 보내기 전 “역할·기준·형식” 세 가지를 체크리스트로 확인하세요.',{x:0.6,y:5.85,w:12.1,h:0.5,fontFace:F,fontSize:16,bold:true,color:BLUE,margin:0,isTextBox:true});
// 8 ans2
s=base('도입 ⑧ · 정답 해설 2','[연습 2 해설] 정답 ② — 면접반 3명 · 미신청자 도윤','I-8','연습문제: 커리어캐쳐 자체 제작(AI 활용평가 실습형 유형 참고). 데이터는 가상');
s.addShape(pres.shapes.RECTANGLE,{x:0.6,y:1.7,w:5.9,h:3.9,fill:{color:LIGHT},line:{color:LIGHT}});
s.addText([{text:'1단계  사람별 마지막 신청만 남기기',options:{bold:true,color:NAVY,breakLine:true,paraSpaceAfter:6}},...['민준  면접반 → 자소서반  ⇒ 자소서반','서연  자소서반 → 면접반  ⇒ 면접반','하은  면접반  ⇒ 면접반','지우  자소서반 → 면접반  ⇒ 면접반'].map(t=>({text:t,options:{breakLine:true}})),{text:'최종  면접반 3명 · 자소서반 1명',options:{bold:true,color:BLUE,breakLine:true,paraSpaceAfter:12}},{text:'2단계  명단과 대조',options:{bold:true,color:NAVY,breakLine:true,paraSpaceAfter:6}},{text:'명단 5명 중 신청 기록이 없는 사람  ⇒ 도윤'}],{x:0.6,y:1.7,w:5.9,h:3.9,fontFace:F,fontSize:14,color:INK,valign:'top',margin:0.2,isTextBox:true});
s.addText([{text:'AI 답이 틀린 이유',options:{bold:true,color:NAVY,breakLine:true,paraSpaceAfter:6}},{text:'• “면접반 4·자소서반 3”은 취소된 신청까지 센 건수',options:{breakLine:true}},{text:'• 명단 대조도 하지 않고 “미신청자 없음”으로 답함',options:{breakLine:true,paraSpaceAfter:12}},{text:'이렇게 물었다면',options:{bold:true,color:NAVY,breakLine:true,paraSpaceAfter:6}},{text:'“한 사람이 여러 번 신청했으면 마지막 신청만 남기고, 사람별 최종 반을 표로 보여줘. 그다음 명단과 대조해 기록이 없는 사람을 찾아줘.”'}],{x:6.7,y:1.7,w:6.0,h:3.9,fontFace:F,fontSize:14,color:INK,valign:'top',margin:0.2,line:{color:NAVY,width:1},isTextBox:true});
s.addText('실무 팁  질문 횟수가 제한될수록 규칙을 질문에 넣고, AI의 답은 중간 과정을 보며 직접 검증하세요.',{x:0.6,y:5.85,w:12.1,h:0.5,fontFace:F,fontSize:16,bold:true,color:BLUE,margin:0,isTextBox:true});
pres.writeFile({fileName:'AI_Intro_pptxgenjs.pptx'}).then(()=>console.log('done'));
