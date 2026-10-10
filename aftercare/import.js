// 구직자 일괄 등록: .xlsx / .csv 파일을 브라우저 안에서만 읽습니다. (외부 전송·외부 라이브러리 없음)
import {today,uid} from './model.js';

export const FIELDS=[
 ['name','이름',true],['code','관리번호'],['phone','연락처'],['role','희망 직무'],['status','취업 상태'],
 ['manager','사후관리자'],['start','관리 시작일'],['end','관리 종료일'],['note','관리 메모']
];
const SYN={
 name:['이름','성명','성함','구직자명','구직자','참여자명','참여자','내담자','내담자명','대상자','대상자명','고객명'],
 code:['관리번호','구직번호','구직신청번호','구직등록번호','참여자번호','참여번호','고유번호','상담번호','사례번호','등록번호'],
 phone:['연락처','휴대폰','휴대전화','핸드폰','휴대폰번호','휴대전화번호','전화번호','전화','연락처휴대폰'],
 role:['희망직무','희망직종','희망업무','희망분야','희망직업','취업희망직종','희망업종','직무','직종'],
 status:['취업상태','진행상태','구직상태','취업여부','참여상태','상태'],
 manager:['사후관리자','담당자','담당상담사','상담사','상담자','전담자','담당직원','담당자명','상담원','담당'],
 start:['관리시작일','사후관리시작일','시작일','참여일','참여시작일','등록일','배정일','접수일','상담시작일','취업일'],
 end:['관리종료일','사후관리종료일','종료일','참여종료일','만료일','관리만료일'],
 note:['관리메모','메모','비고','특이사항','참고사항','참고']
};
export const STATUSES=['구직 중','입사 예정','취업 후 관리','지원 보류','종결'];
const norm=s=>String(s??'').replace(/\([^)]*\)|\[[^\]]*\]/g,'').replace(/[\s·.,:/*_\-]/g,'').toLowerCase();

/* ---------- 파일 읽기 ---------- */
export async function readTable(file){
 if(file.size>15*1024*1024)throw Error('15MB 이하의 파일을 선택하세요.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes[0]===0xD0&&bytes[1]===0xCF&&bytes[2]===0x11&&bytes[3]===0xE0)
  throw Error('암호가 걸렸거나 보안(DRM) 처리된 엑셀, 또는 예전 형식(.xls) 파일이라 읽을 수 없습니다. 엑셀에서 파일을 연 뒤 [다른 이름으로 저장] → "Excel 통합 문서(.xlsx)" 또는 "CSV(쉼표로 분리)"로 암호 없이 저장해서 올려주세요.');
 if(bytes[0]===0x50&&bytes[1]===0x4B)return readXlsx(bytes);
 if(/\.(xlsx|xlsm)$/i.test(file.name))throw Error('엑셀 파일 형식을 인식하지 못했습니다. 엑셀에서 .xlsx 또는 CSV로 다시 저장해 주세요.');
 return [{name:file.name.replace(/\.[^.]+$/,''),rows:parseCSV(decodeText(bytes))}];
}
function decodeText(bytes){
 try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^﻿/,'')}
 catch{return new TextDecoder('euc-kr').decode(bytes)}
}
export function parseCSV(text){
 const first=text.split(/\r?\n/,1)[0]||'';
 const delim=[',','\t',';'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
 const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c;continue}
  if(c==='"'&&cell==='')q=true;else if(c===delim){row.push(cell);cell=''}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}
  else cell+=c;}
 if(cell!==''||row.length){row.push(cell);rows.push(row)}
 return rows;
}
async function unzip(bytes){
 const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let eocd=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}
 if(eocd<0)throw Error('엑셀 파일 구조를 읽을 수 없습니다.');
 const count=dv.getUint16(eocd+10,true);let p=dv.getUint32(eocd+16,true);const files=new Map();const dec=new TextDecoder();
 for(let n=0;n<count;n++){
  if(dv.getUint32(p,true)!==0x02014b50)break;
  const method=dv.getUint16(p+10,true),size=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
  const name=dec.decode(bytes.subarray(p+46,p+46+nl));p+=46+nl+el+cl;
  files.set(name.replace(/^\/+/,''),{method,size,off});
 }
 return async name=>{const f=files.get(name);if(!f)return null;
  const start=f.off+30+dv.getUint16(f.off+26,true)+dv.getUint16(f.off+28,true),raw=bytes.subarray(start,start+f.size);
  if(f.method===0)return dec.decode(raw);
  if(f.method!==8)throw Error('지원하지 않는 압축 방식의 엑셀 파일입니다.');
  if(typeof DecompressionStream==='undefined')throw Error('이 브라우저는 엑셀 읽기를 지원하지 않습니다. 최신 Chrome 또는 Edge를 사용하거나 CSV로 저장해 올려주세요.');
  const out=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return dec.decode(await new Response(out).arrayBuffer());};
}
const xml=s=>new DOMParser().parseFromString(s,'application/xml');
const tags=(node,name)=>[...node.getElementsByTagNameNS('*',name)];
async function readXlsx(bytes){
 const get=await unzip(bytes);
 const wbText=await get('xl/workbook.xml');if(!wbText)throw Error('엑셀 통합 문서를 찾을 수 없습니다.');
 const wb=xml(wbText),rels=xml(await get('xl/_rels/workbook.xml.rels')||'<r/>');
 const date1904=tags(wb,'workbookPr').some(n=>['1','true'].includes(n.getAttribute('date1904')));
 const target=new Map(tags(rels,'Relationship').map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));
 const ssText=await get('xl/sharedStrings.xml');
 const shared=ssText?tags(xml(ssText),'si').map(si=>tags(si,'t').filter(t=>!hasAncestor(t,'rPh')).map(t=>t.textContent).join('')):[];
 const sheets=[];
 for(const s of tags(wb,'sheet')){
  const rid=s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||s.getAttribute('r:id');
  let t=target.get(rid)||'';t=t.startsWith('/')?t.slice(1):'xl/'+t.replace(/^\.\//,'');
  const text=await get(t);if(!text)continue;
  const rows=[];
  for(const r of tags(xml(text),'row')){
   const ri=(+r.getAttribute('r')||rows.length+1)-1,row=[];let ci=0;
   for(const c of tags(r,'c')){
    const ref=c.getAttribute('r');if(ref){ci=0;for(const ch of ref.replace(/\d+/g,''))ci=ci*26+ch.charCodeAt(0)-64;ci--}
    const type=c.getAttribute('t'),v=tags(c,'v')[0]?.textContent??'';let value;
    if(type==='s')value=shared[+v]??'';else if(type==='inlineStr')value=tags(c,'t').map(t=>t.textContent).join('');
    else if(type==='str'||type==='e'||type==='d')value=v;else if(type==='b')value=v==='1'?'TRUE':'FALSE';
    else value=v===''?'':{num:+v,date1904};
    row[ci]=value;ci++;
   }
   rows[ri]=row;
  }
  for(let i=0;i<rows.length;i++)if(!rows[i])rows[i]=[];
  sheets.push({name:s.getAttribute('name')||'시트'+(sheets.length+1),rows});
 }
 if(!sheets.length)throw Error('엑셀 시트를 읽을 수 없습니다.');
 return sheets;
}
function hasAncestor(n,name){for(let p=n.parentNode;p&&p.nodeType===1;p=p.parentNode)if(p.localName===name)return true;return false}

/* ---------- 열 맞추기 ---------- */
export const cellText=v=>v&&typeof v==='object'?String(v.num):String(v??'').trim();
export function detectHeader(rows){
 let best=-1,score=0;
 for(let i=0;i<Math.min(rows.length,30);i++){
  const cells=(rows[i]||[]).map(c=>norm(cellText(c)));
  const s=Object.values(SYN).filter(list=>cells.some(c=>list.map(norm).includes(c))).length+(cells.some(c=>SYN.name.map(norm).includes(c))?2:0);
  if(s>score){score=s;best=i}
 }
 return best<0?0:best;
}
export function guessMapping(header){
 const cells=header.map(c=>norm(cellText(c))),map={},used=new Set();
 for(const pass of [0,1])for(const [key] of FIELDS){
  if(map[key]!==undefined)continue;
  const list=SYN[key].map(norm);
  const idx=cells.findIndex((c,i)=>c&&!used.has(i)&&(pass===0?list.includes(c):list.some(s=>s.length>=3&&c.includes(s)&&!(key!=='phone'&&/연락처|전화|휴대/.test(c)))));
  if(idx>=0){map[key]=idx;used.add(idx)}
 }
 return map;
}

/* ---------- 값 정리 ---------- */
const iso=(y,m,d)=>{const s=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const t=new Date(s+'T00:00:00Z');return !Number.isNaN(+t)&&t.toISOString().slice(0,10)===s?s:''};
export function toDate(v){
 if(v&&typeof v==='object'){const n=v.num;if(n>20000&&n<80000){const t=new Date(Date.UTC(1899,11,30)+(Math.floor(n)+(v.date1904?1462:0))*86400000);return t.toISOString().slice(0,10)}v=String(n)}
 const s=String(v??'').trim();if(!s)return '';
 let m=s.match(/^(\d{4})(\d{2})(\d{2})$/)||s.match(/(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})/);if(m)return iso(+m[1],+m[2],+m[3]);
 m=s.match(/^(\d{2})\s*[-./]\s*(\d{1,2})\s*[-./]\s*(\d{1,2})$/);if(m)return iso(2000+ +m[1],+m[2],+m[3]);
 return null;
}
function toPhone(v){let s=cellText(v);if(/^1\d{9}$/.test(s))s='0'+s;if(/^01\d{8,9}$/.test(s))s=s.replace(/^(\d{3})(\d{3,4})(\d{4})$/,'$1-$2-$3');return s}
function toStatus(s){
 const t=norm(s);if(!t)return ['구직 중',''];
 const exact=STATUSES.find(x=>norm(x)===t);if(exact)return [exact,''];
 const mapped=/종결|종료|중단|철회|포기/.test(t)?'종결':/예정/.test(t)?'입사 예정':/보류/.test(t)?'지원 보류':/미취업|구직/.test(t)?'구직 중':/취업|재직|입사/.test(t)?'취업 후 관리':'구직 중';
 return [mapped,s];
}
const addDays=(d,n)=>{const t=new Date(d+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)};
const clip=(s,n)=>String(s??'').trim().slice(0,n);

/* 각 행을 등록용 구직자 자료로 변환하고, 등록할 수 없는 행은 사유와 함께 돌려줍니다. */
export function buildPeople({rows,headerRow,map,opt,data}){
 const out=[],skipped=[],newManagers=[],codes=new Set(data.people.map(p=>p.code).filter(Boolean)),seen=new Set(data.people.map(p=>p.name+'|'+p.phone));
 const byName=new Map(data.managers.map(m=>[norm(m.name),m]));
 const col=(r,k)=>map[k]===undefined||map[k]===''?'':r[+map[k]];
 for(let i=headerRow+1;i<rows.length;i++){
  const r=rows[i]||[],line=i+1;
  if(!r.some(c=>cellText(c)))continue;
  const name=clip(cellText(col(r,'name')),100);
  if(!name){if(!r.some(c=>/^(합계|소계|총계|계)$/.test(cellText(c).replace(/\s/g,''))))skipped.push([line,'이름 없음']);continue}
  if(/^(합계|소계|총계|계)$/.test(name))continue;
  const code=clip(cellText(col(r,'code')),100),phone=clip(toPhone(col(r,'phone')),100);
  if(code&&codes.has(code)){skipped.push([line,name+' · 이미 등록된 관리번호']);continue}
  if(!code&&seen.has(name+'|'+phone)){skipped.push([line,name+' · 이미 등록된 이름·연락처']);continue}
  const sRaw=col(r,'start'),eRaw=col(r,'end');let start=toDate(sRaw),end=toDate(eRaw);
  if(start===null){skipped.push([line,name+' · 관리 시작일 형식 오류']);continue}
  if(end===null){skipped.push([line,name+' · 관리 종료일 형식 오류']);continue}
  start=start||opt.start;end=end||addDays(start,opt.days);
  if(start>end){skipped.push([line,name+' · 종료일이 시작일보다 빠름']);continue}
  let managerId=opt.managerId;const mName=clip(cellText(col(r,'manager')),100);
  if(mName){let m=byName.get(norm(mName));
   if(!m&&opt.createManagers){m={id:uid(),name:mName,org:'',phone:'',active:true};byName.set(norm(mName),m);newManagers.push(m)}
   if(m)managerId=m.id;}
  if(!managerId){skipped.push([line,name+' · 사후관리자 미지정']);continue}
  const [status,rawStatus]=toStatus(cellText(col(r,'status')));
  const note=clip([cellText(col(r,'note')),rawStatus&&rawStatus!==status?'원본 취업 상태: '+rawStatus:''].filter(Boolean).join('\n'),12000);
  if(code)codes.add(code);seen.add(name+'|'+phone);
  out.push({id:uid(),name,code,phone,role:clip(cellText(col(r,'role')),200),status,managerId,start,end,note,history:[],_line:line,_manager:mName});
 }
 return {people:out,skipped,newManagers};
}

export function templateCSV(){
 const head=FIELDS.map(f=>f[1]),ex=['홍길동(예시 행은 지우고 사용)','A-0001','010-0000-0000','사무·행정','구직 중','김담당',today(),'','필요한 내용만 입력'];
 const cell=v=>'"'+String(v).replace(/"/g,'""')+'"';
 return new Blob(['﻿'+[head,ex].map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
}
