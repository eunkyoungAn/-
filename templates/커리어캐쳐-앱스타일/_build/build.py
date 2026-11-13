"""tokens.css 하나로 스타일 가이드(index.html)와 시작용 페이지(page-template.html)를 만든다.
실행: python3 templates/커리어캐쳐-앱스타일/_build/build.py"""
import html
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
CSS = (HERE / "tokens.css").read_text(encoding="utf-8")

ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'

SNIPPETS = [
 ("표지", "큰 제목 + 칩 + 부제. 페이지·슬라이드 첫 화면", """<header>
  <span class="cc-pill">AI 에이전트 실무</span>
  <h1 class="cc-display" style="margin-top:12px">나만의 업무 정리<br>비서 만들기</h1>
  <p class="cc-sub" style="margin-top:12px">claude.ai에서 코딩 없이 만드는 에이전트</p>
</header>"""),
 ("칩", "상태·분류 라벨. 색만으로 뜻을 전하지 않도록 글자를 꼭 넣기", """<div style="display:flex;gap:8px;flex-wrap:wrap">
  <span class="cc-pill">기본</span>
  <span class="cc-pill is-solid">선택됨</span>
  <span class="cc-pill is-gray">미정</span>
  <span class="cc-pill is-success">완료</span>
  <span class="cc-pill is-warn">추정</span>
  <span class="cc-pill is-danger">기한 지남</span>
</div>"""),
 ("카드 3개", "개념·규칙·기능을 나란히. 아이콘 원 + 작은 라벨 + 큰 글자 + 설명", f"""<div class="cc-grid">
  <div class="cc-card">
    <span class="cc-icon">{ICON_CHAT}</span>
    <p class="cc-caption" style="margin:14px 0 2px;color:var(--cc-accent);font-weight:700">Project</p>
    <h3 class="cc-h1" style="font-size:26px">작업용 방</h3>
    <p class="cc-sub">맥락이 늘 깔려 있는 곳</p>
  </div>
  <div class="cc-card">
    <span class="cc-icon">{ICON_CHAT}</span>
    <p class="cc-caption" style="margin:14px 0 2px;color:var(--cc-accent);font-weight:700">Skill</p>
    <h3 class="cc-h1" style="font-size:26px">작업 매뉴얼</h3>
    <p class="cc-sub">정해진 방식으로 일하게</p>
  </div>
  <div class="cc-card">
    <span class="cc-icon">{ICON_CHAT}</span>
    <p class="cc-caption" style="margin:14px 0 2px;color:var(--cc-accent);font-weight:700">Quality</p>
    <h3 class="cc-h1" style="font-size:26px">인간의 몫</h3>
    <p class="cc-sub">검증은 사람이 한다</p>
  </div>
</div>"""),
 ("단계 목록", "순서가 있는 과정. 오른쪽 칩에 실습 번호·시간", """<ol class="cc-steps">
  <li><span class="cc-num">1</span><div><div class="cc-step-title">할 일 후보 뽑기</div><div class="cc-step-desc">대화에서 근거와 함께</div></div><span class="cc-pill">실습 1</span></li>
  <li><span class="cc-num">2</span><div><div class="cc-step-title">승인한 것만 업무 목록</div><div class="cc-step-desc">내가 고르고 고친 것만</div></div><span class="cc-pill">실습 2</span></li>
  <li><span class="cc-num">3</span><div><div class="cc-step-title">주간 보고</div><div class="cc-step-desc">목록에 있는 것만으로</div></div><span class="cc-pill">실습 3</span></li>
</ol>"""),
 ("화면 경로", "따라 하기 안내. 마지막 칸이 파랗게 강조됨", """<div class="cc-path">
  <span>설정</span><i>›</i><span>기능</span><i>›</i><span>코드 실행 및 파일 생성</span>
</div>"""),
 ("채팅 화면", "AI와 주고받는 예시. 내 말은 파란 말풍선", """<div class="cc-chat" style="max-width:420px">
  <div class="cc-chat-title">업무 정리 비서</div>
  <div class="cc-bubble is-me">세 파일 할 일 뽑아줘</div>
  <div class="cc-bubble">① 요약
② 결정 사항
③ 할 일 후보 표</div>
  <div class="cc-bubble">승인할 번호와 고칠 내용을 알려 주세요.</div>
</div>"""),
 ("큰 숫자 + 강조 카드", "결과물·성과를 한눈에", """<div class="cc-grid">
  <div class="cc-card"><div class="cc-stat">85.0%</div><div class="cc-stat-label">수료율 (204/240명)</div></div>
  <div class="cc-card"><div class="cc-stat">44.6%</div><div class="cc-stat-label">취업·창업률 (수료자 기준)</div></div>
  <div class="cc-card is-accent"><div class="cc-stat">60분</div><div style="opacity:.9">실습 결과물 3종</div></div>
</div>"""),
 ("체크리스트", "점검표. 끝난 항목은 is-done", """<ul class="cc-check">
  <li class="is-done">할 일마다 근거 원문이 붙었나</li>
  <li>'~면 좋겠네요'가 할 일로 들어가지 않았나</li>
  <li>추정 기한에 확인 질문이 붙었나</li>
</ul>"""),
 ("표", "좁은 화면에서는 가로로 밀어서 봄", """<div class="cc-table-wrap">
  <table class="cc-table">
    <thead><tr><th>할 일</th><th>담당</th><th>기한</th><th>상태</th></tr></thead>
    <tbody>
      <tr><td>3회차 교안 보내기</td><td>나</td><td>11/10</td><td><span class="cc-pill is-gray">할 일</span></td></tr>
      <tr><td>운영일지 제출</td><td>나</td><td>11/6</td><td><span class="cc-pill is-danger">기한 지남</span></td></tr>
    </tbody>
  </table>
</div>"""),
 ("팁 상자와 버튼", "한 줄 안내와 행동 버튼", """<div class="cc-card is-tip">2회차 수강자는 이미 켜져 있을 수 있음</div>
<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
  <button class="cc-btn" type="button">업로드</button>
  <button class="cc-btn is-ghost" type="button">나중에</button>
</div>"""),
 ("섹션 표지", "큰 덩어리를 나눌 때. 오른쪽 큰 숫자", """<section class="cc-section">
  <div><p style="margin:0;font-weight:700">PART 1</p><h2 class="cc-h1" style="color:inherit;margin-top:6px">비서 구축</h2><p style="margin:0;opacity:.9">기능 설정 · 스킬 등록 · 프로젝트 생성</p></div>
  <div class="cc-section-num" aria-hidden="true">01</div>
</section>"""),
]

GUIDE_CSS = """
.sg-block{margin-top:40px}
.sg-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.sg-preview{border:1px dashed var(--cc-line);border-radius:var(--cc-radius);padding:24px;background:var(--cc-bg)}
.sg-code{margin-top:10px;background:var(--cc-surface);border-radius:var(--cc-radius-sm);padding:14px 16px;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;overflow:auto;max-height:220px;white-space:pre;color:var(--cc-sub)}
.sg-swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
.sg-sw{border-radius:var(--cc-radius-sm);overflow:hidden;border:1px solid var(--cc-line);background:var(--cc-elevated)}
.sg-sw i{display:block;height:56px}
.sg-sw div{padding:8px 10px;font-size:13px}
.sg-sw code{color:var(--cc-sub);font-size:12px}
.sg-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--cc-ink);color:var(--cc-bg);padding:10px 18px;border-radius:999px;font-weight:700;opacity:0;transition:opacity .2s;pointer-events:none}
.sg-toast.show{opacity:1}
.sg-rules{columns:2 280px;gap:24px;padding-left:18px;margin:0}
.sg-rules li{margin-bottom:8px;break-inside:avoid}
"""

SWATCHES = [("포인트", "--cc-accent", "#3D5AFE"), ("포인트 연한", "--cc-accent-soft", "#E8EDFF"), ("글자", "--cc-ink", "#191F28"),
            ("보조 글자", "--cc-sub", "#4E5968"), ("카드 바탕", "--cc-surface", "#F2F4F7"), ("선", "--cc-line", "#E5E8EB"),
            ("완료", "--cc-success", "#12B886"), ("주의·추정", "--cc-warn", "#E08A00"), ("위험·지남", "--cc-danger", "#F04452")]

RULES = ["흰 바탕, 포인트 색은 파랑 하나만 (초록·노랑·빨강은 상태 표시용)", "제목은 크고 굵게(32~48), 본문은 15~16", "카드는 모서리 16px, 테두리 대신 연회색 바탕",
         "강조선·옆 줄무늬 장식 쓰지 않기", "한 화면 = 메시지 하나, 글자는 짧게", "본문은 왼쪽 정렬, 가운데 정렬은 짧은 제목만",
         "상태는 색과 글자를 함께 (색만으로 구분하지 않기)", "캐릭터·이모지 없이 아이콘 원과 큰 숫자로 시각화", "특정 회사 로고·고유 색·화면은 쓰지 않기",
         "간격은 8의 배수 (8·16·24·40)"]

def esc(s): return html.escape(s, quote=False)

def guide():
    blocks = []
    for i, (name, desc, snip) in enumerate(SNIPPETS):
        blocks.append(f"""<section class="sg-block" aria-labelledby="s{i}">
<div class="sg-head"><div><h2 class="cc-h2" id="s{i}">{esc(name)}</h2><p class="cc-sub">{esc(desc)}</p></div>
<button class="cc-btn is-ghost" type="button" data-copy="c{i}">HTML 복사</button></div>
<div class="sg-preview">{snip}</div>
<pre class="sg-code" id="c{i}">{esc(snip)}</pre></section>""")
    sw = "".join(f'<div class="sg-sw"><i style="background:var({v})"></i><div><b>{esc(n)}</b><br><code>{v}</code><br><code>{h}</code></div></div>' for n, v, h in SWATCHES)
    rules = "".join(f"<li>{esc(r)}</li>" for r in RULES)
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>커리어캐쳐 앱 스타일</title>
<style>
{CSS}
{GUIDE_CSS}
</style>
</head>
<body>
<main class="cc-page">
<div class="cc-topbar"><span class="cc-pill">커리어캐쳐 디자인 양식</span>
<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="cc-btn is-ghost" type="button" id="tone">웜 그린 톤 보기</button><button class="cc-btn is-ghost" type="button" id="theme">밝게/어둡게</button></div></div>
<h1 class="cc-display">커리어캐쳐 앱 스타일</h1>
<p class="cc-sub" style="margin-top:12px;max-width:640px">강의 교안과 AI비서 페이지에서 쓴 디자인을 그대로 복사해 쓰는 양식입니다. 아래 순서대로 <b>① 전체 CSS</b>를 한 번 붙여 넣고, <b>② 필요한 조각의 HTML</b>을 가져다 쓰세요.</p>

<section class="sg-block">
<div class="sg-head"><div><h2 class="cc-h2">① 전체 CSS</h2><p class="cc-sub">페이지 &lt;style&gt; 안에 한 번 붙여 넣기. 파일로는 <code>tokens.css</code></p></div>
<button class="cc-btn" type="button" data-copy="css">전체 CSS 복사</button></div>
<pre class="sg-code" id="css">{esc(CSS)}</pre></section>

<section class="sg-block"><h2 class="cc-h2">디자인 규칙 10가지</h2><ol class="sg-rules">{rules}</ol></section>
<section class="sg-block"><h2 class="cc-h2">색</h2><p class="cc-sub" style="margin-bottom:12px">어두운 화면에서는 자동으로 어두운 색으로 바뀝니다.</p><div class="sg-swatches">{sw}</div></section>
<h2 class="cc-h1" style="margin-top:56px">② 조각(컴포넌트)</h2>
{''.join(blocks)}
<p class="cc-caption" style="margin-top:48px">원본: templates/커리어캐쳐-앱스타일 · 수정 후 _build/build.py로 다시 만듭니다.</p>
</main>
<div class="sg-toast" id="toast" role="status" aria-live="polite">복사했어요</div>
<script>
const toast = document.getElementById("toast");
document.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", async () => {{
  const text = document.getElementById(b.dataset.copy).textContent;
  try {{ await navigator.clipboard.writeText(text); toast.textContent = "복사했어요"; }}
  catch (e) {{ const r = document.createRange(); r.selectNodeContents(document.getElementById(b.dataset.copy)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast.textContent = "선택했어요. Ctrl+C로 복사하세요"; }}
  toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1600);
}}));
const root = document.documentElement;
document.getElementById("theme").addEventListener("click", () => {{
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
}});
document.getElementById("tone").addEventListener("click", e => {{
  const warm = root.dataset.tone === "warm";
  if (warm) delete root.dataset.tone; else root.dataset.tone = "warm";
  e.target.textContent = warm ? "웜 그린 톤 보기" : "기본 파랑 톤 보기";
}});
</script>
</body>
</html>
"""

def template():
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>페이지 제목</title>
<style>
{CSS}
</style>
</head>
<body>
<main class="cc-page">
  <header>
    <span class="cc-pill">분류 라벨</span>
    <h1 class="cc-display" style="margin-top:12px">큰 제목</h1>
    <p class="cc-sub" style="margin-top:12px">한 줄 설명</p>
  </header>

  <section style="margin-top:40px">
    <h2 class="cc-h1">섹션 제목</h2>
    <div class="cc-grid" style="margin-top:16px">
      <div class="cc-card"><h3 class="cc-h2">카드 제목</h3><p class="cc-sub">짧은 설명</p></div>
      <div class="cc-card"><h3 class="cc-h2">카드 제목</h3><p class="cc-sub">짧은 설명</p></div>
      <div class="cc-card"><h3 class="cc-h2">카드 제목</h3><p class="cc-sub">짧은 설명</p></div>
    </div>
  </section>

  <!-- 여기에 스타일 가이드(index.html)의 조각을 복사해 붙여 넣으세요 -->

  <p class="cc-caption" style="margin-top:48px">커리어캐쳐 안은경</p>
</main>
</body>
</html>
"""

(HERE / "index.html").write_text(guide(), encoding="utf-8")
(HERE / "page-template.html").write_text(template(), encoding="utf-8")
print("ok")
