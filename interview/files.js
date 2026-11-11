// 첨부 파일에서 글자 읽기.
// TXT·MD, 워드(DOCX·DOC), 한글(HWPX·HWP), 글자가 들어 있는 PDF는 브라우저 안에서 읽고 어디에도 보내지 않는다.
// 사진(JPG·PNG 등)과 스캔한 PDF는 참여자가 동의하면 본인 Gemini로 보내 글자를 읽는다(files.js가 아니라 gemini.js가 보냄).

const VENDOR = new URL('./vendor/pdfjs/', import.meta.url).href;
export const MAX_BYTES = 15 * 1024 * 1024;
export const ACCEPT = '.txt,.md,.docx,.doc,.hwpx,.hwp,.pdf,.jpg,.jpeg,.png,.webp,.heic,text/plain,application/pdf,application/msword,image/*';

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
  if (['docx', 'hwpx', 'hwp', 'doc'].includes(kind)) {
    try { return { text: await readOffice(file), needsAI: false }; }
    catch (e) { throw e instanceof FileReadError ? e : new FileReadError('파일이 손상됐거나 읽을 수 없는 형식이에요. 한글·워드에서 다시 저장하거나 PDF로 저장해 올려 주세요.'); }
  }
  if (kind === 'pdf') {
    const text = await readPdf(file);
    // 글자가 거의 없으면 스캔본으로 보고 AI 읽기를 권한다.
    return { text, needsAI: text.replace(/\s/g, '').length < 50 };
  }
  if (kind === 'image') return { text: '', needsAI: true };
  throw new FileReadError('읽을 수 없는 파일 형식이에요. 한글(HWP·HWPX), 워드(DOC·DOCX), PDF, TXT, 사진 파일을 올려 주세요.');
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

// 확장자보다 파일 속 서명을 믿는다(.hwp인데 실제로는 HWPX인 경우 등).
async function readOffice(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf[0] === 0x50 && buf[1] === 0x4b) { // PK: ZIP 묶음(DOCX·HWPX)
    const names = zipNames(buf);
    if (names.includes('word/document.xml')) return readDocx(buf);
    if (names.some(n => /^Contents\/section\d+\.xml$/i.test(n))) return readHwpx(buf);
    throw new FileReadError('문서 내용을 찾지 못했어요. 한글·워드에서 다시 저장해 올려 주세요.');
  }
  if (buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) { // OLE 묶음(HWP·DOC)
    const cfb = readCfb(buf);
    if (cfb.has('FileHeader')) return readHwp(cfb);
    if (cfb.has('WordDocument')) return readDoc(cfb);
    throw new FileReadError('한글·워드 문서가 아닌 것 같아요.');
  }
  const head = new TextDecoder().decode(buf.subarray(0, 200)).trim().toLowerCase();
  if (head.startsWith('<')) { // 웹페이지 형식으로 저장된 .doc
    return new DOMParser().parseFromString(decodeText(buf.buffer), 'text/html').body.innerText.trim();
  }
  if (head.startsWith('{\\rtf')) throw new FileReadError('RTF 형식 문서예요. 워드에서 DOCX나 PDF로 저장해 올려 주세요.');
  throw new FileReadError('파일이 손상됐거나 지원하지 않는 형식이에요.');
}

// ---------- ZIP(DOCX·HWPX) ----------
function zipNames(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const names = [];
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (dv.getUint32(i, true) !== 0x06054b50) continue;
    let p = dv.getUint32(i + 16, true);
    const count = dv.getUint16(i + 10, true);
    const dec = new TextDecoder();
    for (let n = 0; n < count && dv.getUint32(p, true) === 0x02014b50; n++) {
      const nameLen = dv.getUint16(p + 28, true);
      names.push(dec.decode(buf.subarray(p + 46, p + 46 + nameLen)));
      p += 46 + nameLen + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
    }
    break;
  }
  return names;
}

async function unzip(buf, wanted) {
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
      bytes = await inflateRaw(data);
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

async function readDocx(buf) {
  const parts = await unzip(buf, n => n === 'word/document.xml');
  if (!parts.length) throw new FileReadError('워드 문서 내용을 찾지 못했어요.');
  return xmlText(parts[0].xml, 'w:p', 'w:t', { 'w:tab': '\t', 'w:br': '\n' });
}

async function readHwpx(buf) {
  const parts = await unzip(buf, n => /^Contents\/section\d+\.xml$/i.test(n));
  if (!parts.length) throw new FileReadError('한글 문서 내용을 찾지 못했어요.');
  parts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return parts.map(p => xmlText(p.xml, 'hp:p', 'hp:t', { 'hp:tab': '\t', 'hp:lineBreak': '\n' })).join('\n\n').trim();
}

async function inflateRaw(data) {
  if (typeof DecompressionStream === 'undefined') throw new FileReadError('이 브라우저는 압축된 문서를 풀 수 없어요. 최신 Chrome이나 Safari에서 열어 주세요.');
  // HWP 본문은 압축 데이터 뒤에 여분 바이트가 붙는 경우가 있다. Chrome은 이를 오류로 보므로
  // 오류가 나도 그때까지 풀린 내용은 그대로 쓴다.
  const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
  } catch (e) {
    if (!total) throw new FileReadError('압축된 문서 내용을 풀지 못했어요. 다시 저장해 올려 주세요.');
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

// ---------- OLE 복합 문서(HWP·DOC 공통 상자) ----------
// 파일을 512바이트(또는 4096바이트) 칸으로 나눠 FAT라는 연결표로 이어 붙이는 형식.
const END = 0xfffffffa;
function readCfb(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const secSize = 1 << dv.getUint16(30, true);
  const miniSize = 1 << dv.getUint16(32, true);
  const dirStart = dv.getUint32(48, true);
  const miniCutoff = dv.getUint32(56, true);
  const miniFatStart = dv.getUint32(60, true);
  const secOff = sec => (sec + 1) * secSize;
  const u32 = (o) => (o + 4 <= buf.length ? dv.getUint32(o, true) : END);

  // FAT 위치표(DIFAT): 머리말의 109칸 + 이어지는 DIFAT 칸
  const fatSecs = [];
  for (let i = 0; i < 109; i++) { const sec = u32(76 + i * 4); if (sec < END) fatSecs.push(sec); }
  let d = dv.getUint32(68, true);
  for (let k = 0, n = dv.getUint32(72, true); k < n && d < END; k++) {
    for (let i = 0; i < secSize / 4 - 1; i++) { const sec = u32(secOff(d) + i * 4); if (sec < END) fatSecs.push(sec); }
    d = u32(secOff(d) + secSize - 4);
  }
  const per = secSize / 4;
  const fat = new Uint32Array(fatSecs.length * per);
  fatSecs.forEach((sec, i) => { for (let j = 0; j < per; j++) fat[i * per + j] = u32(secOff(sec) + j * 4); });

  const chain = (start, table) => {
    const out = [];
    const seen = new Set();
    for (let sec = start; sec < END && sec < table.length && !seen.has(sec); sec = table[sec]) { seen.add(sec); out.push(sec); }
    return out;
  };
  const readBig = (start, size) => {
    const secs = chain(start, fat);
    const out = new Uint8Array(secs.length * secSize);
    secs.forEach((sec, i) => out.set(buf.subarray(secOff(sec), secOff(sec) + secSize), i * secSize));
    return size == null ? out : out.subarray(0, size);
  };

  // 디렉터리: 128바이트마다 이름·종류·형제·자식·시작 칸·크기
  const dir = readBig(dirStart);
  const ddv = new DataView(dir.buffer, dir.byteOffset, dir.byteLength);
  const u16le = new TextDecoder('utf-16le');
  const entries = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) {
    const nameLen = ddv.getUint16(o + 64, true);
    entries.push({
      name: u16le.decode(dir.subarray(o, o + Math.max(0, Math.min(64, nameLen) - 2))),
      type: dir[o + 66], left: ddv.getUint32(o + 68, true), right: ddv.getUint32(o + 72, true),
      child: ddv.getUint32(o + 76, true), start: ddv.getUint32(o + 116, true), size: ddv.getUint32(o + 120, true),
    });
  }
  if (!entries.length) throw new FileReadError('문서 구조를 읽지 못했어요.');
  const root = entries[0];
  const miniStream = root.start < END ? readBig(root.start, root.size) : new Uint8Array(0);
  let miniFat = new Uint32Array(0);
  if (miniFatStart < END) {
    const b = readBig(miniFatStart);
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    miniFat = new Uint32Array(b.length / 4);
    for (let i = 0; i < miniFat.length; i++) miniFat[i] = v.getUint32(i * 4, true);
  }
  const readMini = (start, size) => {
    const secs = chain(start, miniFat);
    const out = new Uint8Array(secs.length * miniSize);
    secs.forEach((sec, i) => out.set(miniStream.subarray(sec * miniSize, (sec + 1) * miniSize), i * miniSize));
    return out.subarray(0, size);
  };

  // 폴더(storage)·파일(stream) 경로 만들기
  const paths = new Map();
  const visited = new Set();
  const walk = (idx, prefix) => {
    if (idx >= END || idx >= entries.length || visited.has(idx)) return;
    visited.add(idx);
    const e = entries[idx];
    walk(e.left, prefix);
    walk(e.right, prefix);
    if (e.type === 2) paths.set(prefix + e.name, e);
    else if (e.type === 1) walk(e.child, prefix + e.name + '/');
  };
  walk(root.child, '');
  return {
    names: [...paths.keys()],
    has: name => paths.has(name),
    get(name) {
      const e = paths.get(name);
      if (!e) return null;
      return e.size < miniCutoff ? readMini(e.start, e.size) : readBig(e.start, e.size);
    },
  };
}

// ---------- 한글 HWP(5.0) ----------
// FileHeader의 속성값으로 압축·암호·배포용 여부를 보고, BodyText/Section0..N의 문단 글자(HWPTAG_PARA_TEXT)만 모은다.
async function readHwp(cfb) {
  const header = cfb.get('FileHeader');
  const props = new DataView(header.buffer, header.byteOffset, header.byteLength).getUint32(36, true);
  if (props & 0x2) throw new FileReadError('암호가 걸린 한글 파일이에요. 한글에서 암호를 풀고 다시 저장해 올려 주세요.');
  const compressed = props & 0x1;
  const distribution = props & 0x4; // 배포용 문서는 본문이 잠겨 있어 미리보기 글만 읽을 수 있다
  const sections = cfb.names.filter(n => /^BodyText\/Section\d+$/.test(n))
    .sort((a, b) => Number(a.match(/\d+$/)[0]) - Number(b.match(/\d+$/)[0]));
  let text = '';
  if (!distribution) {
    for (const name of sections) {
      let data = cfb.get(name);
      if (compressed) data = await inflateRaw(data);
      text += hwpSectionText(data) + '\n\n';
    }
  }
  if (!text.trim()) {
    const prv = cfb.get('PrvText');
    // 미리보기 글은 표 칸을 <칸 내용>으로 표시하므로 괄호를 걷어 낸다.
    if (prv) text = new TextDecoder('utf-16le').decode(prv).replace(/\0/g, '').replace(/\r/g, '').replace(/<([^<>]*)>/g, '$1 ').replace(/[ \t]+\n/g, '\n');
    if (distribution && text.trim()) text += '\n\n(배포용 문서라 앞부분 미리보기 글만 읽었어요. 전체를 쓰려면 한글에서 PDF로 저장해 올려 주세요.)';
  }
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

const HWPTAG_PARA_TEXT = 67; // HWPTAG_BEGIN(16) + 51
function hwpSectionText(data) {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const paras = [];
  let p = 0;
  while (p + 4 <= data.length) {
    const h = dv.getUint32(p, true);
    p += 4;
    const tag = h & 0x3ff;
    let size = (h >>> 20) & 0xfff;
    if (size === 0xfff) { size = dv.getUint32(p, true); p += 4; }
    if (tag === HWPTAG_PARA_TEXT) paras.push(hwpParaText(data.subarray(p, p + size)));
    p += size;
  }
  return paras.join('\n');
}

// 문단 글자는 UTF-16. 32 미만 값은 제어 문자로, 1글자짜리와 8글자 길이(표·그림 등 개체 자리)짜리가 있다.
const ONE_CHAR_CTRL = new Set([0, 10, 13, 24, 25, 26, 27, 28, 29, 30, 31]);
function hwpParaText(b) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let s = '';
  for (let i = 0; i + 1 < b.length;) {
    const c = dv.getUint16(i, true);
    if (c >= 32) { s += String.fromCharCode(c); i += 2; continue; }
    if (ONE_CHAR_CTRL.has(c)) { if (c === 10) s += '\n'; else if (c === 30 || c === 31) s += ' '; i += 2; continue; }
    if (c === 9) s += '\t';
    i += 16;
  }
  return s;
}

// ---------- 옛 워드 DOC(97~2003) ----------
// WordDocument 머리말(FIB)에서 조각표(CLX) 위치를 찾아, 조각마다 글자를 이어 붙인다.
function readDoc(cfb) {
  const wd = cfb.get('WordDocument');
  const dv = new DataView(wd.buffer, wd.byteOffset, wd.byteLength);
  const flags = dv.getUint16(0x0a, true);
  if (flags & 0x0100) throw new FileReadError('암호가 걸린 워드 파일이에요. 워드에서 암호를 풀고 다시 저장해 올려 주세요.');
  const table = cfb.get(flags & 0x0200 ? '1Table' : '0Table');
  if (!table) throw new FileReadError('워드 문서 내용을 찾지 못했어요.');
  const fcClx = dv.getUint32(0x01a2, true);
  const lcbClx = dv.getUint32(0x01a6, true);
  const clx = table.subarray(fcClx, fcClx + lcbClx);
  const cv = new DataView(clx.buffer, clx.byteOffset, clx.byteLength);
  let i = 0;
  while (i < clx.length && clx[i] === 0x01) i += 3 + cv.getUint16(i + 1, true); // 서식 정보(Prc) 건너뛰기
  if (clx[i] !== 0x02) throw new FileReadError('워드 문서 구조를 읽지 못했어요. DOCX나 PDF로 저장해 올려 주세요.');
  const lcb = cv.getUint32(i + 1, true);
  const plc = clx.subarray(i + 5, i + 5 + lcb);
  const pv = new DataView(plc.buffer, plc.byteOffset, plc.byteLength);
  const n = (lcb - 4) / 12;
  const u16le = new TextDecoder('utf-16le');
  const latin = new TextDecoder('windows-1252');
  let text = '';
  for (let k = 0; k < n; k++) {
    const len = pv.getUint32((k + 1) * 4, true) - pv.getUint32(k * 4, true);
    const raw = pv.getUint32((n + 1) * 4 + k * 8 + 2, true);
    if (raw & 0x40000000) { const fc = (raw & 0x3fffffff) / 2; text += latin.decode(wd.subarray(fc, fc + len)); }
    else text += u16le.decode(wd.subarray(raw, raw + len * 2));
  }
  return text
    .replace(/\x13[^\x13\x14\x15]*\x14/g, '') // 필드 코드(수식·하이퍼링크 명령)는 버리고 결과 글만 남긴다
    .replace(/\x13[^\x13\x14\x15]*\x15/g, '')
    .replace(/[\x14\x15]/g, '')
    .replace(/\x07\x07/g, '\n') // 표: 칸 끝 두 번 = 줄 끝
    .replace(/\x07/g, '\t')
    .replace(/[\r\x0b\x0c]/g, '\n')
    .replace(/[\x00-\x08\x0e-\x1f]/g, '')
    .replace(/\t\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
