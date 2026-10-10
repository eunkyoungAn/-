export const TYPES=['이력서 컨설팅','자기소개서 컨설팅','취업 상담','공고 제공','취업 알선','면접 지원','취업 후 상담','기타 지원'];
export const today=()=>new Intl.DateTimeFormat('sv-SE',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const dateAdd=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return new Intl.DateTimeFormat('sv-SE').format(d)};
export const uid=()=>crypto.randomUUID();
export const empty=()=>({version:1,managers:[],people:[],services:[],audit:[]});
export const days=(end,start=today())=>Math.round((Date.parse(end+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000);
export const phase=p=>p.start>today()?'시작 전':p.end<today()?'기간 종료':'진행 중';
const text=(s,max=12000)=>typeof s==='string'&&s.length<=max;
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function validate(d){
 if(d?.version!==1)throw Error('지원하지 않는 자료 형식입니다.');
 for(const k of ['managers','people','services','audit'])if(!Array.isArray(d[k])||d[k].length>20000)throw Error('자료 목록이 올바르지 않습니다.');
 for(const k of ['managers','people','services']){const ids=new Set();for(const x of d[k]){if(!text(x.id,100)||!x.id||ids.has(x.id))throw Error('중복되거나 잘못된 식별자입니다.');ids.add(x.id)}}
 const managers=new Set(d.managers.map(m=>m.id)),people=new Set(d.people.map(p=>p.id));
 for(const m of d.managers)if(!text(m.name,100)||!m.name.trim()||!text(m.org,200)||!text(m.phone,100)||typeof m.active!=='boolean')throw Error('담당자 항목을 확인하세요.');
 for(const p of d.people){if(!text(p.name,100)||!p.name.trim()||!text(p.code,100)||!text(p.phone,100)||!text(p.role,200)||!text(p.status,100)||!text(p.note)||!managers.has(p.managerId)||!date(p.start)||!date(p.end)||p.start>p.end||!Array.isArray(p.history))throw Error('구직자의 담당자·관리 기간·필수 항목을 확인하세요.');for(const h of p.history)if(!managers.has(h.managerId)||!date(h.start)||!date(h.end)||h.start>h.end||!text(h.at,50))throw Error('담당 배정 이력 오류');}
 let fileSize=0;
 for(const s of d.services){if(!people.has(s.personId)||!managers.has(s.managerId)||!date(s.date)||!TYPES.includes(s.type)||!text(s.method,100)||!text(s.content)||!s.content.trim()||!text(s.result)||!text(s.next)||s.nextDate&&!date(s.nextDate)||typeof s.done!=='boolean'||!Array.isArray(s.files)||s.files.length>10)throw Error('서비스 기록의 연결·날짜·필수 항목을 확인하세요.');for(const f of s.files){if(!text(f.id,100)||!text(f.name,250)||!text(f.data,4200000)||!/^data:(image\/(png|jpeg)|application\/octet-stream);base64,[A-Za-z0-9+/]*={0,2}$/.test(f.data))throw Error('증빙 파일 형식 오류');fileSize+=f.data.length;}}
 if(fileSize>40000000)throw Error('증빙 총 용량이 30MB를 초과했습니다.');
 if(JSON.stringify(d).length>50000000)throw Error('저장소 크기 한도를 초과했습니다.');return d;
}
export function sample(){const d=empty();d.managers=[{id:'m1',name:'김담당',org:'취업지원팀',phone:'',active:true},{id:'m2',name:'이상담',org:'취업지원팀',phone:'',active:true}];
 const names=['김하늘','박지우','이서준','최유진','정민서','윤도현'];const roles=['사무·행정','콘텐츠 디자인','생산·품질관리','회계·경리','사회복지','IT 개발'];
 d.people=names.map((name,i)=>({id:'p'+i,name,code:'DEMO-00'+(i+1),phone:'010-0000-0000',role:roles[i],status:i===2?'취업 후 관리':'구직 중',managerId:i%2?'m2':'m1',start:dateAdd(-30-i*5),end:dateAdd(i===0?6:i===4?-3:30+i*7),note:'가상 체험 자료입니다.',history:[]}));
 d.services=d.people.flatMap((p,i)=>[{id:'s'+i,personId:p.id,managerId:p.managerId,date:dateAdd(-2-i),type:TYPES[i%TYPES.length],method:'대면',content:['희망 직무에 맞춰 경력과 경험을 정리하고 이력서 문장을 검토했습니다.','지원 기업에 맞는 자기소개서 사례를 정리했습니다.','취업 후 직무 적응과 근무 만족도를 확인했습니다.','희망 지역의 채용공고 3건을 안내했습니다.','지원 가능한 기업과 채용 일정을 확인했습니다.','면접 예상 질문과 답변을 연습했습니다.'][i],result:'다음 연락에서 진행 결과를 확인하기로 했습니다.',next:'지원 결과 확인',nextDate:dateAdd(i-2),done:false,files:[]}]);return d;}
