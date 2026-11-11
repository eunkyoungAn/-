// 첨부 파일에서 글자 읽기.
// TXT·MD, 워드(DOCX), 한글(HWPX), 글자가 들어 있는 PDF는 브라우저 안에서 읽고 어디에도 보내지 않는다.
// 사진(JPG·PNG 등)과 스캔한 PDF는 참여자가 동의하면 본인 Gemini로 보내 글자를 읽는다(files.js가 아니라 gemini.js가 보냄).

const VENDOR = new URL('./vendor/pdfjs/', import.meta.url).href;
export const MAX_BYTES = 15 * 1024 * 1024;
export const ACCEPT = '.txt,.md,.docx,.hwpx,.pdf,.jpg,.jpeg,.png,.webp,.heic,text/plain,application/pdf,image/*';

export class FileReadError extends Error {}

export function kindOf(file) {
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';
  if (['txt', 'md', 'csv'].includes(ext) || file.type.startsWith('text/')) return 'text';
  if (ext === 'docx') return 'docx';
  if (ext === 'hwpx') return 'hwpx';
  if (ext === 'hwp') return 'hwp';
  if (ext === 'doc') return 'doc';
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext)) return 'image';
  return 'unknown';
}

// 결과: { text, needsAI }  needsAI=true면 기기 안에서 글자를 못 읽어 Gemini로 읽어야 한다.
export async function readLocal(file) {
  if (file.size > MAX_BYTES) throw new FileReadError('파일이 너무 커요(15MB까지). 필요한 쪽만 남겨 다시 저장해 주세요.');
  const kind = kindOf(file);
  if (kind === 'text') return { text: decodeText(await file.arrayBuffer()), needsAI: false };
  if (kind === 'docx') return { text: await readDocx(file), needsAI: false };
  if (kind === 'hwpx') return { text: await readHwpx(file), needsAI: false };
  if (kind === 'pdf') {
    const text = await readPdf(file);
    // 글자가 거의 없으면 스캔본으로 보고 AI 읽기를 권한다.
    return { text, needsAI: text.replace(/\s/g, '').length < 50 };
  }
  if (kind === 'image') return { text: '', needsAI: true };
  if (kind === 'hwp') throw new FileReadError('한글(HWP) 파일은 바로 읽을 수 없어요. 한글에서 "다른 이름으로 저장"으로 HWPX나 PDF로 저장해 올려 주세요.');
  if (kind === 'doc') throw new FileReadError('옛 워드(DOC) 파일은 바로 읽을 수 없어요. 워드에서 DOCX나 PDF로 저장해 올려 주세요.');
  throw new FileReadError('읽을 수 없는 파일 형식이에요. TXT, 워드(DOCX), 한글(HWPX), PDF, 사진 파일을 올려 주세요.');
}

// UTF-8로 읽고, 깨지면 EUC-KR(옛 메모장 파일)로 다시 읽는다.
function decodeText(buf) {
  const utf = new TextDecoder('utf-8').decode(buf);
  const bad = (utf.match(/�/g) || []).length;
  if (bad > 3) {
    try { return new TextDecoder('euc-kr').decode(buf); } catch { /* 지원 안 함 */ }
  }
  return utf.replace(/^﻿/, '');
}

// ---------- ZIP(DOCX·HWPX) ----------
async function unzip(file, wanted) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const dv = new DataView(buf.buffer);
  // 끝에서 중앙 디렉터리 끝 레코드(0x06054b50)를 찾는다.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new FileReadError('파일이 손상됐거나 암호가 걸려 있어요. 다시 저장해 올려 주세요.');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const out = [];
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (!wanted(name)) continue;
    const lNameLen = dv.getUint16(local + 26, true);
    const lExtraLen = dv.getUint16(local + 28, true);
    const start = local + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(start, start + csize);
    let bytes;
    if (method === 0) bytes = data;
    else if (method === 8) {
      if (typeof DecompressionStream === 'undefined') throw new FileReadError('이 브라우저는 압축 파일을 풀 수 없어요. 최신 Chrome이나 Safari에서 열어 주세요.');
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } else continue;
    out.push({ name, xml: dec.decode(bytes) });
  }
  return out;
}

function xmlText(xml, paraTag, textTag, extra = {}) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const paras = doc.getElementsByTagName(paraTag);
  const lines = [];
  for (const para of paras) {
    let line = '';
    const walk = node => {
      for (const ch of node.childNodes) {
        if (ch.nodeType !== 1) continue;
        if (ch.nodeName === textTag) line += ch.textContent;
        else if (extra[ch.nodeName]) line += extra[ch.nodeName];
        else if (ch.nodeName !== paraTag) walk(ch); // 표 안의 문단은 따로 센다
      }
    };
    walk(para);
    lines.push(line);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function readDocx(file) {
  const parts = await unzip(file, n => n === 'word/document.xml');
  if (!parts.length) throw new FileReadError('워드 문서 내용을 찾지 못했어요.');
  return xmlText(parts[0].xml, 'w:p', 'w:t', { 'w:tab': '\t', 'w:br': '\n' });
}

async function readHwpx(file) {
  const parts = await unzip(file, n => /^Contents\/section\d+\.xml$/i.test(n));
  if (!parts.length) throw new FileReadError('한글 문서 내용을 찾지 못했어요.');
  parts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return parts.map(p => xmlText(p.xml, 'hp:p', 'hp:t', { 'hp:tab': '\t', 'hp:lineBreak': '\n' })).join('\n\n').trim();
}

// ---------- PDF ----------
let pdfjs = null;
async function readPdf(file) {
  if (!pdfjs) {
    pdfjs = await import(VENDOR + 'pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = VENDOR + 'pdf.worker.min.mjs';
  }
  let doc;
  let task;
  try {
    task = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      cMapUrl: VENDOR + 'cmaps/', cMapPacked: true, isEvalSupported: false, disableFontFace: true,
    });
    doc = await task.promise;
  } catch (e) {
    if (e && e.name === 'PasswordException') throw new FileReadError('암호가 걸린 PDF예요. 암호를 풀고 다시 저장해 올려 주세요.');
    throw new FileReadError('PDF를 열지 못했어요. 파일이 손상되지 않았는지 확인해 주세요.');
  }
  const pages = [];
  for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    let s = '';
    for (const it of tc.items) { s += it.str; if (it.hasEOL) s += '\n'; }
    pages.push(s.trim());
  }
  try { await task.destroy(); } catch { /* 정리 실패는 무시 */ }
  return pages.join('\n\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export async function toBase64(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function mimeOf(file) {
  if (file.type) return file.type;
  const k = kindOf(file);
  return k === 'pdf' ? 'application/pdf' : 'image/jpeg';
}
