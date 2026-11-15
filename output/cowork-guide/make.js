const pptxgen = require("pptxgenjs");
const React = require("react");
const RDS = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require(process.env.SKILL + "/scripts/apply_theme.js");

const THEME = { name: "CareerCatcher Guide", headFontFace: "Malgun Gothic", bodyFontFace: "Malgun Gothic",
  colors: { dk1: "222222", lt1: "FFFFFF", dk2: "1E3A8A", lt2: "EEF2FB", accent1: "1E3A8A", accent2: "C2410C",
    accent3: "6B7280", accent4: "D5DAE6", accent5: "FFF4EC", accent6: "3B5BB5", hlink: "1E3A8A", folHlink: "6B7280" } };
const F = "Malgun Gothic";

async function icon(name, hex) {
  const svg = RDS.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + hex, size: 256 }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.theme = { headFontFace: F, bodyFontFace: F };
  pres.author = "An Eun Kyoung"; pres.title = "Chat · Code · Cowork 가이드";
  const C = pres.SchemeColor;
  const NAVY = C.text2, TINT = C.background2, INK = C.text1, GRAY = C.accent3, LINE = C.accent4, ORANGE = C.accent2, PEACH = C.accent5, WHITE = C.background1;

  pres.defineSlideMaster({
    title: "CONTENT", background: { color: "FFFFFF" },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.4, y: 0.28, w: 9.2, h: 0.5, fontFace: F, fontSize: 26, bold: true, color: NAVY, align: "left", valign: "middle", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.4, y: 0.8, w: 9.2, h: 0.28, fontFace: F, fontSize: 12, color: GRAY, align: "left", valign: "middle", margin: 0 }, text: "" } },
      { text: { text: "An Eun Kyoung", options: { x: 7.6, y: 5.3, w: 2.0, h: 0.2, fontFace: F, fontSize: 8, color: GRAY, align: "right", margin: 0 } } },
    ],
  });

  const T = (s, text, o) => s.addText(text, Object.assign({ fontFace: F, isTextBox: true, margin: 0, color: INK, valign: "middle" }, o));
  const source = (s, text) => T(s, text, { x: 0.4, y: 4.98, w: 9.2, h: 0.3, fontSize: 8, color: GRAY, valign: "top", objectName: "출처" });

  // ───────── Slide 1: 비교 매트릭스 ─────────
  pres.addSection({ title: "가이드" });
  let s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "가이드" });
  s.addText("Chat · Code · Cowork 한눈에 보기", { placeholder: "title" });
  s.addText("답을 주는 도구인가, 일을 끝내는 도구인가", { placeholder: "body" });

  const LX = 0.4, LW = 1.3, CX0 = 1.8, GAP = 0.1, CW = (9.6 - CX0 - 2 * GAP) / 3;
  const HY = 1.25, HH = 0.5, RY = HY + HH, RH = 0.55;
  const cols = [
    { name: "Chat", ic: "FaComments", cells: ["대화형 초안 작성, 리서치, 분석", "누구나", "브라우저, 데스크톱, 모바일", "“이 보고서 요약하고 답장 초안 써줘”"], whenA: "짧은 질문이라면", whenB: "Chat이 가볍다 (p.18)" },
    { name: "Claude Code", ic: "FaTerminal", cells: ["저장소 안에서 코드 작성·수정·테스트", "개발자", "터미널, IDE", "“이 모듈 리팩터링하고 테스트 돌려줘”"], whenA: "저장소 코드 작업이라면", whenB: "Claude Code (p.18)" },
    { name: "Cowork", ic: "FaFolderOpen", hi: true, cells: ["파일과 여러 앱을 넘나드는 지식 업무", "분석가, PM, 운영자, 연구자, 마케터", "Claude 데스크톱 앱", "“다운로드 폴더 PDF 5개 비교해 시트로”"], whenA: "답 대신 결과물이 필요하다면", whenB: "파일을 읽고 쓰며 여러 단계 실행 (p.4·6)" },
  ];
  const rows = [["무엇을 위해", "FaBullseye"], ["주로 쓰는 사람", "FaUser"], ["실행 위치", "FaDesktop"], ["한 줄 예시", "FaQuoteLeft"]];
  const bodyH = RH * rows.length;

  // 열 카드
  for (let i = 0; i < 3; i++) {
    const c = cols[i], x = CX0 + i * (CW + GAP);
    s.addShape(pres.shapes.RECTANGLE, { x, y: HY, w: CW, h: HH + bodyH, fill: { color: c.hi ? TINT : WHITE }, line: { color: c.hi ? NAVY : LINE, width: c.hi ? 1.5 : 0.75 }, objectName: c.name + " 열" });
    s.addShape(pres.shapes.RECTANGLE, { x, y: HY, w: CW, h: HH, fill: { color: c.hi ? NAVY : TINT }, line: { color: c.hi ? NAVY : LINE, width: c.hi ? 1.5 : 0.75 }, objectName: c.name + " 머리" });
    s.addImage({ data: await icon(c.ic, c.hi ? "FFFFFF" : "1E3A8A"), x: x + 0.15, y: HY + 0.13, w: 0.24, h: 0.24, altText: c.name });
    T(s, c.name, { x: x + 0.5, y: HY, w: CW - 0.6, h: HH, fontSize: 16, bold: true, color: c.hi ? WHITE : NAVY, objectName: c.name + " 이름" });
    c.cells.forEach((t, r) => T(s, t, { x: x + 0.15, y: RY + r * RH, w: CW - 0.3, h: RH, fontSize: 11, color: INK, bold: c.hi && r === 0, objectName: `${c.name} ${rows[r][0]}` }));
  }
  // 행 라벨 + 구분선
  for (let r = 0; r < rows.length; r++) {
    const y = RY + r * RH;
    s.addImage({ data: await icon(rows[r][1], "6B7280"), x: LX, y: y + RH / 2 - 0.08, w: 0.16, h: 0.16, altText: rows[r][0] });
    T(s, rows[r][0], { x: LX + 0.25, y, w: LW - 0.25, h: RH, fontSize: 10.5, bold: true, color: GRAY, objectName: "행 " + rows[r][0] });
    if (r > 0) s.addShape(pres.shapes.LINE, { x: LX, y, w: 9.2, h: 0, line: { color: LINE, width: 0.5 }, objectName: "구분선" });
  }
  // 선택 기준 행
  const WY = RY + bodyH + 0.2, WH = 0.62;
  T(s, "이럴 때 고른다", { x: LX, y: WY, w: LW, h: WH, fontSize: 11, bold: true, color: ORANGE, objectName: "선택 기준 라벨" });
  for (let i = 0; i < 3; i++) {
    const c = cols[i], x = CX0 + i * (CW + GAP);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: WY, w: CW, h: WH, rectRadius: 0.08, fill: { color: PEACH }, line: { color: c.hi ? ORANGE : PEACH, width: 1 }, objectName: c.name + " 선택 기준" });
    T(s, [{ text: c.whenA, options: { fontSize: 9.5, color: GRAY, breakLine: true } }, { text: "→ " + c.whenB, options: { fontSize: 10.5, bold: true, color: c.hi ? ORANGE : INK } }],
      { x: x + 0.15, y: WY, w: CW - 0.25, h: WH, objectName: c.name + " 선택 기준 글" });
  }
  source(s, "[자료 근거] 출처: Anthropic, 『Claude Cowork product guide』(첨부 PDF) p.4, 6, 18. Chat·Code 설명은 p.6 제품 매트릭스 표 기준.");

  // ───────── Slide 2: 업무 흐름도 ─────────
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "가이드" });
  s.addText("Cowork 업무 예시 3가지", { placeholder: "title" });
  s.addText("요청 한 번으로 파일과 앱을 묶어 결과물까지", { placeholder: "body" });

  const X = { a: 0.4, b: 2.5, c: 5.0, d: 7.0 }, Wd = { a: 1.9, b: 2.3, c: 1.8, d: 2.6 };
  const heads = [["a", "누가 · 어떤 일"], ["b", "모으는 자료"], ["c", "시키는 일"], ["d", "나오는 결과물"]];
  heads.forEach(([k, t]) => T(s, t, { x: X[k] + (k === "a" ? 0 : 0.1), y: 1.2, w: Wd[k], h: 0.22, fontSize: 9.5, bold: true, color: k === "d" ? ORANGE : GRAY, objectName: "머리 " + t }));

  const cases = [
    { n: "1", title: "주간 업데이트 초안", role: "엔지니어링 매니저 · p.15", ic: "FaChartLine",
      src: ["Asana 완료 항목", "metrics CSV", "Slack 블로커 채널"], task: "주간 보고 템플릿에 맞춰 초안 작성 후 저장",
      out: "실제 파일과 메시지에 근거한 초안", note: "예약 작업으로 매주 금요일 아침 자동 시작 가능" },
    { n: "2", title: "회의 준비 문서", role: "파트너십 리드 · p.14", ic: "FaHandshake",
      src: ["Gmail 스레드", "Slack DM", "공유 문서", "지난 회의 메모"], task: "오후 2시 고객사 미팅용으로 한데 묶기",
      out: "원본 링크가 달린 1페이지 준비 문서", note: "연결되지 않은 앱이 있으면 그 사실을 알려줌" },
    { n: "3", title: "공급사 제안서 비교", role: "재무 분석가 · p.16", ic: "FaBalanceScale",
      src: ["Vendors 폴더의 PDF 5개"], task: "가격·구현 기간·SLA를 뽑아 비교표(.xlsx)와 추천 사유 작성",
      out: "옵션별 비교 시트와 추천 메모", note: "제안서에 없는 항목은 추측하지 않고 빈칸으로 표시" },
  ];
  const R0 = 1.45, RHt = 0.9, RG = 0.1;
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i], y = R0 + i * (RHt + RG);
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 9.2, h: RHt, fill: { color: TINT }, line: { color: TINT, width: 0.5 }, objectName: `사례${c.n} 바탕` });
    // A: 사례
    s.addShape(pres.shapes.RECTANGLE, { x: X.a, y, w: Wd.a, h: RHt, fill: { color: NAVY }, line: { color: NAVY, width: 0.5 }, objectName: `사례${c.n} 제목 바탕` });
    s.addImage({ data: await icon(c.ic, "FFFFFF"), x: X.a + 0.14, y: y + 0.16, w: 0.22, h: 0.22, altText: c.title });
    T(s, c.title, { x: X.a + 0.44, y: y + 0.1, w: Wd.a - 0.5, h: 0.36, fontSize: 11.5, bold: true, color: WHITE, objectName: `사례${c.n} 제목` });
    T(s, c.role, { x: X.a + 0.14, y: y + 0.52, w: Wd.a - 0.2, h: 0.25, fontSize: 9, color: TINT, objectName: `사례${c.n} 역할` });
    // B: 자료 칩
    const single = c.src.length === 1, cw = single ? Wd.b - 0.2 : (Wd.b - 0.2 - 0.08) / 2, ch = 0.28;
    const nrow = Math.ceil(c.src.length / 2), top = y + (RHt - (nrow * ch + (nrow - 1) * 0.08)) / 2;
    c.src.forEach((t, j) => {
      const cx = X.b + 0.1 + (j % 2) * (cw + 0.08), cy = top + Math.floor(j / 2) * (ch + 0.08);
      s.addText(t, { shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.06, x: cx, y: cy, w: cw, h: ch, fill: { color: WHITE }, line: { color: LINE, width: 0.75 },
        fontFace: F, fontSize: 9, color: INK, align: "center", valign: "middle", margin: 0, objectName: `사례${c.n} 자료 ${j + 1}` });
    });
    // 화살표
    [X.c - 0.12, X.d - 0.12].forEach((ax, k) => s.addShape(pres.shapes.RIGHT_TRIANGLE ? pres.shapes.CHEVRON : pres.shapes.CHEVRON, { x: ax, y: y + RHt / 2 - 0.1, w: 0.14, h: 0.2, fill: { color: k ? ORANGE : NAVY }, line: { color: k ? ORANGE : NAVY, width: 0.25 }, objectName: `사례${c.n} 화살표 ${k + 1}` }));
    // C: 시키는 일
    T(s, c.task, { x: X.c + 0.12, y, w: Wd.c - 0.3, h: RHt, fontSize: 10, color: INK, objectName: `사례${c.n} 요청` });
    // D: 결과물
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X.d + 0.1, y: y + 0.08, w: Wd.d - 0.18, h: RHt - 0.16, rectRadius: 0.06, fill: { color: WHITE }, line: { color: ORANGE, width: 1 }, objectName: `사례${c.n} 결과 바탕` });
    T(s, [{ text: c.out, options: { fontSize: 10.5, bold: true, color: INK, breakLine: true } }, { text: c.note, options: { fontSize: 8.5, color: GRAY } }],
      { x: X.d + 0.22, y: y + 0.08, w: Wd.d - 0.42, h: RHt - 0.16, objectName: `사례${c.n} 결과` });
  }
  // 공통 원칙 3단계
  const PY = 4.45, PH = 0.42;
  T(s, "공통 원칙", { x: 0.4, y: PY, w: 0.9, h: PH, fontSize: 11, bold: true, color: NAVY, objectName: "공통 원칙 라벨" });
  const steps = ["파일·폴더 위치를 지정한다", "결과물 형식과 길이를 명시한다", "결과를 검토한 뒤 사용한다"];
  const SX = 1.35, SG = 0.22, SW = (9.6 - SX - 2 * SG) / 3;
  steps.forEach((t, i) => {
    const x = SX + i * (SW + SG);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: PY, w: SW, h: PH, rectRadius: 0.08, fill: { color: WHITE }, line: { color: NAVY, width: 1 }, objectName: `원칙 ${i + 1} 바탕` });
    s.addText(String(i + 1), { shape: pres.shapes.OVAL, x: x + 0.1, y: PY + 0.09, w: 0.24, h: 0.24, fill: { color: NAVY }, line: { color: NAVY, width: 0.25 }, fontFace: F, fontSize: 9, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, objectName: `원칙 ${i + 1} 번호` });
    T(s, t, { x: x + 0.42, y: PY, w: SW - 0.5, h: PH, fontSize: 10.5, color: INK, objectName: `원칙 ${i + 1}` });
    if (i < 2) s.addShape(pres.shapes.CHEVRON, { x: x + SW + 0.05, y: PY + PH / 2 - 0.08, w: 0.12, h: 0.16, fill: { color: NAVY }, line: { color: NAVY, width: 0.25 }, objectName: `원칙 화살표 ${i + 1}` });
  });
  source(s, "[자료 근거] 출처: Anthropic, 『Claude Cowork product guide』(첨부 PDF) p.14–18(공통 원칙 포함), 사례별 쪽은 각 행에 표기. 예시 문구는 가이드 사례를 요약·각색함. 가이드에 발행일이 없어 날짜는 표기하지 않음.");

  const out = process.argv[2];
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
})();
