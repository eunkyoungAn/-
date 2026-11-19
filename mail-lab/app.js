/* 메일 자동화 실습실 — 화면 전환, START 장표, 4단계 실습, 메모·검수 표시.
   입력한 내용은 어디에도 보내지 않으며 이 기기의 localStorage에만 저장한다. */
(function () {
  'use strict';
  const D = window.LAB;
  const $ = (s, el) => (el || document).querySelector(s);
  const KEY = 'mailLab.v1';

  let S;
  try { S = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { S = {}; }
  S.checks = S.checks || {};
  S.notes = S.notes || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 불가 시 무시 */ } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ul = a => `<ul class="plain">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
  let CODE = '';

  /* ---------- 공용 ---------- */
  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); flash(btn, '복사됨'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); flash(btn, '복사됨'); } catch (_) { flash(btn, 'Ctrl+C로 복사'); }
      document.body.removeChild(ta);
    }
  }
  function flash(btn, msg) { if (!btn) return; const o = btn.textContent; btn.textContent = msg; setTimeout(() => { btn.textContent = o; }, 1400); }
  function promptBox(text, label, cls) {
    return `<div class="prompt-box tall${cls ? ' ' + cls : ''}"><span class="box-label">${esc(label || '요청문')}</span><button class="copy-button" type="button">복사</button><pre>${esc(text)}</pre></div>`;
  }
  function bindCopy(root) {
    root.querySelectorAll('.copy-button').forEach(b => b.addEventListener('click', () => copyText(b.parentElement.querySelector('pre').textContent, b)));
  }
  function noteBox(id, label, ph) {
    return `<div class="paste-box"><label for="n-${id}">${esc(label)}</label><textarea id="n-${id}" data-note="${id}" placeholder="${esc(ph)}">${esc(S.notes[id] || '')}</textarea></div>`;
  }
  function bindNotes(root) {
    root.querySelectorAll('[data-note]').forEach(t => t.addEventListener('input', () => { S.notes[t.dataset.note] = t.value; save(); }));
  }
  function checklist(key, items) {
    return `<div class="checklist">${items.map((x, i) => `<label class="check-item"><input type="checkbox" data-k="${key}.${i}" ${S.checks[`${key}.${i}`] ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('')}</div>`;
  }
  function bindChecks(root) {
    root.querySelectorAll('.check-item input').forEach(i => i.addEventListener('change', () => { S.checks[i.dataset.k] = i.checked; save(); }));
  }
  function table(head, rows) {
    return `<div class="g-table"><table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function codeBlock() {
    return `<div class="go-studio mt16"><p><b>참고 코드</b> — Gemini 코드가 계속 맞지 않을 때 이 코드를 그대로 붙여 넣습니다. 메뉴 이름과 기능이 2단계 요청문과 같습니다.</p><a class="g-btn ghost" href="${esc(D.codeFile)}" download>파일 받기</a></div>
      ${CODE ? promptBox(CODE, '참고 코드 (Code.gs)', 'cn-code') : `<p class="local-note">파일 받기로 내려받아 메모장에서 열고 전체 복사합니다.</p>`}`;
  }

  /* ---------- 진행 ---------- */
  function stageDone(id) {
    const items = id === 'review' ? D.review.checks : D.stages.find(s => s.id === id).checks;
    return items.every((_, i) => S.checks[`${id}.${i}`]);
  }
  function renderProgress() {
    const n = D.stages.filter(s => stageDone(s.id)).length;
    $('#pgNum').textContent = `${n} / ${D.stages.length}`;
    $('#pgBar').style.width = (n / D.stages.length * 100) + '%';
  }

  /* ---------- 시작 화면 ---------- */
  const FLOW = [
    ['Google Sheets', '목록 만들기', '이메일 주소 · 이름 · 발송 결과 3열'],
    ['Gemini', '코드 받기', '원하는 기능을 번호로 나눠 요청'],
    ['Apps Script', '붙여 넣고 저장', '제목·본문만 내 내용으로'],
    ['Gmail', '테스트 → 전체 발송', '권한 승인 후 나에게 먼저']
  ];
  function flowHtml(cls) {
    return `<ol class="cn-flow${cls ? ' ' + cls : ''}">${FLOW.map((f, i) => `<li><b>${i + 1}</b><div><strong>${esc(f[1])}</strong><span>${esc(f[0])} · ${esc(f[2])}</span></div></li>`).join('')}</ol>`;
  }
  function renderHome() {
    $('#homeFlow').outerHTML = flowHtml().replace('<ol class="cn-flow">', '<ol class="cn-flow" id="homeFlow">');
    $('#homeStages').innerHTML = `<section class="level-section">
      <div class="level-head"><div><span class="level-kicker">PRACTICE</span><h2>실습 4단계와 마무리</h2></div>
      <p>시트 목록에서 시작해 Gemini 코드, Apps Script 저장, 테스트 발송까지 이어집니다. 각 단계 끝의 검수 항목을 모두 확인하면 완료로 셉니다.</p></div>
      <div class="lesson-grid">${D.stages.map(s => `<a class="lesson-card ${stageDone(s.id) ? 'is-done' : ''}" href="#${s.id}">
        <span class="lesson-code">${esc(s.kicker)} · ${esc(s.time)}</span><h3>${esc(s.title)}</h3><p>${esc(s.goal[0])}</p>
        <div class="lesson-output">산출물 <span>${esc(s.output)}</span></div><div class="lesson-arrow">${esc(s.role)} →</div></a>`).join('')}
      <a class="lesson-card ${stageDone('review') ? 'is-done' : ''}" href="#review"><span class="lesson-code">WRAP-UP · ${esc(D.review.time)}</span><h3>발송 전 체크와 돌아보기</h3><p>AI가 만든 메일을 바로 보내지 않고 체크리스트로 다시 읽습니다.</p><div class="lesson-output">산출물 <span>체크 완료</span></div><div class="lesson-arrow">마무리 →</div></a>
      </div></section>`;
    renderProgress();
  }
  function renderStatic() {
    $('#timelineTable').innerHTML = '<thead><tr><th>시간</th><th>구분</th><th>단계</th><th>내용</th><th>산출물</th></tr></thead><tbody>' +
      D.timeline.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') + '</tbody>';
    $('#materialBox').innerHTML = promptBox(D.stages[1].prompt.text, '코드 요청문 (2단계)') + codeBlock();
    bindCopy($('#materialBox'));
    $('#helpList').innerHTML = `<div class="two-col">${D.help.map(h => `<div class="result-card"><strong>${esc(h[0])}</strong><p>${esc(h[1])}</p></div>`).join('')}</div>`;
    $('#sourceList').innerHTML = D.sources.map(s => `<li>${esc(s).replace(/(https?:\/\/\S+)/, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}</li>`).join('');
    $('#sourceList').classList.add('sources-ol');
  }

  /* ---------- 단계 화면 ---------- */
  function renderStage(id) {
    const st = D.stages.find(s => s.id === id);
    $('#bcStage').textContent = `${st.no}단계 ${st.title}`;
    $('#shEyebrow').textContent = `${st.kicker} · ${st.role}`;
    $('#shTitle').textContent = st.title;
    $('#shSum').textContent = st.goal.join(' ');
    $('#shMeta').innerHTML = `<span class="meta-chip active">${esc(st.time)}</span><span class="meta-chip">산출물 · ${esc(st.output)}</span>`;
    const secs = [];
    let goal = `<ul class="plain">${st.goal.map(g => `<li>${esc(g)}</li>`).join('')}</ul><h3>이 단계에 필요한 것</h3>${ul(st.input)}`;
    if (st.warn) goal += `<div class="safety-box mt16"><strong>꼭 지킬 것</strong><p>${esc(st.warn)}</p></div>`;
    secs.push(['goal', '학습 목표와 준비', goal]);
    let steps = `<ol class="plain">${st.steps.map(x => `<li>${x}</li>`).join('')}</ol>`;
    if (id === 's1') steps += `<h3>시트 구성</h3>${table(['열', '1행 제목', '메모'], D.sheet)}`;
    if (st.snippet) steps += `<h3>코드 맨 위, 이 세 줄만 고칩니다</h3>${promptBox(st.snippet, '고칠 곳 예시 (변수 이름은 코드마다 다를 수 있음)', 'cn-code')}`;
    secs.push(['steps', '순서', steps]);
    if (st.prompt) secs.push(['prompt', '요청문 (복사해서 붙여 넣기)', promptBox(st.prompt.text, st.prompt.label)]);
    if (st.code) secs.push(['code', '참고 코드 (막힐 때)', codeBlock()]);
    secs.push(['note', '내 기록', st.fields.map(f => noteBox(`${id}.${f[0]}`, f[1], f[2])).join('') + '<p class="local-note">이 칸은 이 기기 브라우저에만 저장됩니다.</p>']);
    secs.push(['check', '검수', checklist(id, st.checks) + `<h3>성찰 질문</h3><p>${esc(st.reflect)}</p>`]);
    const n = Number(st.no), last = D.stages.length;
    const prev = n === 1 ? ['#start', 'START · AI, 자동화, 안전'] : [`#s${n - 1}`, `${n - 1}단계 · ${D.stages[n - 2].title}`];
    const next = n === last ? ['#review', '마무리 · 발송 전 체크'] : [`#s${n + 1}`, `${n + 1}단계 · ${D.stages[n].title}`];
    paint(id, secs, prev, next);
  }
  function renderReview() {
    const r = D.review;
    $('#bcStage').textContent = '마무리 발송 전 체크와 돌아보기';
    $('#shEyebrow').textContent = 'WRAP-UP · 확인';
    $('#shTitle').textContent = '발송 전 체크와 돌아보기';
    $('#shSum').textContent = 'AI가 작성하고, 사람이 확인합니다. 보내기 전에 마지막으로 읽는 기준입니다.';
    $('#shMeta').innerHTML = `<span class="meta-chip active">${esc(r.time)}</span><span class="meta-chip">원본 PPT 17번 「발송 전 확인 할 것」</span>`;
    const secs = [
      ['check', '발송 전 체크', checklist('review', r.checks)],
      ['steps', '정리하기', `<ol class="plain">${r.steps.map(x => `<li>${x}</li>`).join('')}</ol>`],
      ['reflect', '성찰 질문', r.reflect.map((q, i) => noteBox(`review.q${i}`, q, '내 생각을 짧게 적어 보세요')).join('')]
    ];
    paint('review', secs, [`#s${D.stages.length}`, `${D.stages.length}단계 · ${D.stages[D.stages.length - 1].title}`], ['#home', '처음 화면']);
  }
  function paint(id, secs, prev, next) {
    $('#stageToc').innerHTML = '<strong>목차</strong>' + secs.map(s => `<a href="#${id}-${s[0]}" class="${s[0] === 'prompt' ? 'toc-run' : ''}">${esc(s[1])}</a>`).join('');
    const body = $('#stageBody');
    body.innerHTML = secs.map((s, i) => `<section id="${id}-${s[0]}"><span class="section-number">${i + 1}</span><h2>${esc(s[1])}</h2>${s[2]}</section>`).join('') +
      `<div class="lesson-navigation"><a href="${prev[0]}"><span>이전</span><strong>${esc(prev[1])}</strong></a><a class="lesson-next" href="${next[0]}"><span>다음</span><strong>${esc(next[1])}</strong></a></div>`;
    bindCopy(body); bindNotes(body); bindChecks(body);
  }

  /* ---------- START 장표 ---------- */
  const SRC_AI = '출처: 과학기술정보통신부, 「2025 인터넷이용실태조사」 결과 발표(2026. 3. 31.) · 전국 22,671가구, 만 3세 이상 50,750명';
  const gi = g => SLIDES.findIndex(s => s.g === g);
  const SLIDES = [
    { g: 0, nav: '시작', title: '세 가지 키워드', html: () => `<span class="slide-kicker">START · Gemini로 메일 자동화</span><h1>AI, 자동화, 안전</h1>
      <p class="slide-lead">실습 전에 보는 세 가지 키워드</p>
      <div class="kw3"><a href="#start-${gi(1)}"><b>KEYWORD 1</b><strong>AI</strong><span>생성형 AI 이용 현황 · 사무직이 가장 많이 씀</span></a>
      <a href="#start-${gi(2)}"><b>KEYWORD 2</b><strong>자동화</strong><span>Apps Script란 · Gemini에게 코드 받기 · 오늘의 흐름</span></a>
      <a href="#start-${gi(3)}"><b>KEYWORD 3</b><strong>안전</strong><span>발송 한도 · 권한 승인 · AI가 쓰고 사람이 확인</span></a></div>` },
    { g: 1, nav: '1-1', title: '생성형 AI 이용 현황', html: () => `<span class="slide-kicker">1. AI · 1) 우리나라 생성형 AI 이용 현황</span><h1>일하는 사람이 가장 많이 씁니다</h1>
      <div class="stat3">
        <div class="stat"><em>생성형 AI 경험률</em><strong>44.5%</strong><div class="cap">2024년 33.3% → 2025년 44.5%</div><p>1년 사이 11.2%p 늘었습니다.</p></div>
        <div class="stat"><em>사무직 경험률</em><strong>71.9%</strong><div class="cap">직업별로 가장 높음</div><p>문서와 메일을 다루는 일에서 AI를 가장 먼저 쓰고 있습니다.</p></div>
        <div class="stat"><em>정보·결과물을 믿는다</em><strong>54.7%</strong><div class="cap">절반 남짓만 결과를 신뢰</div><p>AI가 만든 메일과 코드는 사람이 확인하고 보내야 합니다.</p></div>
      </div>
      <p class="src">${esc(SRC_AI)}</p>` },
    { g: 1, nav: '1-2', title: '서비스별 이용', html: () => `<span class="slide-kicker">1. AI · 2) 어떤 AI를 쓰나</span><h1>ChatGPT 41.8%, Gemini 9.8%</h1>
      <p class="slide-lead">서비스별 경험률(복수응답). 유료 구독 비율은 7.9%로, 대부분 무료로 씁니다.</p>
      <div class="pts"><div class="pt"><b>오늘 쓰는 AI</b><strong>Gemini</strong><p>Google 계정만 있으면 무료로 씁니다. 시트·Gmail과 같은 계정이라 Apps Script 코드를 묻고 바로 붙여 넣기 좋습니다.</p></div>
      <div class="pt"><b>대신 써도 되는 AI</b><strong>ChatGPT</strong><p>같은 요청문을 넣어도 됩니다. 결과 코드는 조금씩 달라도 괜찮습니다.</p></div></div>
      <p class="src">${esc(SRC_AI)}</p>` },
    { g: 2, nav: '2-1', title: 'Apps Script란', html: () => `<span class="slide-kicker">2. 자동화 · 1) Apps Script</span><h1>시트에 붙이는 작은 프로그램</h1>
      <div class="pts cn-pts3"><div class="pt"><b>무엇</b><strong>Google 서비스용 코드</strong><p>시트, Gmail, 캘린더를 이어 반복하는 일을 대신하게 하는 Google의 스크립트입니다.</p></div>
      <div class="pt"><b>어디서</b><strong>[확장 프로그램] → [Apps Script]</strong><p>시트 안에서 바로 열립니다. 따로 설치할 것이 없습니다.</p></div>
      <div class="pt"><b>오늘</b><strong>목록대로 메일 보내기</strong><p>시트의 이름과 주소를 읽어 한 사람씩 이름을 넣은 메일을 Gmail로 보냅니다.</p></div></div>` },
    { g: 2, nav: '2-2', title: 'Gemini에게 코드 받기', html: () => `<span class="slide-kicker">2. 자동화 · 2) 코드를 몰라도</span><h1>코드는 Gemini가, 판단은 내가</h1>
      <div class="recap"><div class="recap-col"><b>Gemini가 하는 일</b><span>요청한 기능대로 코드 쓰기</span><span>오류 문장을 보고 고치기</span><span>코드 설명하기</span></div>
      <div class="recap-col"><b>내가 하는 일</b><span>원하는 기능을 번호로 나눠 말하기</span><span>제목·본문·받는 사람 확인</span><span>테스트 메일 보고 전체 발송 결정</span></div></div>
      <div class="note">요청문은 3회차 앞에서 배운 "좋은 요청 = 정보의 구체성"과 같습니다. 시트 구성과 기능을 빠짐없이 적을수록 고칠 일이 줄어듭니다.</div>` },
    { g: 2, nav: '2-3', title: '오늘의 흐름', html: () => `<span class="slide-kicker">2. 자동화 · 3) 오늘의 흐름</span><h1>시트 목록에서 Gmail까지 네 단계</h1>
      <p class="slide-lead">원본 PPT 14~16번 슬라이드의 순서에 Gemini 요청과 권한 승인을 더했습니다.</p>
      ${flowHtml('wide4')}` },
    { g: 3, nav: '3-1', title: '발송 한도와 권한', html: () => `<span class="slide-kicker">3. 안전 · 1) 알아 둘 것</span><h1>한도와 권한을 먼저 압니다</h1>
      <div class="stat3"><div class="stat"><em>개인 Gmail 계정</em><strong>100명</strong><div class="cap">Apps Script 하루 발송 받는 사람 수</div><p>Google Workspace 계정은 1,500명입니다. 한도는 바뀔 수 있습니다.</p><p class="src">출처: Google Apps Script, Quotas for Google Services</p></div>
      <div class="stat"><em>처음 한 번</em><strong>권한 승인</strong><div class="cap">"확인되지 않은 앱" 화면</div><p>내가 만든 코드라 Google 심사를 받지 않았다는 뜻입니다. 내 코드일 때만 허용합니다.</p></div>
      <div class="stat"><em>되돌릴 수 없음</em><strong>테스트 먼저</strong><div class="cap">나에게 먼저 보내기</div><p>2행에 내 주소를 넣고 테스트 메일을 확인한 뒤 전체 발송합니다.</p></div></div>` },
    { g: 3, nav: '3-2', title: '실습 전 약속', html: () => `<span class="slide-kicker">3. 안전 · 2) 실습 전 약속</span><h1>AI가 작성하고, 사람이 확인합니다</h1>
      <div class="pts cn-pts3"><div class="pt"><b>01</b><strong>예시 주소만 씁니다</strong><p>연습에는 내 주소와 동의를 받은 주소만 넣습니다. 고객 명단은 넣지 않습니다.</p></div>
      <div class="pt"><b>02</b><strong>모르는 코드는 허용하지 않습니다</strong><p>다른 사람이 보낸 시트에서 승인 화면이 뜨면 멈춥니다.</p></div>
      <div class="pt"><b>03</b><strong>보내기 전에 다시 읽습니다</strong><p>날짜·시간·장소, 받는 사람, 개인정보를 확인하고 내가 최종 결정합니다.</p></div></div>` }
  ];
  const GROUPS = ['시작', 'AI', '자동화', '안전'];
  let deckIdx = 0;
  function renderStart(i) {
    deckIdx = Math.max(0, Math.min(SLIDES.length - 1, i || 0));
    const sl = SLIDES[deckIdx];
    $('#deckWhere').textContent = sl.title;
    $('#deckSlide').innerHTML = sl.html();
    $('#deckTabs').innerHTML = GROUPS.map((g, k) => `<button type="button" role="tab" data-i="${gi(k)}" class="${sl.g === k ? 'on' : ''}">${k ? `<b>${k}</b>` : ''}${esc(g)}</button>`).join('');
    $('#deckDots').innerHTML = SLIDES.map((s, k) => `<button type="button" data-i="${k}" class="${k === deckIdx ? 'on' : ''}" aria-label="${esc(s.title)}" title="${esc(s.title)}"></button>`).join('');
    $('#viewStart').querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { location.hash = '#start-' + b.dataset.i; }));
    $('#deckPrev').disabled = deckIdx === 0;
    $('#deckNext').textContent = deckIdx === SLIDES.length - 1 ? '1단계 실습으로 →' : '다음 →';
  }
  $('#deckPrev').addEventListener('click', () => { if (deckIdx > 0) location.hash = '#start-' + (deckIdx - 1); });
  $('#deckNext').addEventListener('click', () => { location.hash = deckIdx === SLIDES.length - 1 ? '#s1' : '#start-' + (deckIdx + 1); });
  document.addEventListener('keydown', e => {
    if ($('#viewStart').hidden || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' && deckIdx < SLIDES.length - 1) location.hash = '#start-' + (deckIdx + 1);
    if (e.key === 'ArrowLeft' && deckIdx > 0) location.hash = '#start-' + (deckIdx - 1);
  });

  /* ---------- 바로가기 ---------- */
  function renderQuick() {
    const groups = [
      ['START · 세 가지 키워드', SLIDES.map((s, i) => ['#start-' + i, s.nav, s.title])],
      ['실습', [...D.stages.map(s => ['#' + s.id, s.no + '단계', s.title]), ['#review', '마무리', '발송 전 체크와 돌아보기']]],
      ['자료와 안내', [['#timeline', '시간표', '시간표'], ['#materials', '자료', '요청문과 참고 코드'], ['#safety', '유의', '실제 업무에 쓸 때'], ['#help', '도움', '막힐 때'], ['#sources', '출처', '참고 자료']]]
    ];
    $('#quickPanel').innerHTML = groups.map(g => `<div class="menu-group"><strong>${esc(g[0])}</strong>${g[1].map(x => `<a href="${x[0]}"><span>${esc(x[1])}</span>${esc(x[2])}</a>`).join('')}</div>`).join('');
    $('#quickPanel').addEventListener('click', e => { if (e.target.closest('a')) $('#quickMenu').open = false; });
    document.addEventListener('click', e => { if (!e.target.closest('#quickMenu')) $('#quickMenu').open = false; });
  }

  /* ---------- 라우팅 ---------- */
  const HOME_SECS = ['timeline', 'materials', 'safety', 'help', 'sources'];
  function route() {
    const h = (location.hash || '#home').replace('#', '');
    const [view, sub] = h.split('-');
    ['#viewHome', '#viewStart', '#viewStage'].forEach(v => { $(v).hidden = true; });
    let target = null;
    $('#quickMenu').open = false;
    if (view === 'start') { $('#viewStart').hidden = false; renderStart(Number(sub) || 0); }
    else if (D.stages.some(s => s.id === view)) { $('#viewStage').hidden = false; renderStage(view); }
    else if (view === 'review') { $('#viewStage').hidden = false; renderReview(); }
    else { $('#viewHome').hidden = false; renderHome(); if (HOME_SECS.includes(view)) target = document.getElementById('sec-' + view); }
    if (sub && view !== 'start') target = document.getElementById(h);
    requestAnimationFrame(() => { if (target) target.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); });
  }

  renderQuick();
  window.addEventListener('hashchange', route);
  /* 참고 코드는 같은 폴더 파일이다. file:// 등 읽을 수 없는 환경에서는 내려받기 링크만 보인다. */
  const boot = () => { renderStatic(); route(); };
  if (window.MAIL_CODE) { CODE = window.MAIL_CODE; boot(); } else boot();
})();
