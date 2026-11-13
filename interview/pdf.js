// 피드백 리포트를 PDF 파일로 만든다. 휴대폰 안에서만 처리하고 아무것도 전송하지 않는다.
// 방법: 리포트의 각 덩어리(카드)를 그림으로 바꿔 A4 쪽에 차례로 얹고, 쪽마다 JPEG로 담아 PDF를 직접 쓴다.
// (한글 글꼴을 PDF에 넣지 않아도 화면 그대로 나온다. 대신 글자를 선택·검색할 수는 없다.)

const PAGE_W = 794;            // A4, 96dpi 기준 CSS px
const PAGE_H = 1123;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const CONTENT_H = PAGE_H - MARGIN * 2;
const SCALE = 2;
const GAP = 12;

// 한 쪽보다 큰 덩어리는 안쪽 요소로 풀어서 글 중간이 잘리지 않게 한다.
function blocksOf(root) {
  const out = [];
  const walk = (el, depth) => {
    if (el.offsetHeight === 0) return;
    if (el.offsetHeight > CONTENT_H * 0.9 && el.children.length > 1 && depth < 3) {
      for (const c of el.children) walk(c, depth + 1);
    } else out.push(el);
  };
  for (const c of root.children) walk(c, 0);
  return out;
}

export async function buildPdf(html, onProgress = () => {}) {
  const html2canvas = (await import('./vendor/html2canvas/html2canvas.esm.js')).default;
  const holder = document.createElement('div');
  holder.className = 'wrap records pdf-sheet';
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${CONTENT_W}px;max-width:none;padding:0;margin:0;`;
  holder.innerHTML = html;
  holder.querySelectorAll('.no-print, video, button, a.no-print').forEach(n => n.remove());
  holder.querySelectorAll('details').forEach(n => { n.open = true; });
  holder.querySelectorAll('summary').forEach(n => { n.style.listStyle = 'none'; });
  document.body.appendChild(holder);
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const blocks = blocksOf(holder);
    const pages = [];
    let page = null;
    let y = 0;
    const newPage = () => {
      const cv = document.createElement('canvas');
      cv.width = PAGE_W * SCALE;
      cv.height = PAGE_H * SCALE;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#ffffff';
      cx.fillRect(0, 0, cv.width, cv.height);
      pages.push(cv);
      page = cx;
      y = 0;
    };
    newPage();
    for (let i = 0; i < blocks.length; i++) {
      onProgress(i + 1, blocks.length);
      const shot = await html2canvas(blocks[i], { scale: SCALE, backgroundColor: '#ffffff', logging: false, useCORS: false, windowWidth: PAGE_W });
      const h = shot.height / SCALE;
      // 소제목이 쪽 끝에 혼자 남지 않게, 뒤에 내용이 들어갈 자리가 없으면 다음 쪽으로 넘긴다.
      const el = blocks[i];
      const heading = /^H[1-4]$/.test(el.tagName) || el.classList.contains('eyebrow') || el.classList.contains('guide-h') || el.tagName === 'SUMMARY';
      if (heading && y > 0 && CONTENT_H - y < h + 160) newPage();
      if (h <= CONTENT_H - y) {
        page.drawImage(shot, MARGIN * SCALE, (MARGIN + y) * SCALE);
        y += h + GAP;
      } else if (h <= CONTENT_H) {
        newPage();
        page.drawImage(shot, MARGIN * SCALE, MARGIN * SCALE);
        y = h + GAP;
      } else {
        // 그래도 한 쪽보다 크면 쪽 높이로 잘라 넣는다.
        let off = 0;
        if (y > 0) newPage();
        while (off < h) {
          const part = Math.min(CONTENT_H, h - off);
          page.drawImage(shot, 0, off * SCALE, shot.width, part * SCALE, MARGIN * SCALE, MARGIN * SCALE, shot.width, part * SCALE);
          off += part;
          if (off < h) newPage(); else y = part + GAP;
        }
      }
    }
    const jpegs = [];
    for (const cv of pages) {
      const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.88));
      jpegs.push({ data: new Uint8Array(await blob.arrayBuffer()), w: cv.width, h: cv.height });
    }
    return writePdf(jpegs);
  } finally {
    holder.remove();
  }
}

// 쪽마다 JPEG 한 장을 가득 채운 PDF를 쓴다(A4: 595.28 x 841.89pt).
function writePdf(images) {
  const enc = new TextEncoder();
  const parts = [];
  const offsets = [];
  let length = 0;
  const push = chunk => { const b = typeof chunk === 'string' ? enc.encode(chunk) : chunk; parts.push(b); length += b.length; };
  const obj = (n, body) => { offsets[n] = length; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
  const W = 595.28;
  const H = 841.89;
  const n = images.length;
  // 번호: 1 카탈로그, 2 쪽 목록, 쪽 i(0부터): 쪽 3+3i, 내용 4+3i, 그림 5+3i
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Count ${n} /Kids [${images.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] >>`));
  images.forEach((img, i) => {
    const pageNo = 3 + 3 * i;
    const content = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    obj(pageNo, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${pageNo + 2} 0 R >> >> /Contents ${pageNo + 1} 0 R >>`));
    obj(pageNo + 1, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    obj(pageNo + 2, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.data.length} >>\nstream\n`);
      push(img.data);
      push('\nendstream');
    });
  });
  const total = 2 + 3 * n;
  const xref = length;
  push(`xref\n0 ${total + 1}\n0000000000 65535 f \n`);
  for (let k = 1; k <= total; k++) push(`${String(offsets[k]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: 'application/pdf' });
}
