// 연습 기록 저장: 이미지(PNG), 글(복사), PDF(인쇄). 모두 이 기기 안에서 만들고 어디에도 보내지 않는다.
import { RUBRIC } from './scoring.js';
import { NV_ITEMS } from './video.js';

const SITE = 'eunkyoungan.github.io/-/interview';

function today() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function scoreLine(first, last) {
  return RUBRIC.map(r => {
    const a = first.result.scores[r.key];
    const b = last.result.scores[r.key];
    if (b == null) return `${r.label} -`;
    return first === last || a == null ? `${r.label} ${b}` : `${r.label} ${a}→${b}`;
  }).join(' · ');
}

function nvLine(first, last) {
  if (!last.nv) return '';
  return '영상 분석(5점) ' + NV_ITEMS.map(r => {
    const b = last.nv.scores[r.key];
    const a = first.nv && first !== last ? first.nv.scores[r.key] : null;
    return b == null ? `${r.label} -` : a == null ? `${r.label} ${b}` : `${r.label} ${a}→${b}`;
  }).join(' · ');
}

// ---------- 글 ----------
export function buildText(log) {
  const lines = [`[커리어캐쳐 면접 리허설] 연습 기록 ${today()}`, ''];
  log.forEach((item, i) => {
    const first = item.attempts[0];
    const last = item.attempts[item.attempts.length - 1];
    const r = last.result;
    lines.push(`${i + 1}. ${item.question.text}`);
    lines.push(`답변 ${item.attempts.length}번 · 점수(5점) ${scoreLine(first, last)}`);
    if (last.nv) lines.push(nvLine(first, last) + ' / ' + NV_ITEMS.map(r => last.nv.reasons[r.key]).join(' / '));
    lines.push(`다음에 고칠 한 가지: ${r.next_fix}`);
    lines.push(`잘한 점: ${r.strength}`);
    lines.push(`고칠 점: ${r.improvement}`);
    lines.push(`바꿔 말하기 예시: ${r.rewrite_example}`);
    lines.push(`마지막 답변: ${last.answer}`);
    lines.push('');
  });
  lines.push('점수는 연습용 참고치이며 합격을 예측하지 않습니다.');
  lines.push(SITE);
  return lines.join('\n');
}

// ---------- 이미지 ----------
const W = 1080;
const PAD = 64;
const FONT = '"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';
const C = { bg: '#f5f6f8', panel: '#ffffff', fg: '#1d2733', muted: '#66717e', line: '#dfe3e8', accent: '#1f5fa8', soft: '#e8f0fa', focus: '#fff7dc', focusLine: '#e2b93b', ok: '#217a4b', warn: '#b4441c' };

function wrap(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text || '').split('\n')) {
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        // 가능하면 띄어쓰기에서 끊는다.
        const cut = line.lastIndexOf(' ');
        if (cut > line.length * 0.5) { out.push(line.slice(0, cut)); line = line.slice(cut + 1) + ch; }
        else { out.push(line); line = ch; }
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

// 그리기 명령을 두 번 돈다: 처음엔 높이만 재고, 두 번째에 실제로 그린다.
function layout(ctx, log, draw) {
  let y = PAD;
  const text = (str, { size = 30, weight = 400, color = C.fg, x = PAD, width = W - PAD * 2, gap = 1.55 } = {}) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const lines = wrap(ctx, str, width);
    lines.forEach(l => { if (draw) { ctx.fillStyle = color; ctx.fillText(l, x, y + size); } y += size * gap; });
  };
  const box = (h, fill, stroke) => {
    if (!draw) return;
    ctx.fillStyle = fill; ctx.strokeStyle = stroke || fill; ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(PAD - 24, y, W - (PAD - 24) * 2, h, 20); else ctx.rect(PAD - 24, y, W - (PAD - 24) * 2, h);
    ctx.fill(); ctx.stroke();
  };

  if (draw) { ctx.fillStyle = C.accent; ctx.fillRect(0, 0, W, 14); }
  text('커리어캐쳐 면접 리허설', { size: 30, weight: 700, color: C.accent });
  text(`면접 연습 기록 · ${today()}`, { size: 52, weight: 800 });
  text(`오늘 ${log.length}개 질문을 연습했어요.`, { size: 28, color: C.muted });
  y += 24;

  log.forEach((item, i) => {
    const first = item.attempts[0];
    const last = item.attempts[item.attempts.length - 1];
    const r = last.result;
    const inner = { x: PAD + 8, width: W - PAD * 2 - 16 };
    // 카드 높이를 먼저 재기 위해 같은 내용을 측정 모드로 한 번 돈다.
    const startY = y;
    const body = () => {
      y += 28;
      text(`질문 ${i + 1}`, { size: 24, weight: 700, color: C.accent, ...inner });
      text(item.question.text, { size: 34, weight: 700, ...inner });
      text(`답변 ${item.attempts.length}번 · ${scoreLine(first, last)}`, { size: 25, color: C.muted, ...inner });
      if (last.nv) text(nvLine(first, last), { size: 25, color: C.muted, ...inner });
      if (last.nv && last.nv.tips.length) text('영상 팁: ' + last.nv.tips.join(' '), { size: 25, color: C.fg, ...inner });
      y += 14;
      text('다음에 고칠 한 가지', { size: 24, weight: 700, color: C.muted, ...inner });
      text(r.next_fix, { size: 32, weight: 700, ...inner });
      y += 10;
      y += 12; text('잘한 점', { size: 24, weight: 700, color: C.muted, ...inner });
      text(r.strength, { size: 28, ...inner });
      y += 12; text('고칠 점', { size: 24, weight: 700, color: C.muted, ...inner });
      text(r.improvement, { size: 28, ...inner });
      y += 12; text('이렇게 바꿔 말해 보세요', { size: 24, weight: 700, color: C.muted, ...inner });
      text(r.rewrite_example, { size: 28, color: C.accent, ...inner });
      y += 12; text('마지막 답변', { size: 24, weight: 700, color: C.muted, ...inner });
      text(last.answer, { size: 26, color: C.fg, ...inner });
      y += 20;
    };
    const wasDraw = draw;
    draw = false; body(); const h = y - startY; y = startY; draw = wasDraw;
    box(h, C.panel, C.line);
    body();
    y += 24;
  });

  text('점수는 연습용 참고치이며 합격을 예측하지 않습니다. [ ] 표시는 본인의 실제 경험으로 채워 주세요.', { size: 22, color: C.muted });
  text(SITE, { size: 22, color: C.muted });
  return y + PAD / 2;
}

export function buildImage(log) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const h = layout(ctx, log, false);
  canvas.width = W;
  canvas.height = Math.ceil(h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, canvas.height);
  ctx.textBaseline = 'alphabetic';
  layout(ctx, log, true);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

export function fileName(ext) {
  return `careercatcher-interview-${today().replace(/\./g, '')}.${ext}`;
}

// 휴대폰에서는 공유 창(사진 저장·카카오톡 나에게 보내기)을, PC에서는 파일 내려받기를 쓴다.
export async function saveImage(log) {
  const blob = await buildImage(log);
  if (!blob) throw new Error('이미지를 만들지 못했어요');
  const file = new File([blob], fileName('png'), { type: 'image/png' });
  const touch = matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: '면접 연습 기록' }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}
