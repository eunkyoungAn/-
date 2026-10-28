const fs=require("fs");const D="/home/user/-/office/20261024_포트폴리오빌더/";
const src=fs.readFileSync(D+"06_final_seo.md","utf8");
const title=src.match(/^제목:\s*(.+)$/m)[1].trim();
const tags=src.match(/^태그\(네이버 태그 칸\):\s*(#.+)$/m)[1].trim();
const L=src.split("\n");const ix=L.map((x,i)=>x.trim()==="====="?i:-1).filter(i=>i>=0);
let body=L.slice(ix[0]+1,ix[1]);
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const P="margin:0 0 4px;font-size:16px;line-height:1.8;color:#222";
let out=[],para=[],box=null;
const flush=()=>{if(para.length){out.push(`<p style="${P};margin-bottom:22px">${para.join("<br>")}</p>`);para=[]}};
for(let i=0;i<body.length;i++){let l=body[i].trimEnd();
 if(l.startsWith("[이 글에서")){flush();box=[esc(l.replace(/^\[|\]$/g,""))];while(body[i+1]&&body[i+1].trim()){box.push(esc(body[++i].trim()))}out.push(`<div style="margin:6px 0 26px;padding:18px 20px;border:2px solid #F0564A;border-radius:12px;background:#FFF5F3;font-size:15px;line-height:1.8;color:#222"><b style="color:#F0564A">${box[0]}</b><br>${box.slice(1).join("<br>")}</div>`);box=null;continue}
 if(l.startsWith("┌")){flush();box=[esc(l.slice(1).trim())];continue}
 if(box){ if(l.startsWith("└")){out.push(`<div style="margin:6px 0 26px;padding:18px 20px;border:2px solid #F0564A;border-radius:12px;background:#FFF5F3;font-size:15px;line-height:1.8;color:#222"><b style="color:#F0564A">${box[0]}</b><br>${box.slice(1).join("<br>")}</div>`);box=null}else box.push(esc(l));continue}
 if(!l.trim()||/^[─―]{5,}$/.test(l)){flush();continue}
 if(l.startsWith("부제:")){flush();out.push(`<p style="font-size:18px;font-weight:800;color:#F0564A;margin:0 0 18px">${esc(l.slice(3).trim())}</p>`);continue}
 if(l.startsWith("📷")){flush();const m=l.match(/\[사진(\d+)[^:]*:\s*(.+?)(?:\s*[—-]\s*images\/\d+\.png)?\]/);const n=m?m[1]:"?";let cap="";if(body[i+1]&&body[i+1].startsWith("(")){cap=body[++i].replace(/^\(/,"").replace(/\)$/,"")}
  out.push(`<div class="ph" style="border:2px dashed #F0564A;border-radius:12px;background:#FDECEA;padding:18px 20px;margin:8px 0 26px;text-align:center;color:#222;font-size:15px;line-height:1.6"><b style="color:#F0564A;font-size:17px">📷 사진${n} · img${n}.png</b><br>${esc(m?m[2]:l)}${cap?"<br><span style=\"color:#6B6B6B\">"+esc(cap)+"</span>":""}</div>`);continue}
 if(l.startsWith("■ ")){flush();out.push(`<h3 style="font-size:20px;font-weight:800;color:#111;margin:36px 0 14px;padding-left:12px;border-left:5px solid #F0564A">${esc(l.slice(2))}</h3>`);continue}
 if(l.startsWith("커리어캐쳐(CareerCatcher) 안은경 |")){flush();out.push(`<div style="margin:30px 0;padding:22px;border-top:2px solid #F0564A;border-bottom:2px solid #F0564A;text-align:center;font-size:15px;line-height:1.8;color:#444"><b style="font-size:18px;color:#F0564A">커리어캐쳐(CareerCatcher) 안은경</b><br>AI 자기소개서 · AI면접 · 진로 코칭<br>카톡 문의: https://open.kakao.com/o/gxIxJ3Si<br>메일: dms5147@gmail.com</div>`);i+=2;continue}
 let h=esc(l);
 if(/^Q\./.test(l)||l==="출처")h="<b>"+h+"</b>";
 if(/^※/.test(l))h=`<span style="color:#F0564A;font-weight:700">${h}</span>`;
 para.push(h)}
flush();
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>포트폴리오 빌더 블로그</title><style>
:root{--red:#F0564A;--ink:#16171B;--muted:#6B6B6B;--page:#EDEDF0;--panel:#FFFFFF;--bar:#FFFFFFEE;--line:#DDDDE2}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ink:#EDEDF0;--muted:#A0A0A8;--page:#18181B;--panel:#26262B;--bar:#202024EE;--line:#3A3A40}}
:root[data-theme="dark"]{--ink:#EDEDF0;--muted:#A0A0A8;--page:#18181B;--panel:#26262B;--bar:#202024EE;--line:#3A3A40}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--page);color:var(--ink);font-family:Pretendard,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;overflow-x:hidden}
.bar{position:sticky;top:0;z-index:2;background:var(--bar);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center}
button{font:inherit;font-weight:700;font-size:15px;border-radius:10px;padding:10px 16px;cursor:pointer;border:2px solid var(--red);background:transparent;color:var(--red)}
button.main{background:var(--red);color:#fff}
#msg{width:100%;text-align:center;font-size:13px;color:var(--muted);min-height:18px}
.info{max-width:693px;margin:18px auto 8px;padding:0 16px;font-size:13px;color:var(--muted)}
.info b{color:var(--ink)}
.wrap{max-width:693px;margin:0 auto 60px;padding:0 16px}
.ttl{background:var(--panel);border:1px solid var(--line);border-radius:12px 12px 0 0;padding:20px;font-size:22px;font-weight:800;line-height:1.45;color:var(--ink)}
#post{background:#fff;color:#222;border:1px solid var(--line);border-top:0;border-radius:0 0 12px 12px;padding:28px 22px;word-break:keep-all;overflow-wrap:anywhere}
.tags{margin-top:14px;font-size:13px;color:var(--muted);line-height:1.7}
@media (max-width:480px){#post{padding:20px 14px}.ttl{font-size:19px}button{flex:1 1 100%}}
</style></head><body>
<div class="bar"><button class="main" id="bHtml">본문 서식 포함 복사</button><button id="bTitle">제목 복사</button><button id="bTags">태그 복사</button><div id="msg" role="status"></div></div>
<div class="info">네이버 본문폭(약 693px) 미리보기 · 📷 박스 자리에 <b>blog_images/img1~6.png</b>를 넣으세요.</div>
<div class="wrap"><div class="ttl" id="title">${esc(title)}</div>
<div id="post">${out.join('\n')}</div>
<div class="tags">태그: <span id="tags">${esc(tags)}</span></div></div>
<script>
const msg=t=>{document.getElementById('msg').textContent=t};
function fallback(node,text){const s=getSelection();s.removeAllRanges();let ok=false;
 if(node){const r=document.createRange();r.selectNodeContents(node);s.addRange(r);try{ok=document.execCommand('copy')}catch(e){}s.removeAllRanges();return ok}
 const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok}
async function copyHtml(){const n=document.getElementById('post'),h=n.innerHTML,t=n.innerText;
 try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([h],{type:'text/html'}),'text/plain':new Blob([t],{type:'text/plain'})})]);msg('본문을 서식과 함께 복사했습니다. 네이버 편집기에 붙여넣으세요.')}
 catch(e){msg(fallback(n)?'본문을 복사했습니다.':'복사에 실패했습니다. 본문을 직접 선택해 복사해 주세요.')}}
async function copyText(id,label){const t=document.getElementById(id).textContent;
 try{await navigator.clipboard.writeText(t);msg(label+'을(를) 복사했습니다.')}catch(e){msg(fallback(null,t)?label+'을(를) 복사했습니다.':'복사에 실패했습니다.')}}
bHtml.onclick=copyHtml;bTitle.onclick=()=>copyText('title','제목');bTags.onclick=()=>copyText('tags','태그');
</script></body></html>`;
fs.writeFileSync(D+'blog_naver.html',html);
const frag=html.replace(/<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport"[^>]*>/,'<meta name="claude:viewport-fit-sides" content="cover">').replace('</head><body>','').replace('</body></html>','').replace('.bar{position:sticky;top:0;','.bar{position:sticky;top:env(safe-area-inset-top,0px);').replace('padding:12px 16px;display:flex','padding:12px max(16px,env(safe-area-inset-left,0px));display:flex').replace('.info{max-width:693px;margin:18px auto 8px;padding:0 16px','.info{max-width:693px;margin:18px auto 8px;padding:0 max(16px,env(safe-area-inset-left,0px))').replace('.wrap{max-width:693px;margin:0 auto 60px;padding:0 16px}','.wrap{max-width:693px;margin:0 auto 60px;padding:0 max(16px,env(safe-area-inset-left,0px))}');
fs.writeFileSync(process.env.FRAG||D+'blog_naver.artifact.html',frag);
