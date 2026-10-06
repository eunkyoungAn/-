export type Entry={id:string;selected:boolean;fields:Record<string,string>};
export type Output={id:string;kind:"company"|"letter";title:string;time:string;data?:Record<string,string|string[]>;error?:string};
export const companyFields=["기업명","채용직무","업종/주요 서비스","근무지역","설립년도","직원 수","주요업무","자격요건","우대사항","기술스택","인재상","가고싶은 이유","채용 사이트","채용절차"];
export const experienceFields=["경험 유형","활용 문항·대표 역량","핵심 상황","나의 행동","성과·근거","자소서 초안 예시문"];
export const labels:Record<string,string>={job_keywords:"직무 핵심 키워드",required_competencies:"요구 역량 키워드",experience_connection_points:"내 경험 연결 포인트",motivation_materials:"지원동기 문장 재료",resume_phrases:"자소서에 넣기 좋은 표현",interview_questions:"면접 예상 질문",company_job_summary:"기업·직무 이해 요약",target_company_job:"연결 기업·직무",matching_keywords:"매칭 키워드",application_question:"활용 문항",cover_letter_draft:"자기소개서 초안",revision_points:"보완 포인트"};
export const newEntry=():Entry=>({id:crypto.randomUUID(),selected:true,fields:{}});
export function validateWorkspace(raw:unknown){
 const x=raw as {version?:number;companies?:Entry[];experiences?:Entry[];outputs?:Output[]};
 if(!x||x.version!==1||!Array.isArray(x.companies)||!Array.isArray(x.experiences)||!Array.isArray(x.outputs))throw Error("커리어캐쳐에서 저장한 작업 파일을 선택하세요.");
 function entries(rows:Entry[],allowed:string[]){if(rows.length>100)throw Error("한 파일에 최대 100개 항목을 불러올 수 있습니다.");return rows.map(row=>{if(!row||typeof row.fields!=="object"||!row.fields||Array.isArray(row.fields))throw Error("입력 데이터 형식이 올바르지 않습니다.");const fields:Record<string,string>={};for(const k of allowed){const v=row.fields[k];if(v!==undefined){if(typeof v!=="string"||v.length>20000)throw Error("입력 항목이 너무 길거나 형식이 올바르지 않습니다.");fields[k]=v;}}return {id:crypto.randomUUID(),selected:row.selected===true,fields};});}
 const companies=entries(x.companies,companyFields),experiences=entries(x.experiences,experienceFields);
 if(x.outputs.length>500)throw Error("저장된 결과가 너무 많습니다.");
 const outputs=x.outputs.map(row=>{if(!row||!["company","letter"].includes(row.kind)||typeof row.title!=="string"||typeof row.time!=="string")throw Error("결과 형식이 올바르지 않습니다.");const data:Record<string,string|string[]>={};if(row.data){for(const [k,v] of Object.entries(row.data)){if(!(k in labels)||!(typeof v==="string"||(Array.isArray(v)&&v.every(z=>typeof z==="string"))))throw Error("결과 항목 형식이 올바르지 않습니다.");data[k]=v;}}return {id:crypto.randomUUID(),kind:row.kind,title:row.title,time:row.time,...(row.error?{error:String(row.error)}:{data})};});
 return {companies,experiences,outputs};
}
export function outputText(output:Output){return output.title+"\n"+output.time+"\n\n"+(output.error||Object.entries(output.data||{}).map(([key,value])=>(labels[key]||key)+"\n"+(Array.isArray(value)?value.join("\n"):value)).join("\n\n"));}
