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
  const FM = D.formMake;
  const ext = (href, label, cls) => `<a class="${cls || 'g-btn'}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

  /* ---------- 시작 화면 ---------- */
  function renderHome() {
    $('#heroLinks').innerHTML = `<div class="link-row"><div><b>상담자</b><strong>상담자용 시트 열기</strong><span>공고 분석, 구직자와 공고 비교, 상담 결과지까지 이 시트에서 진행</span></div>${ext(L.sheet, '시트 열기')}</div>
      <div class="link-row"><div><b>구직자</b><strong>사전 질문지 작성</strong><span>희망 직무, 경력·훈련, 직접 맡았던 일, 필요한 지원을 적으면 시트에 등록됨</span></div>${ext(L.form, '질문지 열기', 'g-btn ghost')}</div>`;
    $('#copyLink').href = L.copy;
    $('#homeFlow').innerHTML = `<section class="level-section">
      <div class="level-head"><div><span class="level-kicker">PRACTICE</span><h2>취업상담 워크플로우 5단계</h2></div>
      <p>구직자의 경험을 채용공고의 요구와 대조하고, 상담자와 구직자가 함께 다음 행동을 정합니다.</p></div>
      <div class="flow5">${F.steps.map(s => `<a class="flow-card" href="#flow-${s.no}"><span class="lesson-code">${s.no}단계</span><h3>${esc(s.title)}</h3><p>${esc(s.short)}</p><div class="flow-tab">${esc(s.tab)}</div><div class="flow-go">준비물 확인하고 시작 →</div></a>`).join('')}</div>
      <div class="sheet-actions mt14"><a class="g-btn" href="#flow-1">1단계부터 시작</a><a class="g-btn ghost" href="#flow">전체 과정 보기</a></div></section>
      <section class="level-section"><div class="level-head"><div><span class="level-kicker">MY OWN</span><h2>개별 실습 · ${esc(M.title)}</h2></div>
      <p>워크플로우 5단계와 같은 틀로 내 업무 하나를 설계합니다.</p></div>
      <div class="go-studio"><p><b>같은 틀로 내 업무 하나를 설계</b> — 빈칸 양식 여덟 칸을 채우고 지시문을 실행하면 구글 시트·구글 폼 구성안과 Apps Script 초안이 나옵니다.</p><a class="g-btn" href="#mine">개별 실습 열기</a></div></section>`;
    $('#zipLink').href = FILE_BASE + D.zip;
    $('#downloadGroups').innerHTML = D.files.map(g => `<h3 class="dl-h">${esc(g.group)}</h3><div class="dl-grid">${g.items.map(([f, d]) =>
      `<div class="dl-item"><div><strong>${esc(f)}</strong><span>${esc(d)}</span></div><div class="btn-pair"><a class="g-btn ghost" href="${FILE_BASE}${encodeURIComponent(f)}.pdf" download>PDF</a><a class="g-btn ghost" href="${FILE_BASE}${encodeURIComponent(f)}.docx" download>DOCX</a></div></div>`).join('')}</div>`).join('');
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
    { g: 2, nav: '2-1', title: '2027년 채용 트렌드', html: () => `<span class="slide-kicker">2. 트렌드 · 3) 2027년 채용 트렌드</span><h1>2027년 채용 트렌드 10가지</h1>
      <p class="slide-lead">키워드를 누르면 요점과 상담에서의 의미가 펼쳐집니다. 파란 테두리 네 개는 다음 장에서 2026년과 비교합니다.</p>
      <div class="t10">${ST.trend27.map((k, i) => `<details class="${HL.includes(k[0]) ? 'hl' : ''}"><summary><b>${String(i + 1).padStart(2, '0')}</b><strong>${esc(k[0])}</strong><span>${esc(k[1])}</span></summary>${ul(k[2])}${so(k[3], '상담에서')}</details>`).join('')}</div>
      ${srcFold(ST.trend27_src, ST.trend27_url)}` },
    { g: 2, nav: '2-2', title: '2026년과 달라진 점', html: () => `<span class="slide-kicker">2. 트렌드 · 4) 2026년과 달라진 점</span><h1>2026년과 달라진 점</h1>
      <p class="slide-lead">2027년 키워드 네 가지 · 2026년 키워드와 비교</p>
      <div class="shift2">${ST.shift.map(r => `<div class="shift-card"><div class="shift-head"><span class="y26"><small>2026</small>${esc(r[0])}</span><span class="arr">→</span><span class="y27"><small>2027</small>${esc(r[1])}</span></div><p>${esc(r[2])}</p>${so(r[3])}<i>${esc(r[4])}</i></div>`).join('')}</div>
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
  function formMakeHtml() {
    return `<div class="make-form" id="flow-form"><h3>내가 쓸 사전 질문지 미리 만들기</h3><p>${esc(FM.why)}</p>
      <div class="two-col make-cols">
        <div class="result-card"><span class="way-tag">방법 1</span><strong>구글 폼에서 직접 만들기</strong>${ol(FM.manual)}<p class="local-note">${esc(FM.manual_note)}</p></div>
        <div class="result-card"><span class="way-tag on">방법 2</span><strong>Apps Script로 만들기</strong>${ol(FM.script)}<p class="local-note">${esc(FM.script_note)}</p></div>
      </div>
      <details class="fold"><summary>질문 12개 (제목은 글자 그대로)</summary><div class="fold-b"><div class="g-table"><table><thead><tr><th>#</th><th>질문 제목</th><th>형식</th><th>필수</th></tr></thead><tbody>${FM.questions.map((q, i) => `<tr><td>${i + 1}</td><td>${esc(q[0])}</td><td>${esc(q[1])}</td><td>${esc(q[2])}</td></tr>`).join('')}</tbody></table></div></div></details>
      <details class="fold"><summary>Apps Script 코드 (방법 2에서 붙여 넣는 코드)</summary><div class="fold-b">${copyBox(FM.code, 'createMyJobseekerForm', '코드 복사')}</div></details></div>`;
  }
  function renderMine() {
    $('#flowCrumb').textContent = '개별 실습';
    $('#flowEyebrow').textContent = 'MY OWN · 개별 실습';
    $('#flowTitle').textContent = M.title;
    $('#flowLead').textContent = M.lead;
    $('#flowMeta').innerHTML = '';
    const fileBtns = n => `<div class="btn-pair"><a class="g-btn ghost" href="${FILE_BASE}${encodeURIComponent(n)}.pdf" download>PDF</a><a class="g-btn ghost" href="${FILE_BASE}${encodeURIComponent(n)}.docx" download>DOCX</a></div>`;
    const secs = [
      ['out', '만드는 것', `${ul(M.out)}<div class="safety-box mt16"><strong>실명·연락처·내부 문서 원문은 넣지 않음</strong><p>업무의 순서와 자료 종류만 적습니다. 워크플로우 5단계에서 쓴 틀(입력 탭과 결과 탭, 체크한 행만 실행, 초안과 확정 구분)을 내 업무에 옮깁니다.</p></div>`],
      ['plan', '기획서 빈칸 양식', `<p>여덟 칸을 먼저 채웁니다. 오른쪽 예시는 내 업무 내용으로 바꿉니다.</p>
        <div class="g-table"><table><thead><tr><th>번호</th><th>칸</th><th>내가 적을 내용</th><th>예시</th></tr></thead><tbody>${M.boxes.map(b => `<tr><td>${esc(b[0])}</td><td>${esc(b[1])}</td><td class="blank"></td><td>${esc(b[2])}</td></tr>`).join('')}</tbody></table></div>
        <div class="file-list"><div class="file-row"><div><strong>04_기획서_빈칸양식</strong><span>인쇄하거나 워드에서 채움</span></div>${fileBtns('04_기획서_빈칸양식')}</div></div>`],
      ['steps', '순서', ol(M.steps)],
      ['prompt', '지시문', `<p>전체를 복사한 뒤 [입력]의 여덟 줄만 내 내용으로 바꿉니다. 지금 들어 있는 값은 예시입니다.</p>${copyBox(M.prompt, '지시문', '지시문 복사')}
        <h3>[입력] 칸에 고를 수 있는 값</h3><div class="g-table"><table><tbody>${M.options.map(o => `<tr><td>${esc(o[0])}</td><td>${esc(o[1])}</td></tr>`).join('')}</tbody></table></div>`],
      ['check', '결과에서 볼 것', ul(M.checks)],
      ['safe', '안전 사용 체크리스트', `<p>실제 자료를 넣기 전에 여덟 가지를 예·아니오로 답합니다. "아니오"가 하나라도 있으면 실제 자료를 넣지 않습니다.</p>${ol(M.safety)}
        <div class="file-list"><div class="file-row"><div><strong>05_안전사용_체크리스트</strong><span>예·아니오 칸이 있는 인쇄용</span></div>${fileBtns('05_안전사용_체크리스트')}</div></div>`],
      ['after', '교육 뒤 직접 활용 계획', `<div class="g-table"><table><thead><tr><th>회차</th><th>언제</th><th>어떤 자료로</th><th>확인할 것</th></tr></thead><tbody>${M.after.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="file-list"><div class="file-row"><div><strong>06_직접활용_계획표</strong><span>고칠 점 기록 칸이 있는 인쇄용</span></div>${fileBtns('06_직접활용_계획표')}</div></div>`],
    ];
    $('#flowToc').innerHTML = '<strong>목차</strong>' + secs.map(s => `<a href="#mine-${s[0]}">${esc(s[1])}</a>`).join('');
    $('#flowBody').innerHTML = secs.map((s, i) => `<section id="mine-${s[0]}"><span class="section-number">${i + 1}</span><h2>${esc(s[1])}</h2>${s[2]}</section>`).join('') +
      `<div class="lesson-navigation"><a href="#flow"><span>이전</span><strong>취업상담 워크플로우 5단계</strong></a><a class="lesson-next" href="#downloads"><span>다음</span><strong>자료 받기</strong></a></div>`;
    bindCopy($('#flowBody'));
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
    $('#flowMeta').innerHTML = `${ext(L.copy, '자동화 시트 받기 (내 사본 만들기)')}${ext(L.sheet, '원본 시트 열기', 'g-btn ghost')}${ext(L.form, '구직자용 사전 질문지', 'g-btn ghost')}`;
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
      ['시작하기 전에', [['ai-test/', '검사', 'AI 역량검사'], ['who/', '레벨', '나는 어떤 AI 사용자?']]],
      ['START · 세 가지 키워드', SLIDES.map((s, i) => ['#start-' + i, s.nav, s.title])],
      ['취업상담 워크플로우', [['#flow', '안내', '전체 과정'], ...F.steps.map(s => ['#flow-' + s.no, s.no + '단계', s.title]), ['#flow-form', '질문지', '내가 쓸 사전 질문지 미리 만들기'], ['#flow-why', '의미', '이 워크플로우의 의미'], ['#flow-tabs', '탭', '시트 탭 구성']]],
      ['개별 실습', [['#mine', '안내', M.title], ['#mine-plan', '양식', '기획서 빈칸 양식'], ['#mine-prompt', '지시문', '지시문'], ['#mine-safe', '점검', '안전 사용 체크리스트'], ['#mine-after', '계획', '교육 뒤 직접 활용 계획']]],
      ['자료와 안내', [['#downloads', '자료', '자료 받기'], ['#privacy', '유의', '실제 구직자 정보를 다룰 때'], ['#help', '도움', '막힐 때']]],
    ];
    $('#quickPanel').innerHTML = groups.map(g => `<div class="menu-group"><strong>${esc(g[0])}</strong>${g[1].map(x => `<a href="${x[0]}"><span>${esc(x[1])}</span>${esc(x[2])}</a>`).join('')}</div>`).join('');
    $('#quickPanel').addEventListener('click', e => { if (e.target.closest('a')) $('#quickMenu').open = false; });
    document.addEventListener('click', e => { if (!e.target.closest('#quickMenu')) $('#quickMenu').open = false; });
  }

  /* ---------- 라우팅 ---------- */
  const HOME_SECS = ['before', 'downloads', 'privacy', 'help'];
  function route() {
    const h = (location.hash || '#home').replace('#', '');
    const [view, sub] = h.split('-');
    ['#viewHome', '#viewStart', '#viewFlow'].forEach(v => { $(v).hidden = true; });
    $('#quickMenu').open = false;
    let target = null;
    if (view === 'start') { $('#viewStart').hidden = false; renderStart(Number(sub) || 0); }
    else if (view === 'flow') {
      $('#viewFlow').hidden = false;
      if (/^[1-5]$/.test(sub || '')) renderStep(sub);
      else if (sub === 'form') { renderStep('1'); target = document.getElementById('flow-form'); }
      else { renderFlow(); if (sub) target = document.getElementById(h); }
    }
    else if (view === 'mine') { $('#viewFlow').hidden = false; renderMine(); if (sub) target = document.getElementById(h); }
    else { $('#viewHome').hidden = false; if (HOME_SECS.includes(view)) target = document.getElementById('sec-' + view); }
    requestAnimationFrame(() => { if (target) target.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); });
  }

  renderHome();
  renderQuick();
  window.addEventListener('hashchange', route);
  route();
})();
