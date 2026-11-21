/* AI 취업지원 실습실 — START 장표, 취업상담 워크플로우(5단계) 안내, 바로가기 메뉴.
   이 화면은 입력을 받지 않으며 어디에도 내용을 보내지 않는다. 실습은 연결된 구글 시트와 구글 폼에서 한다. */
(function () {
  'use strict';
  const D = window.LAB;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FILE_BASE = 'files/';
  const F = D.flow;
  const L = D.links;
  async function copyText(text, btn) {
    const done = msg => { const o = btn.textContent; btn.textContent = msg; setTimeout(() => { btn.textContent = o; }, 1400); };
    try { await navigator.clipboard.writeText(text); done('복사됨'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done('복사됨'); } catch (_) { done('Ctrl+C로 복사'); }
      document.body.removeChild(ta);
    }
  }
  const copyBox = (text, label, btn) => `<div class="prompt-box tall"><span class="box-label">${esc(label)}</span><button class="copy-button" type="button">${esc(btn)}</button><pre>${esc(text)}</pre></div>`;
  const bindCopy = root => root.querySelectorAll('.copy-button').forEach(b => b.addEventListener('click', () => copyText(b.parentElement.querySelector('pre').textContent, b)));
  const ol = arr => `<ol class="plain">${arr.map(t => `<li>${esc(t)}</li>`).join('')}</ol>`;
  const M = D.mine;
  const T = D.tryout;
  const FM = D.formMake;
  const ext = (href, label, cls) => `<a class="${cls || 'g-btn'}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

  /* ---------- 시작 화면 ---------- */
  function renderHome() {
    $('#copyLink').href = L.copy;
    /* ③ 수업 구성: 색 세 가지(회색, 파랑, 어두운 색)가 번갈아 나온다 */
    const course = [
      ['수업 준비', '#before', 'AI 역량검사 · 나는 어떤 AI 사용자?'],
      ['강의', '#start', `변화 · 트렌드 · 역할, 장표 ${SLIDES.length}장`],
      ['실습 5단계', '#flow', '취업상담 워크플로우. 구직자 정보 받기부터 한 장 결과지까지'],
      ['내 에이전트', '#mine', M.title],
      ['체험', '#try', '커리어캐쳐가 만든 서비스 두 가지'],
      ['자료실', '#downloads', '구글 시트, 구글 폼, Apps Script, 연습용 가상 사례'],
    ];
    const tone = ['grey', 'blue', 'dark'];
    $('#homeCourse').innerHTML = course.map((c, i) => `<a class="hb-card t-${tone[i % 3]}" href="${c[1]}"><div><strong>${esc(c[0])}</strong><span class="d">${esc(c[2])}</span></div><div class="go"><i aria-hidden="true">↗</i>열기</div></a>`).join('');
    /* ⑥ 실습 5단계(접이식) · ⑦ 내 에이전트 */
    $('#homeFlow').innerHTML = `<section class="hb-sec" id="sec-steps">
      <div class="hb-head"><h2>실습 5단계</h2><p>구직자의 경험을 채용공고의 요구와 대조하고, 상담자와 구직자가 함께 다음 행동을 정합니다. 단계를 누르면 펼쳐집니다.</p></div>
      <div class="hb-acc">${F.steps.map((s, i) => `<details name="hb-steps"${i === 0 ? ' open' : ''}><summary><b>0${s.no}</b><span>${esc(s.title)}</span></summary>
        <div class="hb-acc-b"><p>${esc(s.short)}</p><span class="hb-tab">쓰는 탭 · ${esc(s.tab)}</span><span class="hb-tab">준비물 ${prepDone(s)}/${prepNeed(s).length}</span><a class="hb-go" href="#flow-${s.no}">준비물 확인하고 시작 →</a></div></details>`).join('')}</div>
      <div class="sheet-actions mt14"><a class="g-btn" href="#flow-1">1단계부터 시작</a><a class="g-btn ghost" href="#flow">전체 과정 보기</a></div></section>
      <section class="hb-sec" id="sec-mine"><div class="hb-head"><h2>내 에이전트</h2><p>${esc(M.title)}. 업무 에이전트 실습실의 두 화면을 이 사이트 안에서 그대로 봅니다.</p></div>
      <div class="hb-team">${M.tabs.map(t => `<a class="hb-member" href="#mine-${t.id}"><span>개별 실습</span><strong>${esc(t.label)}</strong><em>열기 →</em></a>`).join('')}</div></section>`;
    /* ⑧ 체험해 보기 */
    $('#homeTry').innerHTML = `<section class="hb-sec" id="sec-try"><div class="hb-head"><h2>체험해 보기</h2><p>${esc(T.lead)}</p></div>
      <div class="hb-band two">${T.items.map(x => `<a class="hb-try" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(x.code)}</span><strong>${esc(x.title)}</strong><p>${esc(x.desc)}</p>${ul(x.pts)}<p class="first">먼저 눌러 볼 곳 · ${esc(x.first)}</p><em>새 탭에서 열기 ↗</em></a>`).join('')}</div>
      <p class="local-note">${esc(T.note)}</p></section>`;
    /* ⑤ 자료실: 가상 사례는 어두운 띠, 실습 도구는 목록 */
    $('#zipLink').href = FILE_BASE + D.zip;
    const toolBtn = b => { const cls = 'g-btn' + (b.ghost ? ' ghost' : '');
      if (b.link) return ext(L[b.link], b.label, cls);
      if (b.dl) return `<a class="${cls}" href="${FILE_BASE}${encodeURIComponent(b.dl)}" download>${esc(b.label)}</a>`;
      return `<a class="${cls}" href="${esc(b.href)}">${esc(b.label)}</a>`; };
    $('#downloadGroups').innerHTML = D.files.map(g => `<h3 class="dl-h">${esc(g.group)}</h3><div class="hb-band">${g.items.map(([f, d]) =>
      `<div class="hb-col"><strong>${esc(f)}</strong><span>${esc(d)}</span><div><a href="${FILE_BASE}${encodeURIComponent(f)}.pdf" download>PDF 받기</a><a href="${FILE_BASE}${encodeURIComponent(f)}.docx" download>DOCX 받기</a></div></div>`).join('')}</div>`).join('');
    $('#downloadTools').innerHTML = `<h3 class="dl-h">실습 도구 · 구글 시트, 구글 폼, Apps Script</h3><div class="tool-list">${D.tools.map(t =>
      `<div class="dl-item tool-item"><div><strong>${esc(t.t)}</strong><span>${esc(t.d)}</span></div><div class="btn-pair">${t.btns.map(toolBtn).join('')}</div></div>`).join('')}</div>`;
    /* ⑨ 막힐 때 */
    $('#helpList').innerHTML = `<div class="two-col">${F.help.map(h => `<div class="result-card"><strong>${esc(h[0])}</strong><p>${esc(h[1])}</p></div>`).join('')}</div>`;
  }

  /* ---------- START 장표 ---------- */
  const ST = D.start;
  const srcLine = (t, u, u2) => `<p class="src">출처: ${esc(t)}${[u, u2].filter(Boolean).map((l, i, arr) => ` · <a href="${esc(l)}" target="_blank" rel="noopener noreferrer">원문 보기${arr.length > 1 ? ' ' + (i + 1) : ''}</a>`).join('')}</p>`;
  const ul = arr => `<ul class="bl">${arr.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  const so = (t, label) => (t ? `<p class="so"><b>${esc(label || '의미')}</b>${esc(t)}</p>` : '');
  const srcFold = (t, u, u2) => `<details class="srcd"><summary>출처: ${esc(String(t).split(/, | \/ |; |「|『|\((?!\d{4})/)[0].trim())}</summary>${srcLine(t, u, u2)}</details>`;
  const gi = g => SLIDES.findIndex(s => s.g === g);
  const HL = ['AI 네이티브', '오케스트라 인재', '커리어 민첩성', '롱제비티'];
  const SLIDES = [
    { g: 0, nav: '시작', title: '세 가지 키워드', html: () => `<span class="slide-kicker">START · AI 활용 취업지원 실무</span><h1>변화, 트렌드, 역할</h1>
      <p class="slide-lead">실습 전에 보는 세 가지 키워드</p>
      <div class="kw3"><a href="#start-${gi(1)}"><b>KEYWORD 1</b><strong>변화</strong><span>구직자의 변화 · 고용서비스업 종사자의 변화</span></a>
      <a href="#start-${gi(2)}"><b>KEYWORD 2</b><strong>트렌드</strong><span>2027년 채용 트렌드 10가지 · 2026년과 달라진 4가지</span></a>
      <a href="#start-${gi(3)}"><b>KEYWORD 3</b><strong>역할</strong><span>사례로 보는 구직자의 마음 · 우리의 역할 3S</span></a></div>` },
    { g: 1, nav: '1-1', title: '구직자가 맞이하는 변화', html: () => `<span class="slide-kicker">1. 변화 · 1) 구직자</span><h1>구직자가 맞이하는 변화</h1>
      <div class="stat3">${ST.seeker.map(x => `<div class="stat"><em>${esc(x.tag)}</em><strong>${esc(x.num)}</strong><div class="cap">${esc(x.cap)}</div>${ul(x.pts)}${so(x.so)}${srcFold(x.src, x.url, x.url2)}</div>`).join('')}</div>` },
    ...[['a', '새로운 과제', 0], ['b', '숙련과 전문성', 2]].map(([key, sub, from]) => ({ g: 1, nav: `1-2${key}`, title: `종사자가 맞이하는 변화 · ${sub}`, html: () => `<span class="slide-kicker">1. 변화 · 2) 고용서비스업 종사자 · ${from ? '②' : '①'} ${esc(sub)}</span><h1>종사자가 맞이하는 변화</h1>
      <div class="pts">${ST.worker.slice(from, from + 2).map((x, i) => `<div class="pt"><b>0${from + i + 1}</b><strong>${esc(x.h)}</strong>${ul(x.pts)}${so(x.so)}${srcFold(x.src)}</div>`).join('')}</div>` })),
    { g: 1, nav: '1-3', title: '변화 정리', html: () => `<span class="slide-kicker">1. 변화 · 정리</span><h1>구직자도 종사자도 AI와 함께 일하게 됨</h1>
      <div class="recap"><div class="recap-col"><b>구직자</b>${ST.seeker_note.slice(0, 3).map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="recap-col"><b>고용서비스업 종사자</b>${ST.worker_note.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>
      <div class="note">${esc(ST.seeker_note[3])}</div>` },
    ...[0, 5].map(from => ({ g: 2, nav: `2-1${from ? 'b' : 'a'}`, title: `2027년 채용 트렌드 · ${from ? '06~10' : '01~05'}`, html: () => `<span class="slide-kicker">2. 트렌드 · 3) 2027년 채용 트렌드 · ${from ? '② 06~10' : '① 01~05'}</span><h1>2027년 채용 트렌드 10가지</h1>
      <p class="slide-lead">${from ? '짙은 색 네 가지(AI 네이티브, 오케스트라 인재, 커리어 민첩성, 롱제비티)는 다음 장에서 2026년과 비교' : '왼쪽은 키워드와 한 줄 뜻, 오른쪽은 달라지는 점과 상담에서 쓸 점 · 06~10은 다음 장'}</p>
      <div class="t5">${ST.trend27.slice(from, from + 5).map((k, j) => `<div class="t5-row${HL.includes(k[0]) ? ' hl' : ''}"><div class="t5-key"><b>${String(from + j + 1).padStart(2, '0')}</b><strong>${esc(k[0])}</strong><span>${esc(k[1])}</span></div><div class="t5-body">${ul(k[2])}<p class="t5-tip"><b>상담에서</b>${esc(k[3])}</p></div></div>`).join('')}</div>
      ${srcFold(ST.trend27_src, ST.trend27_url)}` })),
    { g: 2, nav: '2-2', title: '2026년과 달라진 점', html: () => `<span class="slide-kicker">2. 트렌드 · 4) 2026년과 달라진 점</span><h1>같은 주제, 한 단계 더 나아간 요구</h1>
      <p class="slide-lead">2027년 키워드 네 가지 · 2026년 키워드와 비교</p>
      <div class="shift2">${ST.shift.map(r => `<div class="shift-card"><div class="shift-head"><span class="y26"><small>2026</small>${esc(r[0])}</span><span class="arr">→</span><span class="y27"><small>2027</small>${esc(r[1])}</span></div><ul class="yy"><li class="was"><b>2026</b>${esc(r[2])}</li><li><b>2027</b>${esc(r[3])}</li><li class="tip"><b>상담에서</b>${esc(r[4])}</li></ul><i>${esc(r[5])}</i></div>`).join('')}</div>
      <details class="srcd"><summary>출처와 2026년 10대 키워드</summary><p class="src">2026년 10대 키워드: ${esc(ST.trend26.join(', '))}</p>${srcLine(ST.trend26_src, ST.trend26_url)}<p class="src">${esc(ST.shift_note)}</p></details>` },
    ...ST.cases.map((cs, i) => ({ g: 3, nav: `3-1${i ? 'b' : 'a'}`, title: `${cs.no} · 구직자의 마음`, html: () => `<span class="slide-kicker">3. 역할 · 1) 사례로 알아보는 구직자의 마음 · ${esc(cs.no)}</span><h1>${esc(cs.title)}</h1>
      <div class="case"><div class="case-what"><b>현장에서 자주 보는 장면</b>${ul(cs.what)}</div>
      <div class="bubbles"><b>구직자의 마음</b>${cs.mind.map(m => `<div class="bubble">${esc(m)}</div>`).join('')}</div></div>
      <div class="note">${esc(cs.lack)}</div><p class="src">${esc(ST.cases_note)}</p>` })),
    { g: 3, nav: '3-2', title: '우리의 역할 3S', html: () => `<span class="slide-kicker">3. 역할 · 2) 그렇다면 우리의 역할은?</span><h1>우리의 역할 3S</h1>
      <div class="s3g">${ST.s3.map((x, i) => `<section class="s3c">
        <header><b>0${i + 1}</b><strong><i>S</i>${esc(x.k.slice(1))}</strong><em>${esc(x.ko)}</em></header>
        <div class="s3r"><span class="lab">왜 필요한가</span><p>${esc(x.so)}</p></div>
        <div class="s3r"><span class="lab">어떻게 하는가</span>${ul(x.pts)}</div>
        <div class="s3r s3go"><span class="lab">오늘 실습</span><a class="g-btn ghost" href="${esc(x.href)}">${esc(x.do)} →</a></div>
      </section>`).join('')}</div>
      <details class="srcd"><summary>3S의 근거</summary><p class="src">${esc(ST.s3_note)}</p></details>` },
  ];
  const GROUPS = ['시작', '변화', '트렌드', '역할'];
  let deckIdx = 0;
  function renderStart(i) {
    deckIdx = Math.max(0, Math.min(SLIDES.length - 1, i || 0));
    const sl = SLIDES[deckIdx];
    $('#deckWhere').textContent = sl.title;
    $('#deckSlide').innerHTML = sl.html();
    $('#deckTabs').innerHTML = GROUPS.map((g, gi) => `<button type="button" role="tab" data-i="${SLIDES.findIndex(s => s.g === gi)}" class="${sl.g === gi ? 'on' : ''}">${gi ? `<b>${gi}</b>` : ''}${esc(g)}</button>`).join('');
    $('#deckDots').innerHTML = SLIDES.map((s, si) => `<button type="button" data-i="${si}" class="${si === deckIdx ? 'on' : ''}" aria-label="${esc(s.title)}" title="${esc(s.title)}"></button>`).join('');
    $('#viewStart').querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { location.hash = '#start-' + b.dataset.i; }));
    $('#deckPrev').disabled = deckIdx === 0;
    $('#deckNext').textContent = deckIdx === SLIDES.length - 1 ? '실습 워크플로우로 →' : '다음 →';
  }
  $('#deckPrev').addEventListener('click', () => { if (deckIdx > 0) location.hash = '#start-' + (deckIdx - 1); });
  $('#deckNext').addEventListener('click', () => { location.hash = deckIdx === SLIDES.length - 1 ? '#flow' : '#start-' + (deckIdx + 1); });
  document.addEventListener('keydown', e => {
    if ($('#viewStart').hidden || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' && deckIdx < SLIDES.length - 1) location.hash = '#start-' + (deckIdx + 1);
    if (e.key === 'ArrowLeft' && deckIdx > 0) location.hash = '#start-' + (deckIdx - 1);
  });


  /* ---------- 취업상담 워크플로우 ---------- */
  /* 1단계 아래: ① 시트 받기(두 파일 저장·실행, 오류 이유) ② 자유 실습(생성형 AI에게 질문해 폼 만들기 코드 받기) */
  function keyCompareHtml() {
    const K = D.keyCompare;
    return `<section class="make-form" id="flow-key"><h3>API 키 없이 할까, 등록하고 할까</h3><p>${esc(K.lead)}</p>
      <div class="two-col make-cols">${K.ways.map(w => `<div class="result-card key-card"><span class="way-tag${w.on ? ' on' : ''}">${esc(w.tag)}</span><strong>${esc(w.name)}</strong><p class="key-how">${esc(w.how)}</p>
        <b class="pc good">장점</b>${ul(w.good)}<b class="pc bad">단점</b>${ul(w.bad)}
        <div class="key-sample"><b>${esc(w.label)}</b>${w.sample.map(t => `<p>${esc(t)}</p>`).join('')}</div></div>`).join('')}</div>
      <p class="local-note">${esc(K.note)}</p></section>`;
  }
  function formMakeHtml() {
    const scriptHref = FILE_BASE + encodeURIComponent(D.scriptFile);
    return `<div class="make-form" id="flow-form"><h3>${esc(FM.setup_h)}</h3><p>${esc(FM.setup_lead)}</p>
      <div class="sheet-actions">${ext(L.copy, '내 사본 만들기')}${ext(L.sheet, '시트 미리 보기', 'g-btn ghost')}</div>
      ${ol(FM.setup)}<p class="local-note">${esc(FM.setup_note)}</p>
      <figure class="make-shot"><img src="${esc(FM.shot)}" alt="${esc(FM.shot_alt)}" width="1600" height="598" loading="lazy"><figcaption>${esc(FM.shot_cap)}</figcaption></figure>
      <section class="way" id="flow-errors"><h4>${esc(FM.err_h)}</h4><p>${esc(FM.err_lead)}</p>
        <div class="g-table err-table"><table><thead><tr><th>로그의 숫자</th><th>이유</th><th>할 일</th></tr></thead><tbody>${FM.errors.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>
        <p class="local-note">${esc(FM.err_note)}</p>
        <h4 class="sub">${esc(FM.key_h)}</h4>${ul(FM.key)}
        <p class="src">출처: ${FM.err_src.map(x => `<a href="${esc(x[1])}" target="_blank" rel="noopener noreferrer">${esc(x[0])}</a>`).join(' · ')} (${esc(FM.err_src_date)})</p>
      </section>
      <details class="fold"><summary>사전 질문지 내용 · 질문 12개 (올라가 있는 구글 폼과 같음)</summary><div class="fold-b">
        <dl class="form-meta"><dt>제목</dt><dd>${esc(FM.title)}</dd><dt>안내문</dt><dd>${esc(FM.intro)}</dd><dt>제출 뒤 문구</dt><dd>${esc(FM.done)}</dd></dl>
        <div class="g-table"><table><thead><tr><th>#</th><th>질문 제목</th><th>도움말</th><th>형식</th><th>필수</th></tr></thead><tbody>${FM.questions.map((q, i) => `<tr><td>${i + 1}</td><td>${esc(q[0])}</td><td>${esc(q[3])}</td><td>${esc(q[1])}</td><td>${esc(q[2])}</td></tr>`).join('')}</tbody></table></div>
        <p class="local-note">질문 제목은 "구직자 정보" 탭의 열 제목과 글자가 같아야 등록됩니다. ${esc(FM.copy_note)}</p></div></details>
      <details class="fold"><summary>"구직자 사전질문지" 파일이 없을 때 붙여 넣는 코드</summary><div class="fold-b"><div class="sheet-actions script-get"><a class="g-btn ghost" href="${scriptHref}" download>코드 파일 받기</a><span class="local-note">파일과 아래 코드는 같은 내용입니다.</span></div>${copyBox(FM.code, 'createMyJobseekerForm', '코드 복사')}</div></details>
      <details class="fold"><summary>참고 · 다른 방법으로 사전 질문지 만들기</summary><div class="fold-b">
        ${so(FM.builtin, '시트에 들어 있는 기능')}
        <p><strong>구글 폼에서 손으로 만들기</strong></p>${ol(FM.manual)}<p class="local-note">${esc(FM.manual_note)}</p></div></details>
    </div>
    <div class="make-form" id="flow-free"><h3>${esc(FM.free_h)}</h3><p>${esc(FM.free_lead)}</p>
      <div class="ask3">${FM.free_ask.map((q, i) => `<div class="ask"><b>0${i + 1}</b><strong>${esc(q[0])}</strong><span>${esc(q[1])}</span></div>`).join('')}</div>
      ${ol(FM.free)}
      <div class="sheet-actions">${ext('https://forms.google.com/', '구글 폼 열기')}</div>
      ${copyBox(FM.free_q1, '질문 1 · 문항 정하기', '질문 복사')}
      ${copyBox(FM.free_q2, '질문 2 · 코드 받기', '질문 복사')}
      <p class="local-note">${esc(FM.free_note)}</p>
      <details class="fold" id="flow-form-diy"><summary>예시 · AI에게 받는 코드는 이런 모양 (가상의 만족도 조사)</summary><div class="fold-b">
        <p>${esc(FM.diy_lead)}</p>
        <div class="g-table"><table><thead><tr><th>#</th><th>질문 제목</th><th>형식</th><th>필수</th></tr></thead><tbody>${FM.diy_questions.map((q, i) => `<tr><td>${i + 1}</td><td>${esc(q[0])}</td><td>${esc(q[1])}</td><td>${esc(q[2])}</td></tr>`).join('')}</tbody></table></div>
        <p class="local-note">${esc(FM.diy_note)}</p>${copyBox(FM.diy_code, 'createPracticeSurvey', '코드 복사')}</div></details>
    </div>`;
  }
  /* 개별 실습: agent-lab의 화면을 같은 사이트 안에서 그대로 보여 준다(같은 출처의 iframe). */
  let mineTimer = null;
  function tidyFrame() {
    const f = $('#mineFrame');
    let doc; try { doc = f.contentDocument; } catch (e) { return; }
    if (!doc || !doc.body) return;
    ['.g-header', '.g-footer', '.breadcrumb', '.lesson-navigation'].forEach(sel => doc.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; }));
    const main = doc.querySelector('main');
    const h = Math.ceil((main ? main.getBoundingClientRect().height : doc.body.scrollHeight) + 24);
    if (h > 200 && Math.abs(h - f.offsetHeight) > 4) f.style.height = h + 'px';
  }
  function renderMine(tabId) {
    const tab = M.tabs.find(t => t.id === tabId) || M.tabs[0];
    $('#mineTitle').textContent = M.title;
    $('#mineLead').textContent = M.lead;
    $('#mineTabs').innerHTML = M.tabs.map(t => `<a class="${t === tab ? 'on' : ''}" href="#mine-${t.id}">${esc(t.label)}</a>`).join('') +
      (tab.src ? `<a class="open-new" href="${esc(tab.src)}" target="_blank" rel="noopener">새 탭에서 열기</a>` : '');
    const f = $('#mineFrame');
    const panel = $('#minePanel');
    clearInterval(mineTimer);
    if (tab.panel) {
      const P = M.prompt;
      f.hidden = true; panel.hidden = false;
      panel.innerHTML = `<div class="wrap"><section class="prompt-pull"><h2>강사 스튜디오에서 프롬프트 뽑기</h2><p>${esc(P.why)}</p>
        <div class="go-studio"><p><b>강사 스튜디오</b> — 값을 넣고 프롬프트를 만드는 곳. 새 탭으로 열립니다.</p><div class="btn-pair">${ext(L.studio, '강사 스튜디오 열기')}${ext(L.chat, 'Claude 새 채팅 열기', 'g-btn ghost')}</div></div>
        <h3>순서</h3>${ol(P.steps)}
        <h3>알아 둘 것</h3>${ul(P.notes)}</section></div>`;
      return;
    }
    f.hidden = false; panel.hidden = true;
    f.title = tab.label;
    if (f.dataset.tab !== tab.id) {
      f.dataset.tab = tab.id;
      if (f.dataset.loaded) { try { f.contentWindow.location.hash = tab.hash; } catch (e) { f.src = tab.src; } }
      else { f.src = tab.src; f.addEventListener('load', () => { f.dataset.loaded = '1'; tidyFrame(); }); }
    }
    mineTimer = setInterval(() => { if ($('#viewMine').hidden) { clearInterval(mineTimer); return; } tidyFrame(); }, 400);
    tidyFrame();
  }
  /* 준비물 확인 표시는 이 기기에만 저장한다 */
  const PREP_KEY = 'jobAiLab.prep.v1';
  let PREP; try { PREP = JSON.parse(localStorage.getItem(PREP_KEY) || '{}'); } catch (e) { PREP = {}; }
  const savePrep = () => { try { localStorage.setItem(PREP_KEY, JSON.stringify(PREP)); } catch (e) { /* 저장 불가 시 무시 */ } };
  const prepNeed = s => s.prep.filter(x => !x.opt);
  const prepDone = s => prepNeed(s).filter(x => PREP[x.id]).length;
  function prepAction(x) {
    if (x.link) return ext(L[x.link], x.label, 'g-btn ghost');
    if (x.file) return `<a class="g-btn ghost" href="${FILE_BASE}${encodeURIComponent(x.file)}.pdf" download>${esc(x.label)}</a>`;
    if (x.href) return `<a class="g-btn ghost" href="${esc(x.href)}">${esc(x.label)}</a>`;
    if (x.url) return ext(x.url, x.label, 'g-btn ghost');
    return '';
  }
  function flowToc(active) {
    $('#flowToc').innerHTML = '<strong>목차</strong>' +
      `<a href="#flow" class="${active === 'all' ? 'toc-run' : ''}">전체 과정</a>` +
      F.steps.map(s => `<a href="#flow-${s.no}" class="${active === s.no ? 'toc-run' : ''}">${s.no}단계 · ${esc(s.title)}</a>`).join('') +
      `<a href="#flow-why">이 워크플로우의 의미</a><a href="#flow-tabs">시트 탭 구성</a>`;
  }
  function renderStep(no) {
    const s = F.steps.find(x => x.no === no);
    const idx = F.steps.indexOf(s);
    $('#flowCrumb').textContent = `취업상담 워크플로우 › ${s.no}단계`;
    $('#flowEyebrow').textContent = `PRACTICE · ${s.no}단계 / ${F.steps.length}단계`;
    $('#flowTitle').textContent = s.title;
    $('#flowLead').textContent = s.out;
    $('#flowMeta').innerHTML = `<span class="meta-chip active">쓰는 탭 · ${esc(s.tab)}</span>${s.run ? `<span class="meta-chip">실행 단추 · ${esc(s.run)}</span>` : ''}`;
    flowToc(s.no);
    const prev = idx === 0 ? ['#flow', '전체 과정'] : [`#flow-${F.steps[idx - 1].no}`, `${F.steps[idx - 1].no}단계 · ${F.steps[idx - 1].title}`];
    const next = idx === F.steps.length - 1 ? ['#mine', `개별 실습 · ${M.title}`] : [`#flow-${F.steps[idx + 1].no}`, `${F.steps[idx + 1].no}단계 · ${F.steps[idx + 1].title}`];
    $('#flowBody').innerHTML = `<section id="flow-${s.no}-prep"><span class="section-number">1</span><h2>준비물 확인</h2>
        <p>아래 준비물을 받았는지 확인하고 체크합니다. 모두 체크하면 바로 시작합니다.</p>
        <div class="prep-list">${s.prep.map(x => `<div class="prep-row${x.opt ? ' opt' : ''}"><label><input type="checkbox" data-prep="${esc(x.id)}" ${PREP[x.id] ? 'checked' : ''}><span><strong>${esc(x.t)}${x.opt ? ' <em>선택</em>' : ''}</strong><small>${esc(x.d)}</small></span></label>${prepAction(x)}</div>`).join('')}</div>
        <div class="prep-status" id="prepStatus"></div></section>
      <section id="flow-${s.no}-do"><span class="section-number">2</span><h2>시작하기 · 시트에서 하는 일</h2>${ul(s.do)}
        <div class="out-box"><b>상담에 남는 결과</b><p>${esc(s.out)}</p></div></section>
      ${s.no === '1' ? `<section id="flow-form-wrap">${formMakeHtml()}</section>` : ''}
      ${s.no === '3' ? keyCompareHtml() : ''}
      <div class="lesson-navigation"><a href="${prev[0]}"><span>이전</span><strong>${esc(prev[1])}</strong></a><a class="lesson-next" href="${next[0]}"><span>다음</span><strong>${esc(next[1])}</strong></a></div>`;
    const status = () => {
      const need = prepNeed(s).length, done = prepDone(s), ok = done === need;
      $('#prepStatus').className = 'prep-status' + (ok ? ' ok' : '');
      $('#prepStatus').innerHTML = ok
        ? `<b>준비 완료</b><span>필수 준비물 ${need}개를 모두 확인했습니다.</span><a class="g-btn" href="#flow-${s.no}-do" id="prepGo">바로 시작하기</a>`
        : `<b>준비물 ${done} / ${need}</b><span>체크하지 않은 준비물을 먼저 받습니다.</span>`;
      const go = $('#prepGo');
      if (go) go.addEventListener('click', e => { e.preventDefault(); document.getElementById(`flow-${s.no}-do`).scrollIntoView({ block: 'start' }); });
    };
    $('#flowBody').querySelectorAll('[data-prep]').forEach(c => c.addEventListener('change', () => { PREP[c.dataset.prep] = c.checked; savePrep(); status(); }));
    status();
    bindCopy($('#flowBody'));
  }
  function renderFlow() {
    $('#flowCrumb').textContent = '취업상담 워크플로우';
    $('#flowEyebrow').textContent = 'PRACTICE · 5단계';
    $('#flowTitle').textContent = F.title;
    $('#flowLead').textContent = F.lead;
    $('#flowMeta').innerHTML = `${ext(L.copy, '자동화 시트 받기 (내 사본 만들기)')}${ext(L.sheet, '시트 미리 보기', 'g-btn ghost')}${ext(L.form, '사전 질문지 미리 보기', 'g-btn ghost')}`;
    flowToc('all');
    const secs = [
      ['all', '전체 과정', `<p>단계를 누르면 그 단계의 준비물 확인부터 시작합니다.</p>
        <div class="step-list">${F.steps.map(s => `<a class="step-row" href="#flow-${s.no}"><b>${s.no}</b><div><strong>${esc(s.title)}</strong><span>${esc(s.out)}</span></div><em>${esc(s.tab)}</em><i>준비물 ${prepDone(s)}/${prepNeed(s).length}</i></a>`).join('')}</div>
        <div class="safety-box mt16"><strong>실습에서는 가상 정보만 입력</strong><p>질문지와 시트에는 실제 구직자의 이름, 연락처, 주소를 넣지 않습니다. 자료 받기의 가상 구직자 서류와 가상 채용공고를 씁니다.</p></div>`],
      ['why', '이 워크플로우의 의미', `<div class="why3">${F.meaning.map((m, i) => `<div class="pt"><b>0${i + 1}</b><strong>${esc(m.h)}</strong>${ul(m.pts)}${so(m.so)}</div>`).join('')}</div>`],
      ['tabs', '시트 탭 구성', `<div class="g-table"><table><thead><tr><th>탭</th><th>쓰임</th></tr></thead><tbody>${F.tabs.map(t => `<tr><td>${esc(t[0])}</td><td>${esc(t[1])}</td></tr>`).join('')}</tbody></table></div>
        <p class="local-note">자세한 사용 순서는 시트의 "자동화 버튼" 탭에 있는 안내를 따릅니다.</p>`],
    ];
    $('#flowBody').innerHTML = secs.map(s => `<section id="flow-${s[0]}"><h2>${esc(s[1])}</h2>${s[2]}</section>`).join('') +
      `<div class="lesson-navigation"><a href="#start"><span>이전</span><strong>START · 변화, 트렌드, 역할</strong></a><a class="lesson-next" href="#flow-1"><span>다음</span><strong>1단계 · ${esc(F.steps[0].title)}</strong></a></div>`;
  }

  /* ---------- 바로가기 ---------- */
  function renderQuick() {
    const groups = [
      ['수업 준비', [['ai-test/', '검사', 'AI 역량검사'], ['who/', '레벨', '나는 어떤 AI 사용자?']]],
      ['강의 · 세 가지 키워드', SLIDES.map((s, i) => ['#start-' + i, s.nav, s.title])],
      ['실습 5단계', [['#flow', '안내', '전체 과정'], ...F.steps.map(s => ['#flow-' + s.no, s.no + '단계', s.title]), ['#flow-form', '시트', '구직자 정보, 구인정보 등 시트 받기'], ['#flow-key', '키', 'API 키 없이 / 등록하고 · 장단점'], ['#flow-errors', '오류', 'API 키를 넣었는데 결과가 안 만들어질 때'], ['#flow-free', '자유', '자유 실습 · 구글 폼을 Apps Script로 만들기'], ['#flow-why', '의미', '이 워크플로우의 의미'], ['#flow-tabs', '탭', '시트 탭 구성']]],
      ['내 에이전트', M.tabs.map(t => ['#mine-' + t.id, '개별', t.label])],
      ['체험해 보기', T.items.map((x, i) => [x.url, '체험 ' + (i + 1), x.title])],
      ['자료실과 도움말', [['#downloads', '자료', '자료실 · 상담자용 시트, Apps Script, 가상 사례'], ['#privacy', '유의', '실제 구직자 정보를 다룰 때'], ['#help', '도움', '막힐 때']]],
    ];
    $('#quickPanel').innerHTML = groups.map(g => `<div class="menu-group"><strong>${esc(g[0])}</strong>${g[1].map(x => `<a href="${esc(x[0])}"${/^https?:/.test(x[0]) ? ' target="_blank" rel="noopener noreferrer"' : ''}><span>${esc(x[1])}</span>${esc(x[2])}</a>`).join('')}</div>`).join('');
    $('#quickPanel').addEventListener('click', e => { if (e.target.closest('a')) $('#quickMenu').open = false; });
    document.addEventListener('click', e => { if (!e.target.closest('#quickMenu')) $('#quickMenu').open = false; });
  }

  /* ---------- 라우팅 ---------- */
  const HOME_SECS = ['before', 'try', 'downloads', 'privacy', 'help'];
  function route() {
    const h = (location.hash || '#home').replace('#', '');
    const [view, sub] = h.split('-');
    ['#viewHome', '#viewStart', '#viewFlow', '#viewMine'].forEach(v => { $(v).hidden = true; });
    $('#quickMenu').open = false;
    let target = null;
    if (view === 'start') { $('#viewStart').hidden = false; renderStart(Number(sub) || 0); }
    else if (view === 'flow') {
      $('#viewFlow').hidden = false;
      if (/^[1-5]$/.test(sub || '')) renderStep(sub);
      else if (['form', 'free', 'errors'].includes(sub)) { renderStep('1'); target = document.getElementById('flow-' + sub); }
      else if (sub === 'key') { renderStep('3'); target = document.getElementById('flow-key'); }
      else { renderFlow(); if (sub) target = document.getElementById(h); }
    }
    else if (view === 'mine') { $('#viewMine').hidden = false; renderMine(sub); }
    else { $('#viewHome').hidden = false; renderHome(); if (HOME_SECS.includes(view)) target = document.getElementById('sec-' + view); }
    requestAnimationFrame(() => { if (target) target.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); });
  }

  renderHome();
  renderQuick();
  window.addEventListener('hashchange', route);
  route();
})();
