// 앱 화면 스타일 슬라이드 부품 (커리어캐쳐 자체 디자인)
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fi = require("react-icons/fi");

const W = 13.333, H = 7.5, M = 0.75;

const THEME = {
  name: "CareerCatcher App",
  headFontFace: "Malgun Gothic",
  bodyFontFace: "Malgun Gothic",
  colors: {
    dk1: "191F28", lt1: "FFFFFF", dk2: "4E5968", lt2: "F2F4F7",
    accent1: "3D5AFE", accent2: "12B886", accent3: "F59F00", accent4: "E8EDFF",
    accent5: "8B95A1", accent6: "FF5C5C", hlink: "3D5AFE", folHlink: "6B7684",
  },
};
const HEX = THEME.colors;

async function icon(name, color = "#3D5AFE", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(fi[name], { color, size: String(size), strokeWidth: 2.2 }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function defineLayouts(pres) {
  const C = pres.SchemeColor;
  const footer = [
    { text: { text: "An Eun Kyoung", options: { x: M, y: H - 0.5, w: 3, h: 0.3, fontSize: 10, color: C.text2, isTextBox: true, margin: 0 } } },
  ];
  pres.defineSlideMaster({
    title: "CONTENT", background: { color: C.background1 },
    objects: [...footer,
      { placeholder: { options: { name: "title", type: "title", x: M, y: 0.95, w: W - 2 * M, h: 0.8, fontSize: 32, bold: true, color: C.text1, valign: "top", align: "left", margin: 0 }, text: "" } }],
    slideNumber: { x: W - M - 0.6, y: H - 0.5, w: 0.6, h: 0.3, fontSize: 10, color: C.text2, align: "right" },
  });
  pres.defineSlideMaster({
    title: "SECTION", background: { color: C.accent1 },
    objects: [
      { text: { text: "An Eun Kyoung", options: { x: M, y: H - 0.5, w: 3, h: 0.3, fontSize: 10, color: C.background1, isTextBox: true, margin: 0 } } },
      { placeholder: { options: { name: "title", type: "title", x: M, y: 3.0, w: 8.5, h: 1.4, fontSize: 44, bold: true, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } }],
  });
  pres.defineSlideMaster({
    title: "COVER", background: { color: C.background1 },
    objects: [...footer,
      { placeholder: { options: { name: "title", type: "title", x: M, y: 2.35, w: 8.4, h: 2.0, fontSize: 48, bold: true, color: C.text1, valign: "top", align: "left", margin: 0 }, text: "" } }],
  });
}

// ---- 부품 ----
function pill(slide, pres, text, x, y, opts = {}) {
  const C = pres.SchemeColor;
  const w = opts.w || Math.max(0.9, 0.16 * text.length + 0.45);
  slide.addText(text, {
    shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.5, x, y, w, h: opts.h || 0.38,
    fill: { color: opts.fill || C.accent4 }, color: opts.color || C.accent1, fontSize: opts.fontSize || 13, bold: true,
    align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "pill " + text,
  });
  return w;
}

function kicker(slide, pres, text) { pill(slide, pres, text, M, 0.45); }

function card(slide, pres, x, y, w, h, opts = {}) {
  const C = pres.SchemeColor;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: opts.r ?? 0.22, fill: { color: opts.fill || C.background2 },
    line: opts.line ? { color: opts.line, width: 1 } : { type: "none" },
    shadow: opts.shadow ? { type: "outer", color: "1B2B4B", opacity: 0.10, blur: 14, offset: 3, angle: 90 } : undefined,
    objectName: opts.name || "card",
  });
}

function text(slide, t, o) {
  slide.addText(t, { isTextBox: true, margin: 0, valign: "top", fontSize: 16, ...o });
}

function circleNum(slide, pres, n, x, y, d = 0.6, opts = {}) {
  const C = pres.SchemeColor;
  slide.addText(String(n), {
    shape: pres.shapes.OVAL, x, y, w: d, h: d, fill: { color: opts.fill || C.accent1 },
    color: opts.color || C.background1, bold: true, fontSize: opts.fontSize || 18, align: "center", valign: "middle",
    margin: 0, isTextBox: true, objectName: "num " + n,
  });
}

async function iconCircle(slide, pres, name, x, y, d = 0.75, opts = {}) {
  const C = pres.SchemeColor;
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: opts.fill || C.accent4 }, line: { type: "none" }, objectName: "icon bg " + name });
  const pad = d * 0.26;
  slide.addImage({ data: await icon(name, opts.color || "#3D5AFE"), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, altText: name, objectName: "icon " + name });
}

// 휴대폰 모양 채팅 화면
function chat(slide, pres, x, y, w, h, msgs, opts = {}) {
  const C = pres.SchemeColor;
  card(slide, pres, x, y, w, h, { fill: C.background1, line: "D9DEE5", r: 0.35, shadow: true, name: "chat frame" });
  text(slide, opts.title || "업무 정리 비서", { x: x + 0.35, y: y + 0.25, w: w - 0.7, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  let cy = y + 0.75;
  for (const m of msgs) {
    const me = m.me;
    const bw = m.w || Math.min(w - 1.0, w * 0.82);
    const bh = m.h || 0.6;
    const bx = me ? x + w - 0.3 - bw : x + 0.3;
    slide.addText(m.t, {
      shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.18, x: bx, y: cy, w: bw, h: bh,
      fill: { color: me ? C.accent1 : C.background2 }, color: me ? C.background1 : C.text1,
      fontSize: m.fs || 14, valign: "middle", margin: [6, 12, 6, 12], isTextBox: true, objectName: "bubble",
      bold: !!m.bold, paraSpaceAfter: 2,
    });
    cy += bh + 0.18;
  }
}

// 화면 경로: 설정 > 기능 > ...
function path(slide, pres, steps, x, y) {
  const C = pres.SchemeColor;
  let cx = x;
  steps.forEach((s, i) => {
    const last = i === steps.length - 1;
    const w = pill(slide, pres, s, cx, y, { h: 0.46, fontSize: 14, fill: last ? C.accent1 : C.background2, color: last ? C.background1 : C.text1 });
    cx += w + 0.08;
    if (!last) { text(slide, "›", { x: cx, y: y + 0.02, w: 0.25, h: 0.42, fontSize: 18, color: C.text2, align: "center", valign: "middle" }); cx += 0.33; }
  });
}

module.exports = { W, H, M, THEME, HEX, icon, defineLayouts, pill, kicker, card, text, circleNum, iconCircle, chat, path };
