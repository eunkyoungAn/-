export async function mailEndpoint(){
 try{const r=await fetch("./mail-config.json",{cache:"no-store"});if(!r.ok)return "";const c=(await r.json()) as {mailEndpoint?:string};const u=String(c.mailEndpoint||"").trim();return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u)?u:"";}catch{return "";}
}
export async function sendMail(to:string,subject:string,body:string){
 const url=await mailEndpoint();
 if(!url)throw Error("메일 발송이 아직 설정되지 않았습니다. 관리자가 mail-config.json에 웹앱 주소를 입력해야 합니다.");
 let res:Response;
 try{res=await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({to,subject,body})});}catch{throw Error("메일 서버에 연결하지 못했습니다. 인터넷 연결과 웹앱 배포 설정을 확인하세요.");}
 let data:{ok?:boolean;error?:string}={};
 try{data=await res.json();}catch{throw Error("메일 서버 응답을 확인하지 못했습니다. 웹앱 액세스가 '모든 사용자'인지 확인하세요.");}
 if(!data.ok)throw Error(data.error||"메일 발송에 실패했습니다.");
}
