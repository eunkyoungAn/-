export const API_ROOT="https://generativelanguage.googleapis.com/v1beta";
export class ApiError extends Error { constructor(message,status=0){super(message);this.status=status;} }
export function apiError(status){return new ApiError(status===429?"Gemini 사용량 또는 요청 속도 한도에 도달했습니다. 잠시 후 선택 항목을 줄여 다시 실행하세요.":status===401||status===403||status===400?"API 키 또는 요청을 확인해 주세요. Google AI Studio에서 키의 사용 가능 여부와 제한 설정을 확인할 수 있습니다.":status===404?"이 모델을 사용할 수 없습니다. API 키를 다시 연결하고 다른 모델을 선택하세요.":status>=500?"Gemini 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 실행하세요.":"요청에 실패했습니다. 인터넷 연결과 API 키를 확인하세요.",status);}
async function request(url,key,options={},signal,timeoutMs=90000){
 const controller=new AbortController();const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{const response=await fetch(url,{...options,headers:{"Content-Type":"application/json","x-goog-api-key":key},signal:controller.signal,cache:"no-store"});if(!response.ok)throw apiError(response.status);return await response.json();}
 catch(e){if(signal?.aborted)throw new DOMException("중지됨","AbortError");if(e.name==="AbortError")throw new ApiError("응답 시간이 초과되었습니다. 다시 실행해 주세요.");if(e instanceof ApiError)throw e;throw new ApiError("연결할 수 없습니다. 인터넷 연결 또는 브라우저의 네트워크 제한을 확인해 주세요.");}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export async function listModels(key,signal){let token="",models=[];do{const data=await request(API_ROOT+"/models?pageSize=1000"+(token?"&pageToken="+encodeURIComponent(token):""),key,{},signal,12000);models.push(...(data.models||[]).filter(m=>m.name?.startsWith("models/gemini")&&m.supportedGenerationMethods?.includes("generateContent")&&!/image|tts|robotics|computer|embedding/i.test(m.name)));token=data.nextPageToken||"";}while(token);if(!models.length)throw new ApiError("사용 가능한 텍스트 생성 모델이 없습니다.");return models;}
export const COMPANY_KEYS=["job_keywords","required_competencies","experience_connection_points","motivation_materials","resume_phrases","interview_questions","company_job_summary"];
export const LETTER_KEYS=["target_company_job","matching_keywords","application_question","cover_letter_draft","revision_points"];
export function parseResult(data,kind){
 const candidate=data.candidates?.[0];
 if(!candidate||candidate.finishReason&&candidate.finishReason!=="STOP")throw new ApiError("완전한 결과를 받지 못했습니다. 내용을 확인하고 다시 실행해 주세요.");
 const text=(candidate.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||"").join("").replace(/^\`\`\`(?:json)?\s*/i,"").replace(/\`\`\`\s*$/,"").trim();
 let result;try{result=JSON.parse(text)}catch{throw new ApiError("결과 형식을 읽지 못했습니다. 다시 실행해 주세요.");}
 const keys=kind==="company"?COMPANY_KEYS:LETTER_KEYS;
 if(!result||keys.some(k=>!(k in result)))throw new ApiError("결과 일부가 누락되었습니다. 다시 실행해 주세요.");
 for(const k of keys){const array=kind==="company"||["matching_keywords","revision_points"].includes(k);if(array?(!Array.isArray(result[k])||!result[k].length||result[k].some(v=>typeof v!=="string")):typeof result[k]!=="string")throw new ApiError("응답 항목의 형식이 올바르지 않습니다. 다시 실행해 주세요.");}
 if(kind==="letter"&&!result.cover_letter_draft.trim())throw new ApiError("초안 내용이 비어 있습니다.");
 return Object.fromEntries(keys.map(k=>[k,result[k]]));
}
export async function generate(key,model,prompt,kind,signal){if(!/^models\/gemini[a-zA-Z0-9._-]+$/.test(model))throw new ApiError("유효한 모델을 선택하세요.");const data=await request(API_ROOT+"/"+model+":generateContent",key,{method:"POST",body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:0.35,maxOutputTokens:8192,responseMimeType:"application/json"}})},signal);return parseResult(data,kind);}
export function pause(ms,signal){return new Promise((resolve,reject)=>{if(signal.aborted)return reject(new DOMException("중지됨","AbortError"));const abort=()=>{clearTimeout(t);reject(new DOMException("중지됨","AbortError"));};const t=setTimeout(()=>{signal.removeEventListener("abort",abort);resolve();},ms);signal.addEventListener("abort",abort,{once:true});});}
