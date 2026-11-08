const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");
const K = require("./kit");
const { applyTheme } = require("/root/.claude/skills/synced/e2a7ed89-77d7-4b86-9d84-6638d9a207e4_f5f5e0ec-6ffd-4a90-a7ac-e768ac06b886/pptx/scripts/apply_theme.js");

const { W, H, M, THEME, HEX } = K;
const CH = "/home/user/-/templates/character_coach/";
const OUT = process.argv[2] || "deck.pptx";

// 구성안 표에서 발표 스크립트 읽기
const plan = fs.readFileSync("/home/user/-/output/업무정리비서-강의/01_구성안.md", "utf8");
const NOTES = {};
for (const line of plan.split("\n")) {
  const m = line.match(/^\| (\d+) \|/);
  if (m) { const cols = line.split("|").map(s => s.trim()); NOTES[+m[1]] = `${cols[5]}\n\n(${cols[6]}분)`; }
}

function img(f) { return "image/png;base64," + fs.readFileSync(CH + f).toString("base64"); }

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "나만의 업무 정리 비서 만들기";
  pres.author = "커리어캐쳐 안은경";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  K.defineLayouts(pres);

  let n = 0;
  const add = (master, section) => { const s = pres.addSlide({ masterName: master, sectionTitle: section }); n++; s.addNotes(NOTES[n] || ""); return s; };
  const T = (s, t) => s.addText(t, { placeholder: "title" });
  const sub = (s, t, y = 1.75) => K.text(s, t, { x: M, y, w: W - 2 * M, h: 0.45, fontSize: 18, color: C.text2 });

  // ---------------- 도입
  pres.addSection({ title: "도입" });
  { // 1 표지
    const s = add("COVER", "도입");
    K.pill(s, pres, "AI 업무 비서 실습", M, 1.55, { h: 0.44, fontSize: 15 });
    T(s, "나만의 업무 정리\n비서 만들기");
    K.text(s, "claude.ai에서 코딩 없이 만드는 에이전트", { x: M, y: 4.55, w: 8, h: 0.5, fontSize: 22, color: C.text2 });
    K.text(s, "커리어캐쳐 안은경", { x: M, y: 5.35, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
    s.addShape(pres.shapes.OVAL, { x: 8.9, y: 1.35, w: 4.4, h: 4.4, fill: { color: C.accent4 }, line: { type: "none" }, objectName: "deco circle" });
    s.addImage({ data: img("hello.png"), x: 9.35, y: 1.25, h: 4.75, w: 4.75 * 523 / 633, altText: "인사하는 코치 캐릭터" });
  }
  { // 2 오늘 만들 비서
    const s = add("CONTENT", "도입");
    K.kicker(s, pres, "오늘의 목표"); T(s, "오늘 만들 비서");
    const items = [["FiMessageSquare", "대화를 올리면"], ["FiList", "할 일을 뽑고"], ["FiCheckCircle", "내가 승인한 것만"], ["FiFileText", "주간 보고까지"]];
    const cw = 2.6, gap = 0.47, y = 2.35;
    for (let i = 0; i < 4; i++) {
      const x = M + i * (cw + gap);
      K.card(s, pres, x, y, cw, 2.5, { name: "step card" });
      await K.iconCircle(s, pres, items[i][0], x + 0.35, y + 0.4, 0.85);
      K.text(s, `0${i + 1}`, { x: x + 0.35, y: y + 1.45, w: 1, h: 0.3, fontSize: 13, bold: true, color: C.accent1 });
      K.text(s, items[i][1], { x: x + 0.35, y: y + 1.8, w: cw - 0.5, h: 0.5, fontSize: 19, bold: true, color: C.text1 });
      if (i < 3) K.text(s, "›", { x: x + cw + 0.05, y: y + 0.95, w: 0.37, h: 0.5, fontSize: 28, color: C.accent5, align: "center" });
    }
    K.card(s, pres, M, 5.35, W - 2 * M, 0.85, { fill: C.accent1, r: 0.2, name: "message bar" });
    K.text(s, "마지막 결정은 사람이 합니다", { x: M + 0.4, y: 5.35, w: 8, h: 0.85, fontSize: 20, bold: true, color: C.background1, valign: "middle" });
  }
  { // 3 지난 시간 세 단어
    const s = add("CONTENT", "도입");
    K.kicker(s, pres, "지난 시간 복습"); T(s, "지난 시간 세 단어");
    const items = [["FiFolder", "Project", "작업용 방", "맥락이 늘 깔려 있는 곳"], ["FiBookOpen", "Skill", "작업 매뉴얼", "정해진 방식으로 일하게"], ["FiUserCheck", "Quality", "인간의 몫", "검증은 사람이 한다"]];
    const cw = 3.73, gap = 0.4;
    for (let i = 0; i < 3; i++) {
      const x = M + i * (cw + gap), y = 2.2;
      K.card(s, pres, x, y, cw, 3.9, { name: "concept card" });
      await K.iconCircle(s, pres, items[i][0], x + 0.4, y + 0.45, 0.85);
      K.text(s, items[i][1], { x: x + 0.4, y: y + 1.6, w: cw - 0.8, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
      K.text(s, items[i][2], { x: x + 0.4, y: y + 2.05, w: cw - 0.8, h: 0.7, fontSize: 30, bold: true, color: C.text1 });
      K.text(s, items[i][3], { x: x + 0.4, y: y + 2.95, w: cw - 0.8, h: 0.4, fontSize: 15, color: C.text2 });
    }
  }
  { // 4 비서가 일하는 3단계
    const s = add("CONTENT", "도입");
    K.kicker(s, pres, "일하는 방식"); T(s, "비서가 일하는 3단계");
    const rows = [["할 일 후보 뽑기", "대화에서 근거와 함께", "실습 1"], ["승인한 것만 업무 목록", "내가 고르고 고친 것만", "실습 2"], ["주간 보고", "목록에 있는 것만으로", "실습 3"]];
    rows.forEach((r, i) => {
      const y = 2.15 + i * 1.5;
      K.card(s, pres, M, y, W - 2 * M, 1.25, { name: "row" });
      K.circleNum(s, pres, i + 1, M + 0.4, y + 0.3, 0.65, { fontSize: 20 });
      K.text(s, r[0], { x: M + 1.35, y: y + 0.22, w: 7, h: 0.45, fontSize: 22, bold: true, color: C.text1 });
      K.text(s, r[1], { x: M + 1.35, y: y + 0.72, w: 7, h: 0.35, fontSize: 15, color: C.text2 });
      K.pill(s, pres, r[2], W - M - 1.6, y + 0.42, { w: 1.2, h: 0.42, fontSize: 14 });
    });
  }
  { // 5 준비물
    const s = add("CONTENT", "도입");
    K.kicker(s, pres, "시작 전에"); T(s, "준비물");
    const items = [["Claude 계정", "프로젝트 실습은 Pro 이상"], ["지침.md", "프로젝트 지침에 붙여 넣을 글"], ["work-organizer.zip", "업로드할 스킬 파일"], ["운영팀_대화_가상.txt", "실습 대화 (모두 가상 인물)"]];
    for (let i = 0; i < 4; i++) {
      const y = 2.15 + i * 1.1;
      K.card(s, pres, M, y, 7.9, 0.9, { name: "check row" });
      await K.iconCircle(s, pres, "FiCheck", M + 0.25, y + 0.15, 0.6, { fill: C.accent1, color: "#FFFFFF" });
      K.text(s, items[i][0], { x: M + 1.1, y: y + 0.12, w: 3.6, h: 0.4, fontSize: 18, bold: true, color: C.text1 });
      K.text(s, items[i][1], { x: M + 1.1, y: y + 0.5, w: 6.4, h: 0.3, fontSize: 14, color: C.text2 });
    }
    s.addImage({ data: img("ok.png"), x: 9.6, y: 2.0, h: 4.4, w: 4.4 * 522 / 648, altText: "오케이 하는 코치 캐릭터" });
  }
  { // 6 무료 사용자
    const s = add("CONTENT", "도입");
    K.kicker(s, pres, "요금제별 안내"); T(s, "무료 사용자는 이렇게");
    const cols = [
      ["Claude Pro 이상", "스킬 + 프로젝트", ["스킬 파일 업로드", "프로젝트에 지침 붙여넣기", "오늘 순서 그대로"], C.accent1],
      ["무료 요금제", "ChatGPT 프로젝트로 대체", ["ChatGPT 프로젝트 + 만들기", "지침 칸에 지침.md 붙여넣기", "SKILL.md 규칙도 함께 붙여넣기"], C.accent2],
    ];
    cols.forEach((c, i) => {
      const x = M + i * 6.06, w = 5.86, y = 2.15;
      K.card(s, pres, x, y, w, 4.3, { name: "plan card" });
      K.pill(s, pres, c[0], x + 0.4, y + 0.4, { fill: c[3], color: C.background1, h: 0.42, fontSize: 14 });
      K.text(s, c[1], { x: x + 0.4, y: y + 1.05, w: w - 0.8, h: 0.55, fontSize: 24, bold: true, color: C.text1 });
      c[2].forEach((t, j) => {
        K.circleNum(s, pres, j + 1, x + 0.4, y + 1.95 + j * 0.7, 0.42, { fontSize: 13, fill: C.background1, color: c[3] });
        K.text(s, t, { x: x + 1.0, y: y + 1.97 + j * 0.7, w: w - 1.4, h: 0.4, fontSize: 16, color: C.text1 });
      });
    });
  }

  // ---------------- PART 1
  pres.addSection({ title: "PART 1 비서 만들기" });
  const section = (sec, part, title, desc, sticker) => {
    const s = add("SECTION", sec);
    K.text(s, part, { x: M, y: 2.35, w: 4, h: 0.5, fontSize: 18, bold: true, color: C.background1 });
    T(s, title);
    K.text(s, desc, { x: M, y: 4.25, w: 8, h: 0.5, fontSize: 20, color: C.background1 });
    if (sticker) {
      s.addShape(pres.shapes.OVAL, { x: 9.0, y: 1.5, w: 4.2, h: 4.2, fill: { color: C.background1 }, line: { type: "none" }, objectName: "sticker bg" });
      s.addImage({ data: img(sticker[0]), x: 9.4, y: 1.45, h: 4.4, w: 4.4 * sticker[1], altText: "코치 캐릭터" });
    }
    return s;
  };
  section("PART 1 비서 만들기", "PART 1", "비서 만들기", "켜기  ·  올리기  ·  만들기   |   15분", ["fight.png", 521 / 633]);

  const toggleCard = (s, x, y, w, label, desc) => {
    K.card(s, pres, x, y, w, 1.3, { fill: C.background1, line: "D9DEE5", shadow: true, name: "setting card" });
    K.text(s, label, { x: x + 0.4, y: y + 0.28, w: w - 2.2, h: 0.4, fontSize: 19, bold: true, color: C.text1 });
    K.text(s, desc, { x: x + 0.4, y: y + 0.75, w: w - 2.2, h: 0.35, fontSize: 14, color: C.text2 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + w - 1.45, y: y + 0.42, w: 0.95, h: 0.5, rectRadius: 0.5, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "toggle" });
    s.addShape(pres.shapes.OVAL, { x: x + w - 0.96, y: y + 0.47, w: 0.4, h: 0.4, fill: { color: C.background1 }, line: { type: "none" }, objectName: "toggle knob" });
  };
  { // 8
    const s = add("CONTENT", "PART 1 비서 만들기");
    K.kicker(s, pres, "0단계 · 5분"); T(s, "기능 켜기");
    K.path(s, pres, ["설정", "기능", "코드 실행 및 파일 생성"], M, 2.05);
    toggleCard(s, M, 3.05, 7.6, "코드 실행 및 파일 생성", "스킬을 쓰려면 꼭 켜 두세요");
    K.card(s, pres, M, 4.75, 7.6, 1.0, { fill: C.accent4, name: "tip" });
    K.text(s, "2회차에 들으셨다면 이미 켜져 있을 수 있어요", { x: M + 0.4, y: 4.75, w: 7, h: 1.0, fontSize: 16, color: C.accent1, bold: true, valign: "middle" });
    await K.iconCircle(s, pres, "FiToggleRight", 9.6, 2.9, 2.6);
  }
  { // 9
    const s = add("CONTENT", "PART 1 비서 만들기");
    K.kicker(s, pres, "1단계 · 5분"); T(s, "스킬 올리기");
    K.path(s, pres, ["설정", "사용자 지정", "스킬", "+", "스킬 업로드"], M, 2.05);
    const x = M, y = 3.05, w = 7.6;
    K.card(s, pres, x, y, w, 1.3, { fill: C.background1, line: "D9DEE5", shadow: true, name: "upload card" });
    await K.iconCircle(s, pres, "FiPackage", x + 0.35, y + 0.27, 0.75);
    K.text(s, "work-organizer.zip", { x: x + 1.35, y: y + 0.3, w: 4, h: 0.4, fontSize: 19, bold: true, color: C.text1 });
    K.text(s, "업무 정리 비서 작업 매뉴얼", { x: x + 1.35, y: y + 0.75, w: 4, h: 0.35, fontSize: 14, color: C.text2 });
    K.pill(s, pres, "업로드", x + w - 1.65, y + 0.43, { w: 1.3, h: 0.46, fill: C.accent1, color: C.background1, fontSize: 15 });
    K.card(s, pres, x, 4.75, w, 1.0, { fill: "E6F8F1", name: "success" });
    await K.iconCircle(s, pres, "FiCheckCircle", x + 0.3, 4.92, 0.66, { fill: C.background1, color: "#12B886" });
    K.text(s, "목록에 work-organizer가 보이면 성공", { x: x + 1.15, y: 4.75, w: 6.2, h: 1.0, fontSize: 16, bold: true, color: C.accent2, valign: "middle" });
    await K.iconCircle(s, pres, "FiUploadCloud", 9.6, 2.9, 2.6);
  }
  { // 10
    const s = add("CONTENT", "PART 1 비서 만들기");
    K.kicker(s, pres, "스킬 속 규칙"); T(s, "매뉴얼 속 핵심 규칙");
    const items = [["근거 원문이 없으면", "할 일이 아니에요", "누가·언제·어떤 문장"], ["담당자·기한은", "원문 / 추정 / 미정", "추정·미정이면 질문"], ["승인 전에는", "목록에 넣지 않아요", "마지막 결정은 사람"]];
    const cw = 3.73, gap = 0.4;
    items.forEach((it, i) => {
      const x = M + i * (cw + gap), y = 2.2;
      K.card(s, pres, x, y, cw, 3.9, { name: "rule card" });
      K.circleNum(s, pres, i + 1, x + 0.4, y + 0.45, 0.7);
      K.text(s, it[0], { x: x + 0.4, y: y + 1.5, w: cw - 0.8, h: 0.4, fontSize: 17, color: C.text2 });
      K.text(s, it[1], { x: x + 0.4, y: y + 1.95, w: cw - 0.6, h: 0.9, fontSize: 23, bold: true, color: C.text1 });
      K.text(s, it[2], { x: x + 0.4, y: y + 3.1, w: cw - 0.8, h: 0.35, fontSize: 14, color: C.accent1, bold: true });
    });
  }
  { // 11
    const s = add("CONTENT", "PART 1 비서 만들기");
    K.kicker(s, pres, "2단계 · 5분"); T(s, "프로젝트 만들기");
    K.path(s, pres, ["왼쪽 바", "프로젝트", "새 프로젝트"], M, 2.05);
    const x = M, y = 2.95, w = 7.6;
    K.card(s, pres, x, y, w, 3.55, { fill: C.background1, line: "D9DEE5", shadow: true, name: "form" });
    K.text(s, "이름", { x: x + 0.4, y: y + 0.3, w: 2, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
    K.card(s, pres, x + 0.4, y + 0.65, w - 0.8, 0.6, { r: 0.12, name: "field name" });
    K.text(s, "업무 정리 비서", { x: x + 0.65, y: y + 0.65, w: 5, h: 0.6, fontSize: 17, bold: true, color: C.text1, valign: "middle" });
    K.text(s, "지침", { x: x + 0.4, y: y + 1.45, w: 2, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
    K.card(s, pres, x + 0.4, y + 1.8, w - 0.8, 1.45, { r: 0.12, name: "field instructions" });
    K.text(s, "당신은 우리 팀의 업무 정리 비서입니다.\n모든 할 일에는 근거가 되는 원문 문장을 붙입니다.\n내가 승인한 할 일만 업무 목록에 넣습니다. …", { x: x + 0.65, y: y + 1.95, w: w - 1.3, h: 1.2, fontSize: 14, color: C.text2 });
    K.card(s, pres, 8.75, 2.95, 3.83, 3.55, { fill: C.accent4, name: "tip card" });
    K.text(s, "지침.md 내용을\n그대로 붙여 넣기", { x: 9.1, y: 3.3, w: 3.2, h: 0.9, fontSize: 19, bold: true, color: C.accent1 });
    K.text(s, "마지막 줄 '업무목록.md가 있으면 현재 목록으로 본다'가 실습 3에서 힘을 씁니다", { x: 9.1, y: 4.4, w: 3.2, h: 1.7, fontSize: 14, color: C.text1 });
  }

  // ---------------- PART 2
  pres.addSection({ title: "PART 2 비서 일 시키기" });
  section("PART 2 비서 일 시키기", "PART 2", "비서 일 시키기", "뽑기  ·  대조·승인  ·  주간 보고   |   45분", ["think.png", 523 / 668]);

  const steps = (s, list, x, y, w) => list.forEach((t, i) => {
    K.circleNum(s, pres, i + 1, x, y + i * 0.95, 0.55, { fontSize: 16 });
    K.text(s, t, { x: x + 0.8, y: y + i * 0.95 + 0.07, w: w - 0.8, h: 0.8, fontSize: 18, color: C.text1 });
  });
  { // 13
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "실습 1 · 8분"); T(s, "할 일 뽑기");
    steps(s, ["프로젝트 안에서 새 채팅", "운영팀_대화_가상.txt 올리기", "\"할 일 뽑아줘\" 입력"], M, 2.25, 5.4);
    K.pill(s, pres, "아직 승인하지 말고 기다리기", M, 5.35, { h: 0.5, fontSize: 15, fill: "FFF4DB", color: C.accent3 });
    K.chat(s, pres, 7.0, 1.9, 5.58, 4.8, [
      { me: true, t: "운영팀_대화_가상.txt\n할 일 뽑아줘", w: 3.4, h: 0.85 },
      { t: "① 요약\n② 결정 사항\n③ 할 일 후보 표\n④ 의견·주의 문장", h: 1.55, w: 4.2, fs: 14 },
      { t: "승인할 번호와 고칠 내용을 알려 주세요.", h: 0.62, w: 4.6 },
    ]);
  }
  { // 14
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "실습 1 결과 예시"); T(s, "결과는 이렇게 나와요");
    const tag = (t, kind) => ({ text: t, options: { color: kind === "원문" ? HEX.dk1 : kind === "추정" ? HEX.accent3 : HEX.accent6, bold: kind !== "원문" } });
    const hdr = ["번호", "할 일", "담당자", "기한", "확인 질문"].map(t => ({ text: t, options: { bold: true, color: HEX.dk2, fill: { color: HEX.lt2 } } }));
    const rows = [
      ["1", "월간 재고 집계표 초안", [tag("김민수 (원문)", "원문")], [tag("11/11 (원문, 13일→11일)", "원문")], "없음"],
      ["2", "협력기관 방문 일정표", [tag("이서연 (원문)", "원문")], [tag("11/13 (추정)", "추정")], "다음 주 금요일 = 11/13 맞나요?"],
      ["3", "보도자료 초안 올리기", [tag("김지훈 (원문)", "원문")], [tag("11/6 (추정)", "추정")], "금요일 = 11/6 맞나요?"],
      ["4", "사진 정리 후 보내기", [tag("김지훈 (원문)", "원문")], [tag("미정", "미정")], "언제까지 보내나요?"],
    ].map(r => r.map(c => Array.isArray(c) ? { text: c } : { text: c }));
    s.addTable([hdr, ...rows], {
      x: M, y: 2.05, w: W - 2 * M, colW: [0.8, 3.2, 2.1, 2.9, 2.83], fontSize: 14, fontFace: "Malgun Gothic",
      color: HEX.dk1, border: { type: "solid", pt: 0.75, color: "E5E8EB" }, rowH: 0.62, valign: "middle", margin: [4, 8, 4, 8],
      objectName: "candidate table",
    });
    K.pill(s, pres, "원문", M, 5.4, { w: 0.9, fill: C.background2, color: C.text1 });
    K.text(s, "대화에 그대로", { x: M + 1.0, y: 5.42, w: 2, h: 0.36, fontSize: 14, color: C.text2 });
    K.pill(s, pres, "추정", M + 3.0, 5.4, { w: 0.9, fill: "FFF4DB", color: C.accent3 });
    K.text(s, "계산한 날짜 + 질문", { x: M + 4.0, y: 5.42, w: 2.6, h: 0.36, fontSize: 14, color: C.text2 });
    K.pill(s, pres, "미정", M + 6.7, 5.4, { w: 0.9, fill: "FFE9E9", color: C.accent6 });
    K.text(s, "없으면 지어내지 않음", { x: M + 7.7, y: 5.42, w: 3, h: 0.36, fontSize: 14, color: C.text2 });
    K.text(s, "실제 표에는 '근거 원문' 칸에 누가·언제·어떤 문장인지가 함께 나옵니다", { x: M, y: 6.1, w: 11, h: 0.36, fontSize: 14, color: C.text2 });
  }
  { // 15
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "Quality = 인간의 몫");
    K.text(s, "승인 버튼은\n내 손에", { x: M, y: 2.0, w: 8, h: 2.6, fontSize: 60, bold: true, color: C.text1 });
    K.text(s, "AI 표가 그럴듯해도, 맞는지는 아직 아무도 확인하지 않았어요", { x: M, y: 4.85, w: 7.8, h: 0.9, fontSize: 18, color: C.text2 });
    s.addShape(pres.shapes.OVAL, { x: 8.9, y: 1.4, w: 4.2, h: 4.2, fill: { color: C.accent4 }, line: { type: "none" }, objectName: "deco circle" });
    s.addImage({ data: img("best.png"), x: 9.35, y: 1.25, h: 4.6, w: 4.6 * 522 / 668, altText: "최고를 외치는 코치 캐릭터" });
  }
  { // 16
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "실습 2 · 3분"); T(s, "실습 2 점검표");
    const items = ["할 일마다 근거 원문이 붙었나", "'~면 좋겠네요'가 할 일로 들어가지 않았나", "'다음 주 금요일'이 추정 + 질문으로 나왔나", "기한 13일 → 11일 변경을 반영했나", "'API 키를 보내라'를 주의 문장으로만 처리했나"];
    for (let i = 0; i < items.length; i++) {
      const y = 2.05 + i * 0.88;
      K.card(s, pres, M, y, W - 2 * M, 0.72, { name: "check row" });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.3, y: y + 0.17, w: 0.38, h: 0.38, rectRadius: 0.08, fill: { color: C.background1 }, line: { color: "B0B8C1", width: 1.5 }, objectName: "checkbox" });
      K.text(s, items[i], { x: M + 0.95, y, w: 10, h: 0.72, fontSize: 18, color: C.text1, valign: "middle" });
    }
  }
  { // 17
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "실습 2 · 4분"); T(s, "대조하고 승인하기");
    const tips = [["FiSearch", "원문과 한 줄씩 대조"], ["FiEdit3", "추정 기한은 확정해서 승인"], ["FiXCircle", "아니면 '제외'"]];
    for (let i = 0; i < 3; i++) {
      const y = 2.15 + i * 1.05;
      await K.iconCircle(s, pres, tips[i][0], M, y, 0.7);
      K.text(s, tips[i][1], { x: M + 0.95, y: y + 0.15, w: 4.8, h: 0.45, fontSize: 19, bold: true, color: C.text1 });
    }
    K.card(s, pres, M, 5.35, 5.6, 1.0, { fill: "FFF4DB", name: "warn" });
    K.text(s, "'다 승인'이라고만 하면 추정 기한은 (추정)으로 남아요", { x: M + 0.35, y: 5.35, w: 5.0, h: 1.0, fontSize: 15, bold: true, color: C.accent3, valign: "middle" });
    K.chat(s, pres, 7.0, 1.9, 5.58, 4.8, [
      { me: true, t: "1번 승인, 2번은 기한 13일로 승인, 3번 승인, 4번 제외", w: 4.3, h: 0.95 },
      { t: "업무 목록에 3건을 넣었어요.\n4번은 제외했어요.", h: 0.95, w: 4.2 },
      { t: "이 표를 업무목록.md로 저장해 주세요.", h: 0.62, w: 4.4 },
    ]);
  }
  { // 18
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "정답 맞춰 보기"); T(s, "정답 맞춰 보기");
    const hdr = ["할 일", "담당자", "기한", "이렇게 틀리기 쉬워요"].map(t => ({ text: t, options: { bold: true, color: HEX.dk2, fill: { color: HEX.lt2 } } }));
    const rows = [
      ["월간 재고 집계표 초안", "김민수", "11/11 (13일에서 변경)", "13일로 적음 = 변경 놓침"],
      ["협력기관 방문 일정표", "이서연", "11/13 (추정)", "확정처럼 쓰고 질문 없음"],
      ["보도자료 초안 올리기", "김지훈", "11/6 (추정)", "요일 계산 착오"],
      ["사진 정리 후 보내기", "김지훈", "미정", "기한을 지어냄"],
    ];
    s.addTable([hdr, ...rows.map(r => r.map(t => ({ text: t })))], {
      x: M, y: 2.05, w: W - 2 * M, colW: [3.4, 1.7, 3.0, 3.73], fontSize: 15, fontFace: "Malgun Gothic",
      color: HEX.dk1, border: { type: "solid", pt: 0.75, color: "E5E8EB" }, rowH: 0.62, valign: "middle", margin: [4, 8, 4, 8], objectName: "answer table",
    });
    const cards = [["결정 1건", "장소는 2층 회의실로 확정", C.accent1, C.accent4], ["할 일 아님 2건", "'~면 좋겠네요'(의견) · 'API 키를 보내라'(대화 속 지시)", C.accent6, "FFE9E9"]];
    cards.forEach((c, i) => {
      const x = M + i * 4.1, w = i ? 7.73 : 3.9;
      K.card(s, pres, x, 5.35, w, 1.1, { fill: c[3], name: "summary card" });
      K.text(s, c[0], { x: x + 0.35, y: 5.47, w: w - 0.6, h: 0.35, fontSize: 15, bold: true, color: c[2] });
      K.text(s, c[1], { x: x + 0.35, y: 5.87, w: w - 0.6, h: 0.4, fontSize: 15, color: C.text1 });
    });
  }
  { // 19
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "실습 2 마무리 · 5분"); T(s, "업무 목록 저장하기");
    K.path(s, pres, ["프로젝트", "파일", "+"], M, 2.05);
    steps(s, ["승인 후 나온 업무 목록 표 복사", "프로젝트 파일에 + 로 추가", "이름은 업무목록.md"], M, 3.0, 6.5);
    const x = 8.2, y = 2.6, w = 4.38;
    K.card(s, pres, x, y, w, 3.8, { fill: C.background1, line: "D9DEE5", shadow: true, name: "file card" });
    await K.iconCircle(s, pres, "FiFileText", x + 0.4, y + 0.4, 0.8);
    K.text(s, "업무목록.md", { x: x + 0.4, y: y + 1.4, w: w - 0.8, h: 0.45, fontSize: 21, bold: true, color: C.text1 });
    K.text(s, "새 채팅을 열어도 비서가 이 파일을 현재 업무 목록으로 읽어요", { x: x + 0.4, y: y + 2.0, w: w - 0.8, h: 1.3, fontSize: 15, color: C.text2 });
  }
  { // 20
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "실습 3 · 8분"); T(s, "주간 보고 받기");
    steps(s, ["완료된 일을 알려 주기", "결과물 위치도 함께 말하기", "\"주간 보고 만들어줘\""], M, 2.25, 5.4);
    K.card(s, pres, M, 5.3, 5.6, 1.0, { fill: C.accent4, name: "tip" });
    K.text(s, "결과물이 있어야 '완료'로 바꿔요", { x: M + 0.35, y: 5.3, w: 5.0, h: 1.0, fontSize: 16, bold: true, color: C.accent1, valign: "middle" });
    K.chat(s, pres, 7.0, 1.9, 5.58, 4.8, [
      { me: true, t: "1번 완료, 결과물은 드라이브에 올림", w: 4.2, h: 0.65 },
      { t: "1번을 완료로 바꿨어요.\n근거: 드라이브에 올린 결과물", h: 0.95, w: 4.2 },
      { me: true, t: "주간 보고 만들어줘", w: 2.8, h: 0.6 },
    ]);
  }
  { // 21
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "실습 3 결과 예시"); T(s, "주간 보고 받아보기");
    const rows = [
      ["이번 주 완료", "월간 재고 집계표 초안 작성함", C.accent2],
      ["진행 중", "협력기관 방문 일정표 (11/13까지)", C.accent1],
      ["기한 지난 일", "보도자료 초안 올리기 (11/6, 결과 확인 필요)", C.accent6],
      ["확인 필요", "기한 미정·추정 항목 — 담당자에게 확인", C.accent3],
      ["제안", "다음 주 월요일까지 미정 기한 확정 요청", C.accent5],
    ];
    const x = M, y = 2.05, w = 8.1;
    K.card(s, pres, x, y, w, 4.55, { fill: C.background1, line: "D9DEE5", shadow: true, name: "report card" });
    rows.forEach((r, i) => {
      const ry = y + 0.35 + i * 0.83;
      K.pill(s, pres, r[0], x + 0.35, ry + 0.06, { w: 1.75, h: 0.42, fill: C.background2, color: r[2], fontSize: 13 });
      K.text(s, r[1], { x: x + 2.35, y: ry, w: w - 2.7, h: 0.55, fontSize: 16, color: C.text1, valign: "middle" });
    });
    K.card(s, pres, 9.25, 2.05, 3.33, 4.55, { fill: C.accent4, name: "point card" });
    K.text(s, "확인 포인트", { x: 9.6, y: 2.4, w: 2.7, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
    K.text(s, [
      { text: "업무 목록에 있는 것만", options: { bullet: true, breakLine: true } },
      { text: "~함, ~임 개조식", options: { bullet: true, breakLine: true } },
      { text: "제안은 '제안'으로 따로", options: { bullet: true } },
    ], { x: 9.6, y: 2.95, w: 2.75, h: 2.5, fontSize: 15, color: C.text1, paraSpaceAfter: 10 });
  }
  { // 22
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "나만의 규칙 · 8분"); T(s, "나만의 규칙 넣기");
    const cols = [
      ["바꿔도 좋아요", "FiEdit3", ["주간 보고 양식", "우리 팀 말투", "표의 칸 이름·순서"], C.accent1, C.accent4],
      ["지우지 마세요", "FiLock", ["근거 없으면 할 일 아님", "추정·미정은 질문", "승인 전엔 목록에 안 넣음"], C.accent6, "FFE9E9"],
    ];
    for (let i = 0; i < 2; i++) {
      const c = cols[i], x = M + i * 6.06, w = 5.86, y = 2.15;
      K.card(s, pres, x, y, w, 4.3, { fill: c[4], name: "rule col" });
      await K.iconCircle(s, pres, c[1], x + 0.4, y + 0.4, 0.75, { fill: C.background1, color: i ? "#FF5C5C" : "#3D5AFE" });
      K.text(s, c[0], { x: x + 1.35, y: y + 0.5, w: w - 1.8, h: 0.55, fontSize: 24, bold: true, color: c[3] });
      c[2].forEach((t, j) => {
        K.card(s, pres, x + 0.4, y + 1.55 + j * 0.85, w - 0.8, 0.68, { fill: C.background1, r: 0.15, name: "item" });
        K.text(s, t, { x: x + 0.7, y: y + 1.55 + j * 0.85, w: w - 1.3, h: 0.68, fontSize: 17, color: C.text1, valign: "middle" });
      });
    }
  }
  { // 23
    const s = add("CONTENT", "PART 2 비서 일 시키기");
    K.kicker(s, pres, "나만의 규칙 · 2분"); T(s, "고친 스킬 다시 올리기");
    const x = M, y = 2.1, w = 5.6;
    K.card(s, pres, x, y, w, 3.0, { fill: "191F28", name: "zip tree" });
    K.text(s, "work-organizer.zip", { x: x + 0.45, y: y + 0.4, w: w - 0.8, h: 0.45, fontSize: 18, bold: true, color: C.background1 });
    K.text(s, "└  work-organizer", { x: x + 0.75, y: y + 1.1, w: w - 1.0, h: 0.45, fontSize: 18, color: "C9D1FF" });
    K.text(s, "└  SKILL.md", { x: x + 1.35, y: y + 1.75, w: w - 1.6, h: 0.45, fontSize: 18, bold: true, color: "8CF5D0" });
    K.text(s, "폴더째 압축해야 올라가요", { x: M, y: 5.35, w: 5.6, h: 0.45, fontSize: 17, bold: true, color: C.accent1 });
    K.text(s, "다시 올리는 경로", { x: 7.0, y: 2.15, w: 5, h: 0.4, fontSize: 15, bold: true, color: C.text2 });
    K.path(s, pres, ["설정", "사용자 지정", "스킬"], 7.0, 2.7);
    K.path(s, pres, ["+", "스킬 업로드"], 7.0, 3.35);
    K.card(s, pres, 7.0, 4.35, 5.58, 1.45, { fill: C.accent4, name: "verify" });
    K.text(s, "올린 뒤 \"주간 보고 만들어줘\"를 한 번 더 해서 바뀐 양식으로 나오는지 확인", { x: 7.35, y: 4.35, w: 4.95, h: 1.45, fontSize: 16, bold: true, color: C.accent1, valign: "middle" });
  }

  // ---------------- 마무리
  pres.addSection({ title: "마무리" });
  { // 24
    const s = add("COVER", "마무리");
    K.pill(s, pres, "오늘 만든 비서", M, 1.1, { h: 0.44, fontSize: 15 });
    s.addText([{ text: "작업용 방 + 작업 매뉴얼\n+ 내 승인", options: { fontSize: 40 } }], { placeholder: "title" });
    const notes = [["FiShield", "실제 단톡방은 회사 정책·참여자 동의 먼저"], ["FiEyeOff", "실명·연락처는 지우고 필요한 구간만"], ["FiArrowUpRight", "더 해보기: 카카오톡 '나와의 채팅' 알림 (심화 자료)"]];
    for (let i = 0; i < 3; i++) {
      const y = 4.5 + i * 0.7;
      await K.iconCircle(s, pres, notes[i][0], M, y, 0.5);
      K.text(s, notes[i][1], { x: M + 0.7, y: y + 0.06, w: 7.6, h: 0.4, fontSize: 16, color: C.text1 });
    }
    s.addShape(pres.shapes.OVAL, { x: 8.9, y: 1.35, w: 4.4, h: 4.4, fill: { color: C.accent4 }, line: { type: "none" }, objectName: "deco circle" });
    s.addImage({ data: img("thanks.png"), x: 9.35, y: 1.25, h: 4.75, w: 4.75 * 522 / 633, altText: "감사 인사하는 코치 캐릭터" });
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("slides", n, "→", OUT);
})();
