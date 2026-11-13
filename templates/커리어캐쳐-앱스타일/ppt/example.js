// 앱 스타일 PPT 최소 예시: 표지 1장 + 카드 3장 1장 + 단계 1장
// 실행: npm install pptxgenjs react-icons react react-dom sharp
//       NODE_PATH=./node_modules node example.js 예시.pptx
const pptxgen = require("pptxgenjs");
const K = require("./kit");
const { W, M } = K;

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.theme = { headFontFace: K.THEME.headFontFace, bodyFontFace: K.THEME.bodyFontFace };
  const C = pres.SchemeColor;
  K.defineLayouts(pres);

  let s = pres.addSlide({ masterName: "COVER" });
  K.pill(s, pres, "분류 라벨", M, 1.55, { h: 0.44, fontSize: 15 });
  s.addText("큰 제목을\n두 줄로", { placeholder: "title" });
  K.text(s, "한 줄 설명", { x: M, y: 4.55, w: 8, h: 0.5, fontSize: 22, color: C.text2 });

  s = pres.addSlide({ masterName: "CONTENT" });
  K.kicker(s, pres, "작은 라벨"); s.addText("카드 3개", { placeholder: "title" });
  const items = [["FiFolder", "Project", "작업용 방"], ["FiBookOpen", "Skill", "작업 매뉴얼"], ["FiUserCheck", "Quality", "인간의 몫"]];
  for (let i = 0; i < 3; i++) {
    const x = M + i * 4.13, y = 2.2;
    K.card(s, pres, x, y, 3.73, 3.6);
    await K.iconCircle(s, pres, items[i][0], x + 0.4, y + 0.45, 0.85);
    K.text(s, items[i][1], { x: x + 0.4, y: y + 1.6, w: 2.9, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
    K.text(s, items[i][2], { x: x + 0.4, y: y + 2.05, w: 2.9, h: 0.7, fontSize: 30, bold: true, color: C.text1 });
  }

  s = pres.addSlide({ masterName: "CONTENT" });
  K.kicker(s, pres, "순서"); s.addText("단계 목록", { placeholder: "title" });
  ["첫 단계", "둘째 단계", "셋째 단계"].forEach((t, i) => {
    const y = 2.15 + i * 1.5;
    K.card(s, pres, M, y, W - 2 * M, 1.25);
    K.circleNum(s, pres, i + 1, M + 0.4, y + 0.3, 0.65, { fontSize: 20 });
    K.text(s, t, { x: M + 1.35, y: y + 0.4, w: 8, h: 0.45, fontSize: 22, bold: true, color: C.text1 });
  });

  const out = process.argv[2] || "예시.pptx";
  await pres.writeFile({ fileName: out });
  // 테마 색을 파일에 넣으려면 pptx 스킬의 apply_theme.js를 이어서 실행: await applyTheme(out, K.THEME)
  console.log(out);
})();
