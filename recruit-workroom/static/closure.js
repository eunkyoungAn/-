'use strict';
// 사후관리 종료 기록: app.js의 $, el, api, copy, config를 함께 사용합니다.
const CL_TYPES={employed:'취업',startup:'창업',lost:'연락 두절',declined:'연락 비희망'};
const CL_FIELDS={
 common:{name:'clName',endDate:'clEndDate',record:'clRecord',rules:'clRules'},
 employed:{company:'clCompany',role:'clRole',startDate:'clStartDate',employment:'clEmployment',verify:'clVerify'},
 startup:{bizName:'clBizName',bizType:'clBizType',bizDate:'clBizDate',bizVerify:'clBizVerify'},
 lost:{attempts:'clAttempts'},
 declined:{declineDate:'clDeclineDate',declineMethod:'clDeclineMethod',declineWords:'clDeclineWords'}
};
const HERO={
 recommend:['후보자 추천 메일 만들기','자료를 넣고 순서대로 따라오세요. 분석과 메일 초안을 함께 준비합니다.'],
 closure:['사후관리 종료 기록','서비스 기록을 넣고 종료 유형을 고르세요. 확인할 증빙과 종료 기록 문안을 정리합니다.']
};
let clBusy=false, clResult=null;

function setMode(mode,focus){
 document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
 $('recommendView').hidden=mode!=='recommend';$('closureView').hidden=mode!=='closure';$('recommendActions').hidden=mode!=='recommend';
 $('heroTitle').textContent=HERO[mode][0];$('heroIntro').textContent=HERO[mode][1];
 if(focus)$(mode==='closure'?'closureTitle':'title'+currentStep).focus({preventScroll:true});
}
document.querySelectorAll('[data-mode]').forEach(b=>{
 b.onclick=()=>setMode(b.dataset.mode,true);
 b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=b.dataset.mode==='recommend'?'closure':'recommend';setMode(next,false);$(next==='closure'?'modeClosure':'modeRecommend').focus();}});
});

function clNotice(message){$('closureNotice').textContent=message;$('closureNotice').hidden=!message;if(message)$('closureNotice').scrollIntoView({block:'nearest'});}
function clType(){return document.querySelector('input[name=clType]:checked')?.value||'';}
function clRead(){
 const type=clType(),d={type};
 for(const [k,id] of Object.entries({...CL_FIELDS.common,...(CL_FIELDS[type]||{})}))d[k]=$(id).value.trim();
 return d;
}
function showTypeFields(){const type=clType();document.querySelectorAll('.type-fields').forEach(f=>f.hidden=f.dataset.type!==type);}

// 연락 시도: 줄 수와 서로 다른 날짜 수
function countAttempts(text){
 const lines=text.split('\n').map(v=>v.trim()).filter(Boolean);
 const dates=new Set();
 for(const line of lines){const m=line.match(/(\d{4})[-./년]\s*(\d{1,2})[-./월]\s*(\d{1,2})/);if(m)dates.add(`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`);}
 return {lines,count:lines.length,days:dates.size};
}
function updateAttemptCount(){const {count,days}=countAttempts($('clAttempts').value);$('clAttemptCount').hidden=!count;$('clAttemptCount').textContent=`연락 시도 ${count}건 · 서로 다른 날짜 ${days}일`+(count>days?' (날짜가 없거나 같은 날 시도한 기록 포함)':'');}

function clInvalidate(){if(clResult){$('clResultLabel').textContent='입력 변경 · 다시 작성 필요';$('clCopyBtn').disabled=true;$('clDownloadBtn').disabled=true;}}
$('closureForm').addEventListener('input',e=>{if(e.target.id==='clAttempts')updateAttemptCount();if(e.target.name==='clType')showTypeFields();clInvalidate();});
$('closureForm').addEventListener('change',e=>{if(e.target.name==='clType'){showTypeFields();clInvalidate();}});

function validateClosure(){
 if(!clType()){clNotice('종료 유형을 선택해주세요.');document.querySelector('input[name=clType]').focus();return false;}
 return true;
}

// 양식 작성 (AI 없이)
const blank=(v,label)=>v||`[${label} 확인 필요]`;
function check(item,value,status,note){return {item,status:value?status:'미입력',note:value?note:'입력되지 않았습니다.'};}
function verifyStatus(v){return !v?'미입력':v==='본인 진술'?'본인 진술':'확인됨';}
function buildTemplate(d){
 const type=CL_TYPES[d.type],checks=[check('사후관리 종료일',d.endDate,'확인됨',d.endDate)],follow=[],detail=[];
 let reason='';
 if(d.type==='employed'){
  reason=`${blank(d.company,'사업장명')}에 ${blank(d.role,'직무')} 직무로 ${blank(d.startDate,'취업일')} 취업(${blank(d.employment,'고용형태')})하여 사후관리를 종료함.`;
  checks.push(check('사업장명',d.company,'확인됨',d.company),check('취업일',d.startDate,'확인됨',d.startDate),check('고용형태',d.employment,'확인됨',d.employment),{item:'확인 방법',status:verifyStatus(d.verify),note:d.verify||'증빙 방법이 입력되지 않았습니다.'});
  detail.push(`사업장명: ${blank(d.company,'사업장명')}`,`직무: ${blank(d.role,'직무')}`,`취업일: ${blank(d.startDate,'취업일')}`,`고용형태: ${blank(d.employment,'고용형태')}`,`확인 방법: ${blank(d.verify,'확인 방법')}`);
  follow.push('고용보험 가입 이력 등 취업 증빙 확보 여부를 확인하세요.','사업에서 요구하는 근속·고용형태 기준이 있다면 대조하세요.');
  if(d.verify==='본인 진술')follow.unshift('현재 본인 진술만 있습니다. 객관적 증빙으로 보완할 수 있는지 확인하세요.');
 }else if(d.type==='startup'){
  reason=`${blank(d.bizType,'업종')} 업종 '${blank(d.bizName,'상호')}' 창업(사업자등록일 ${blank(d.bizDate,'사업자등록일')})으로 사후관리를 종료함.`;
  checks.push(check('상호',d.bizName,'확인됨',d.bizName),check('업종',d.bizType,'확인됨',d.bizType),check('사업자등록일',d.bizDate,'확인됨',d.bizDate),{item:'확인 방법',status:verifyStatus(d.bizVerify),note:d.bizVerify||'증빙 방법이 입력되지 않았습니다.'});
  detail.push(`상호: ${blank(d.bizName,'상호')}`,`업종: ${blank(d.bizType,'업종')}`,`사업자등록일: ${blank(d.bizDate,'사업자등록일')}`,`확인 방법: ${blank(d.bizVerify,'확인 방법')}`);
  follow.push('사업자등록증 사본 또는 사업자 상태 조회 결과를 확보하세요.');
  if(d.bizVerify==='본인 진술')follow.unshift('현재 본인 진술만 있습니다. 사업자등록 상태 조회로 보완할 수 있는지 확인하세요.');
 }else if(d.type==='lost'){
  const a=countAttempts(d.attempts);
  reason=a.count?`${a.count}회(서로 다른 날짜 ${a.days}일) 연락을 시도하였으나 응답이 없어 연락 두절로 사후관리를 종료함.`:'[연락 시도 내역 확인 필요] 연락 두절로 사후관리를 종료함.';
  checks.push({item:'연락 시도 기록',status:a.count?'확인됨':'미입력',note:a.count?`${a.count}건 · 서로 다른 날짜 ${a.days}일`:'연락 시도 내역이 입력되지 않았습니다.'});
  checks.push({item:'내부 종료 기준 충족',status:'보완 필요',note:d.rules?'입력한 기준과 시도 횟수·기간·수단을 직접 대조해주세요.':'기준이 입력되지 않았습니다. 내부 기준 확인이 필요합니다.'});
  detail.push('연락 시도 내역:',...(a.count?a.lines.map(l=>`  · ${l}`):['  · [연락 시도 내역 확인 필요]']));
  follow.push('연락 수단(전화·문자·메일)이 기준에 맞게 다양했는지 확인하세요.','최종 안내(종료 예정 고지) 발송 여부를 기록하세요.');
 }else if(d.type==='declined'){
  reason=`${blank(d.declineDate,'의사 확인일')} ${blank(d.declineMethod,'확인 방법')} 연락에서 본인이 추가 연락·서비스를 희망하지 않는다는 의사를 밝혀 사후관리를 종료함.`;
  checks.push(check('의사 확인일',d.declineDate,'확인됨',d.declineDate),check('확인 방법',d.declineMethod,'확인됨',d.declineMethod),check('본인 의사 요지',d.declineWords,'본인 진술',d.declineWords));
  detail.push(`의사 확인일: ${blank(d.declineDate,'의사 확인일')}`,`확인 방법: ${blank(d.declineMethod,'확인 방법')}`,`본인 의사 요지: ${blank(d.declineWords,'본인 의사 요지')}`,'재참여 안내: [재참여 안내 여부 확인]');
  follow.push('재참여를 원하면 언제든 연락할 수 있다고 안내했는지 기록하세요.','문자·메일로 확인했다면 원문을 보관하세요.');
 }
 checks.push({item:'서비스 기록',status:d.record?'확인됨':'미입력',note:d.record?'원문 기록이 입력되었습니다. 세부 경과는 AI 정리 또는 원문을 참고하세요.':'서비스 기록이 입력되지 않았습니다.'});
 const note=['[사후관리 종료 기록]',`- 참여자: ${d.name||'[참여자 확인 필요]'}`,`- 종료일: ${blank(d.endDate,'종료일')}`,`- 종료 유형: ${type}`,`- 종료 사유: ${reason}`,'- 세부 내용:',...detail.map(v=>v.startsWith('  ')?'  '+v:`  · ${v}`)].join('\n');
 return {summary:reason,timeline:[],checks,follow_up:follow,closure_note:note};
}

function renderClosure(r,label,type){
 clResult=r;$('closureResult').hidden=false;$('clResultLabel').textContent=label;$('clResultType').textContent=CL_TYPES[type];$('clSummary').textContent=r.summary;
 $('clChecks').replaceChildren(...r.checks.map(c=>{const row=el('div',undefined,'check-row');const top=el('div',undefined,'criterion-top');top.append(el('strong',c.item),el('span',c.status,'badge '+({'확인됨':'match','본인 진술':'possible','미입력':'unknown'}[c.status]||'')));row.append(top);if(c.note)row.append(el('p',c.note,'check-note'));return row;}));
 $('clTimelineBlock').hidden=!r.timeline.length;
 $('clTimeline').replaceChildren(...r.timeline.map(t=>{const li=el('li');li.append(el('span',t.date,'timeline-date'),el('span',t.content));return li;}));
 $('clFollow').replaceChildren(...r.follow_up.map(v=>el('li',v)));
 $('clNote').value=r.closure_note;$('clCopyBtn').disabled=false;$('clDownloadBtn').disabled=false;
 $('closureResult').scrollIntoView({block:'start'});$('clResultTitle').focus({preventScroll:true});
}

function setClBusy(on){clBusy=on;['clAiBtn','clTemplateBtn','clResetBtn','clEditBtn','settingsBtn','modeRecommend'].forEach(id=>$(id).disabled=on);$('clAiBtn').textContent=on?'기록을 정리하고 있습니다…':'AI로 정리';$('closureForm').setAttribute('aria-busy',String(on));}

$('clTemplateBtn').onclick=()=>{if(clBusy||!validateClosure())return;clNotice('');const d=clRead();renderClosure(buildTemplate(d),'양식 작성 · AI 사용 안 함',d.type);};
$('closureForm').addEventListener('submit',async e=>{
 e.preventDefault();if(clBusy||!validateClosure())return;
 const d=clRead();
 if(!d.record){clNotice("AI 정리에는 서비스 기록이 필요합니다. 기록 없이 쓰려면 '양식으로 작성'을 눌러주세요.");$('clRecord').focus();return;}
 if(!config?.hasKey&&!$('apiKey').value.trim()){clNotice('AI 정리에는 API 연결이 필요합니다. 연결 설정을 하거나 양식으로 작성해주세요.');$('settings').showModal();return;}
 clNotice('');setClBusy(true);
 try{d.apiKey=$('apiKey').value.trim();d.model=$('model').value.trim();const j=await api('/api/closure',d);renderClosure(j.result,'AI 정리 초안',d.type);clNotice('AI 정리 초안입니다. 원문 기록과 대조한 뒤 사용하세요.');}
 catch(err){clNotice(err.message);}
 finally{setClBusy(false);}
});
$('clCopyBtn').onclick=async()=>{const ok=await copy($('clNote').value);clNotice(ok?'종료 기록 문안을 복사했습니다.':'복사가 제한되어 있습니다. 문안을 직접 선택해 복사해주세요.');};
$('clDownloadBtn').onclick=()=>{const url=URL.createObjectURL(new Blob(['﻿'+$('clNote').value],{type:'text/plain;charset=utf-8'}));const a=el('a');a.href=url;a.download=`사후관리종료_${$('clName').value.trim()||'기록'}.txt`.replace(/[\\/:*?"<>|]/g,'_');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('clEditBtn').onclick=()=>{$('closureTitle').scrollIntoView({block:'start'});$('closureTitle').focus({preventScroll:true});};
$('clResetBtn').onclick=()=>{$('closureForm').reset();showTypeFields();updateAttemptCount();clResult=null;$('closureResult').hidden=true;clNotice('');};
$('clFile').onchange=async e=>{
 const f=e.target.files[0];if(!f||clBusy)return;
 if(f.size>8*1024*1024){clNotice('파일은 8MB 이하로 선택해주세요.');e.target.value='';return;}
 setClBusy(true);
 try{const data=await dataURL(f);const j=await api('/api/extract',{name:f.name,base64:data.split(',')[1]});const combined=($('clRecord').value?$('clRecord').value+'\n\n':'')+j.text;if(combined.length>45000)throw new Error('합쳐진 기록이 45,000자를 넘습니다. 기존 내용을 줄여주세요.');$('clRecord').value=combined;clInvalidate();clNotice(j.name+'에서 내용을 가져왔습니다. 표·줄바꿈을 확인해주세요.');}
 catch(err){clNotice(err.message);}
 finally{e.target.value='';setClBusy(false);}
};
