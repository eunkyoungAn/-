/* AI 업무 자동화 실습실 — 공통 START 장표, 제미나이 메일 자동화 · 카드뉴스 만들기, 메모·검수 표시.
   입력한 내용은 어디에도 보내지 않으며 이 기기의 localStorage에만 저장한다. */
(function () {
  'use strict';
  const D = window.LAB;
  const $ = (s, el) => (el || document).querySelector(s);
  const KEY = 'aiAutoLab.v1';

  let S;
  try { S = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { S = {}; }
  S.checks = S.checks || {};
  S.notes = S.notes || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 불가 시 무시 */ } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ul = a => `<ul class="plain">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const CODE = window.MAIL_CODE || '';

  /* 실습 순서: m1~m7 → mr → c1~c3 → cr */
  const SEQ = [];
  D.parts.forEach(p => { p.stages.forEach(s => SEQ.push({ id: s.id, part: p, stage: s })); if (p.review) SEQ.push({ id: p.review.id, part: p, review: p.review }); });
  const find = id => SEQ.find(x => x.id === id);
  const label = x => x.stage ? (x.stage.solo ? `${x.part.short} · ${x.stage.title}` : `${x.part.short} · ${x.stage.no}단계 ${x.stage.title}`) : `${x.part.short} · 마무리 ${x.review.title}`;

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
  function promptBox(text, lbl, cls) {
    return `<div class="prompt-box tall${cls ? ' ' + cls : ''}"><span class="box-label">${esc(lbl || '요청문')}</span><button class="copy-button" type="button">복사</button><pre>${esc(text)}</pre></div>`;
  }
  function noteBox(id, lbl, ph) {
    return `<div class="paste-box"><label for="n-${id}">${esc(lbl)}</label><textarea id="n-${id}" data-note="${id}" placeholder="${esc(ph)}">${esc(S.notes[id] || '')}</textarea></div>`;
  }
  function checklist(key, items) {
    return `<div class="checklist">${items.map((x, i) => `<label class="check-item"><input type="checkbox" data-k="${key}.${i}" ${S.checks[`${key}.${i}`] ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('')}</div>`;
  }
  function bindAll(root) {
    root.querySelectorAll('.copy-button').forEach(b => b.addEventListener('click', () => copyText(b.parentElement.querySelector('pre').textContent, b)));
    root.querySelectorAll('[data-note]').forEach(t => t.addEventListener('input', () => { S.notes[t.dataset.note] = t.value; save(); }));
    root.querySelectorAll('.check-item input').forEach(i => i.addEventListener('change', () => { S.checks[i.dataset.k] = i.checked; save(); }));
  }
  function table(head, rows) {
    return `<div class="g-table"><table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function tableBlock(t) { return t ? `<h3>${esc(t.title)}</h3>${table(t.head, t.rows)}` : ''; }
  function codeBlock(no) {
    return `<div class="go-studio mt16"><p><b>참고 코드</b> — Gemini 코드가 계속 맞지 않을 때 이 코드를 그대로 붙여 넣습니다. 메뉴 이름과 기능이 요청문과 같습니다.</p><a class="g-btn ghost" href="${esc(D.codeFile)}" download>파일 받기</a></div>
      ${CODE ? promptBox(CODE, (no || '') + '참고 코드 (Code.gs)', 'cn-code') : ''}`;
  }

  /* ---------- 진행 ---------- */
  function done(x) {
    const items = x.stage ? x.stage.checks : x.review.checks;
    return items.every((_, i) => S.checks[`${x.id}.${i}`]);
  }
  function renderProgress() {
    const all = SEQ.filter(x => x.stage);
    const n = all.filter(done).length;
    $('#pgNum').textContent = `${n} / ${all.length}`;
    $('#pgBar').style.width = (n / all.length * 100) + '%';
  }

  /* ---------- 시작 화면 ---------- */
  const FLOW_MAIL = [
    ['Google Sheets', '시트 열기', '새 시트'],
    ['Apps Script', '편집기 열기', '확장 프로그램 → Apps Script'],
    ['Gemini', '코드 요청', '구성 요소는 내가 정하기'],
    ['Google Sheets', '구성 요소 채우기', '방법 1 · 방법 2'],
    ['Apps Script', '코드 붙여 넣기', '받은 코드 그대로'],
    ['Apps Script', '저장 → 실행', '처음에는 권한 승인'],
    ['Google Sheets', '완성', '시트에서 메뉴로 발송']
  ];
  function stepFlow(p, cur) {
    if (!p.flow) return '';
    const ci = p.flow.findIndex(f => f[0] === cur);
    return `<nav class="step-flow" aria-label="진행 순서"><p>진행 순서 <span>단계를 누르면 그 화면으로 갑니다 <i>[클릭]</i></span></p><ol class="n${p.flow.length}">${p.flow.map((f, i) => `<li class="${i === ci ? 'on' : (ci >= 0 && i < ci ? 'past' : '')}"><a href="#${f[0]}"${i === ci ? ' aria-current="step"' : ''}><b>${i + 1}</b><span>${esc(f[1])}</span></a></li>`).join('')}</ol></nav>`;
  }
  const FLOW_CARD = [
    ['Google Sheets', '기획 입력', '타깃·주제·장수 (B~I열)'],
    ['Gemini API', '원고 자동 생성', '표지 훅, 1~6장 (J~Q열)'],
    ['사람', '검토와 수정', '사실·과장·길이 확인'],
    ['ChatGPT 프로젝트', '디자인 초안', '게시 문구, Canva 디자인'],
    ['Google Sheets', '기록·관리', '결과 링크, 상태, 성과']
  ];
  function flowHtml(f, cls) {
    return `<ol class="cn-flow${cls ? ' ' + cls : ''}">${f.map((x, i) => `<li><b>${i + 1}</b><div><strong>${esc(x[1])}</strong><span>${esc(x[0])} · ${esc(x[2])}</span></div></li>`).join('')}</ol>`;
  }
  function renderHome() {
    /* 오늘 만드는 결과물: 색 세 가지(회색, 파랑, 어두운 색)가 번갈아 나온다 */
    const course = [
      ['메일 자동화', '#mail', '이름이 들어간 메일을 한 번에 보내는 시트'],
      ['카드뉴스', '#card', '카드뉴스 1편과 게시 문구'],
      ['보고서', '#report', '팀장님 제출용 한 장 요약'],
      ['데이터분석', '#data', '후보별 표·막대그래프와 최종 보고서'],
      ['할루시네이션', '#hallu', 'AI 답을 확인하는 다섯 가지 습관'],
      ['관심정보 모으기', [['#track', '방법', 'ChatGPT · Gemini · Claude에서 예약하기']]],
      ['점검', [['#quiz', '퀴즈', '객관식 다섯 문제']]],
      ['의견 주세요!', [['#opinion', '의견', '다음 교육에서 배우고 싶은 과정']]],
      ['자료실', '#materials', '실습 파일, 요청문, 지침, 참고 코드']
    ];
    const tone = ['grey', 'blue', 'dark'];
    $('#homeCourse').innerHTML = course.map((c, i) => `<a class="hb-card t-${tone[i % 3]}" href="${c[1]}"><div><strong>${esc(c[0])}</strong><span class="d">${esc(c[2])}</span></div><div class="go"><i aria-hidden="true">↗</i>열기</div></a>`).join('');
    /* 파트: 단계를 접이식 목록으로 */
    const two = n => String(n).padStart(2, '0');
    $('#homeParts').innerHTML = D.parts.map(p => `<section class="hb-sec" id="sec-${p.id}">
      <div class="hb-head"><h2>${esc(p.title)}</h2><p>${esc(p.desc)}</p></div>
      <div class="hb-acc">${p.stages.map((s, i) => `<details name="hb-${p.id}"${i === 0 ? ' open' : ''}><summary><b>${s.solo ? '개인' : two(s.no)}</b><span>${esc(s.title)}</span></summary>
        <div class="hb-acc-b"><p>${esc(s.goal[0])}</p><span class="hb-tab">산출물 · ${esc(s.output)}</span>${done(find(s.id)) ? '<span class="hb-tab">검수 완료</span>' : ''}<a class="hb-go" href="#${s.id}">이 단계 시작 →</a></div></details>`).join('')}
      ${p.review ? `<details name="hb-${p.id}"><summary><b>끝</b><span>${esc(p.review.title)}</span></summary><div class="hb-acc-b"><p>${p.id === 'mail' ? '보내기 전에 체크리스트로 다시 읽습니다.' : '결과를 시트에 기록하고 오늘 한 일을 돌아봅니다.'}</p><a class="hb-go" href="#${p.review.id}">마무리 시작 →</a></div></details>` : ''}</div>
      <div class="sheet-actions mt14"><a class="g-btn" href="#${p.stages[0].id}">1단계부터 시작</a></div></section>`).join('');
    renderProgress();
  }
  /* ---------- 개인 실습: 단계 안의 문제와 정답 확인 ---------- */
  function stageQuiz(st) {
    const box = $('#stageQuiz'); if (!box) return;
    S.sq = S.sq || {}; const mine = S.sq[st.id] = S.sq[st.id] || {};
    const mark = '①②③④';
    const ok = st.quiz.filter((q, i) => mine[i] === q.ans).length, n = st.quiz.filter((q, i) => mine[i] != null).length;
    box.innerHTML = st.quiz.map((q, i) => { const pick = mine[i], done = pick != null;
      return `<article class="qz${done ? ' done' : ''}"><header><b>문제 ${i + 1}</b></header><h3>${esc(q.q)}</h3>
        <div class="qz-opts">${q.opts.map((o, k) => `<button type="button" data-q="${i}" data-k="${k}" class="${done ? (k === q.ans ? 'ok' : (k === pick ? 'no' : '')) : ''}"${done ? ' disabled' : ''}><i>${mark[k]}</i><span>${esc(o)}</span>${done && k === q.ans ? '<em>정답</em>' : ''}${done && k === pick && k !== q.ans ? '<em>내 답</em>' : ''}</button>`).join('')}</div>
        ${done ? `<p class="qz-why"><b>${pick === q.ans ? '맞았습니다.' : '다시 볼까요.'}</b> ${esc(q.why)}</p>` : ''}</article>`; }).join('') +
      `<div class="qz-score"><div><span>맞힌 문제</span><strong>${ok} / ${st.quiz.length}</strong></div><p>${n < st.quiz.length ? `${st.quiz.length - n}문제가 남았습니다. 내 결과와 엑셀을 보고 답합니다.` : (ok === st.quiz.length ? '모두 맞혔습니다.' : '틀린 문제는 엑셀에서 직접 확인합니다.')}</p><button class="g-btn ghost" type="button" id="sqReset">다시 풀기</button></div>`;
    box.querySelectorAll('.qz-opts button').forEach(bt => bt.addEventListener('click', () => { mine[bt.dataset.q] = Number(bt.dataset.k); save(); stageQuiz(st); }));
    $('#sqReset').addEventListener('click', () => { S.sq[st.id] = {}; save(); stageQuiz(st); });
  }
  /* ---------- 점검 퀴즈 (객관식 5문제) ---------- */
  function renderQuiz() {
    const box = $('#quizBox'); if (!box || !D.quiz) return;
    S.quiz = S.quiz || {};
    const mark = '①②③④';
    const n = D.quiz.filter((q, i) => S.quiz[i] != null).length, ok = D.quiz.filter((q, i) => S.quiz[i] === q.ans).length;
    box.innerHTML = D.quiz.map((q, i) => { const pick = S.quiz[i], done = pick != null;
      return `<article class="qz${done ? ' done' : ''}"><header><b>문제 ${i + 1}</b><span>${esc(q.part)}</span></header><h3>${esc(q.q)}</h3>
        <div class="qz-opts">${q.opts.map((o, k) => `<button type="button" data-q="${i}" data-k="${k}" class="${done ? (k === q.ans ? 'ok' : (k === pick ? 'no' : '')) : ''}"${done ? ' disabled' : ''}><i>${mark[k]}</i><span>${esc(o)}</span>${done && k === q.ans ? '<em>정답</em>' : ''}${done && k === pick && k !== q.ans ? '<em>내 답</em>' : ''}</button>`).join('')}</div>
        ${done ? `<p class="qz-why"><b>${pick === q.ans ? '맞았습니다.' : '다시 볼까요.'}</b> ${esc(q.why)}</p>` : ''}</article>`; }).join('') +
      `<div class="qz-score"><div><span>맞힌 문제</span><strong>${ok} / ${D.quiz.length}</strong></div><p>${n < D.quiz.length ? `${D.quiz.length - n}문제가 남았습니다.` : (ok === D.quiz.length ? '다섯 문제를 모두 맞혔습니다.' : '틀린 문제의 풀이를 읽고 해당 파트를 다시 봅니다.')}</p><button class="g-btn ghost" type="button" id="quizReset">다시 풀기</button></div>`;
    box.querySelectorAll('.qz-opts button').forEach(bt => bt.addEventListener('click', () => { S.quiz[bt.dataset.q] = Number(bt.dataset.k); save(); renderQuiz(); }));
    $('#quizReset').addEventListener('click', () => { S.quiz = {}; save(); renderQuiz(); });
  }
  /* ---------- 의견 주세요: 내용을 채운 메일 쓰기 창을 연다 (이 화면에서 직접 전송하지는 않는다) ---------- */
  function bindOpinion() {
    const t = $('#opText'); if (!t) return;
    const name = $('#opName'), g = $('#opGmail'), m = $('#opMail'), msg = $('#opMsg');
    const to = ($('.g-contact a') ? $('.g-contact a').getAttribute('href') : '').replace('mailto:', '');
    t.value = S.notes['opinion.text'] || ''; name.value = S.notes['opinion.name'] || '';
    const sync = () => {
      S.notes['opinion.text'] = t.value; S.notes['opinion.name'] = name.value; save();
      if (t.value.trim().length >= 2 && msg.textContent === '의견을 먼저 적어 주세요.') msg.textContent = '';
      const su = '[AI 활용 스마트 문서작성] 다음 교육 의견';
      const body = `다음 교육에서 배우고 싶은 과정\n\n${t.value.trim()}\n\n보낸 사람: ${name.value.trim() || '(적지 않음)'}`;
      g.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(to) + '&su=' + encodeURIComponent(su) + '&body=' + encodeURIComponent(body);
      m.href = 'mailto:' + to + '?subject=' + encodeURIComponent(su) + '&body=' + encodeURIComponent(body);
    };
    const guard = e => { if (t.value.trim().length < 2) { e.preventDefault(); msg.textContent = '의견을 먼저 적어 주세요.'; t.focus(); } else msg.textContent = '메일 쓰기 창이 열렸습니다. 그 창에서 [보내기]를 눌러야 전달됩니다.'; };
    t.addEventListener('input', sync); name.addEventListener('input', sync); g.addEventListener('click', guard); m.addEventListener('click', guard); sync();
  }
  function renderStatic() {
    renderQuiz();
    if ($('#trackPrompt')) { $('#trackPrompt').innerHTML = promptBox(D.texts.trackPrompt, '관심정보 모으기 요청문 · 주제만 바꿔서 사용'); bindAll($('#trackPrompt')); }
    bindOpinion();
    document.querySelectorAll('[data-copylink]').forEach(a => { a.href = D.sheetCopy; });
    if ($('#homeFlowMail')) $('#homeFlowMail').innerHTML = FLOW_MAIL.map((f, i) => `<li><b>${i + 1}</b><div><strong>${esc(f[1])}</strong><span>${esc(f[0])}</span></div></li>`).join('');
    if ($('#homeFlowCard')) $('#homeFlowCard').innerHTML = FLOW_CARD.map((f, i) => `<li><b>${i + 1}</b><div><strong>${esc(f[1])}</strong><span>${esc(f[0])}</span></div></li>`).join('');
    const mailPrompt = D.parts[0].stages.find(s => s.prompt);
    const dlBtn = f => `<a class="g-btn" href="${esc(f[2])}" ${f[3] ? 'download' : 'target="_blank" rel="noopener noreferrer"'}>${f[3] ? '받기' : '사본 만들기'}</a>`;
    const files = D.downloads.filter(f => /\.(hwpx|xlsx|docx)$/.test(f[2])), tools = D.downloads.filter(f => !files.includes(f));
    $('#materialBox').innerHTML = `<h3 class="dl-h">실습 파일</h3><div class="hb-band">${files.map(f => `<div class="hb-col"><strong>${esc(f[0])}</strong><span>${esc(f[1])}</span><div><a href="${esc(f[2])}" download>파일 받기</a></div></div>`).join('')}</div>
      <h3 class="dl-h">구글 시트와 참고 코드</h3><div class="tool-list">${tools.map(f => `<div class="dl-item tool-item"><div><strong>${esc(f[0])}</strong><span>${esc(f[1])}</span></div><div class="btn-pair">${dlBtn(f)}</div></div>`).join('')}</div>
      <h3 class="dl-h">메일 자동화</h3>${promptBox(mailPrompt.prompt.text, '1. 코드 요청문 (gemini.google.com)')}${CODE ? promptBox(CODE, '2. 참고 코드 (Code.gs)', 'cn-code') : ''}
      <h3 class="dl-h">카드뉴스</h3>${[['guide', '1. 카드뉴스 프로젝트 지침'], ['requestFree', '2. 무료 계정용 요청문 (엑셀 파일 첨부)'], ['request', '3. 유료 계정용 요청문 (Google Drive 연결)'], ['cover', '4. 표지 이미지 요청문']].map(([k, l]) => promptBox(D.texts[k], l)).join('')}
      <h3 class="dl-h">보고서</h3>${promptBox(D.texts.reportGuide, '1. 프로젝트 지침 · 보고서 작성 실습')}${promptBox(D.texts.reportPrompt, '2. 실습 프롬프트 · 3쪽 회의자료 요약')}
      <h3 class="dl-h">데이터분석</h3>${promptBox(D.texts.dataGuide, '1. 프로젝트 지침 · 고객 선호 데이터 분석')}${promptBox(D.texts.dataPrompt, '2. 실습 프롬프트 · 고객 선호 데이터 분류 및 시각화')}${promptBox(D.texts.finalReportPrompt, '3. 최종 보고서 프롬프트')}
      <h3 class="dl-h">개인 연습실</h3>${promptBox(D.selfcheck.applyPrompt, '적용 시작 요청문')}`;
    bindAll($('#materialBox'));
    $('#helpList').innerHTML = ['메일', '카드뉴스', '공통'].map(g => `<h3 class="dl-h">${({ 메일: '제미나이 메일 자동화', ChatGPT: 'ChatGPT 프로젝트 활용하기', 카드뉴스: '카드뉴스 만들기', 공통: '공통' })[g]}</h3><div class="two-col">${D.help.filter(h => h[0] === g).map(h => `<div class="result-card"><strong>${esc(h[1])}</strong><p>${esc(h[2])}</p></div>`).join('')}</div>`).join('');
    $('#sourceList').innerHTML = D.sources.map(s => `<li>${esc(s).replace(/(https?:\/\/\S+)/, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}</li>`).join('');
    $('#sourceList').classList.add('sources-ol');
  }

  /* ---------- 단계 화면 ---------- */
  function navPair(id) {
    if (id === 'check') return [['#practice', '개인 연습실'], ['#home', '처음 화면']];
    const i = SEQ.findIndex(x => x.id === id);
    const prev = i === 0 ? ['#start', 'START · AI, 자동화, 카드뉴스, 사람의 확인'] : ['#' + SEQ[i - 1].id, label(SEQ[i - 1])];
    const next = i === SEQ.length - 1 ? ['#home', '처음 화면'] : ['#' + SEQ[i + 1].id, label(SEQ[i + 1])];
    return [prev, next];
  }
  /* ---------- 직접 써 보고 평가받기 (CO-STAR, 10점 만점) ---------- */
  const COSTAR = [
    ['Context (맥락)', '질문이나 요청이 어떤 상황인지 설명', 2, [/회의록|회의\s*자료|회의\s*보고서|첨부|파일|자료|엑셀|시트/, /너는|역할|담당자|여행|상품|기획|아이데이션/], '어떤 자료를 주는지, AI가 어떤 역할인지 적어 보세요. 예: 너는 상품기획팀의 회의록 정리 담당자야. 첨부한 회의록을 보고'],
    ['Objective (목적)', '원하는 결과나 목표 명시', 2, [/요약|정리|작성|만들어|뽑아|보고서|분석|집계|분류/, /목적|배경|결정|합의|후속|미결|비교|담당자|기한|일정|인원|비율|순위|합계|교육별/], '무엇을 해 달라는지, 무엇을 꼭 담을지 적어 보세요. 예: 목적·배경, 결정사항, 후속 업무를 요약해줘'],
    ['Style (스타일)', '답변이 어떤 형식으로 나오길 원하는지 설정', 1, [/표|목록|번호|순서|개조식|항목|그래프|①|1\./], '답의 형식을 정해 보세요. 예: 표로 비교해줘, 번호 순서로 정리해줘'],
    ['Tone (톤)', '감성 및 분위기 설정', 1, [/간결|객관|쉽게|짧게|핵심만|간단|명확|공손|정중|보고용/], '글의 분위기를 정해 보세요. 예: 간결하고 객관적으로, 핵심만 간단히'],
    ['Audience (독자)', '누구를 위한 글, 내용인지 제시', 2, [/팀장|상사|임원|대표|독자|읽는\s*사람|처음\s*읽|참석하지\s*않은|동료|고객/, /\d+\s*분|처음|빠르게|바로|한눈에|이해/], '누가 읽는지, 그 사람이 어떻게 읽는지 적어 보세요. 예: 처음 읽는 팀장이 2분 안에 이해하도록'],
    ['Response (응답형식)', '실제 출력물 형태를 구체적으로 제시', 2, [/워드|word|docx|파일|문서|한글|pdf|그래프/i, /한\s*장|1\s*쪽|A4|\d+\s*줄|[한두세네]\s*줄|분량|이내|\d+\s*개|소수점/i], '결과물의 형태와 분량을 적어 보세요. 예: 워드 한 장으로 만들어줘, 2줄 이내로']
  ];
  function scoreCostar(text) {
    const t = String(text || '').trim();
    return COSTAR.map(c => { const got = t.length < 10 ? 0 : Math.min(c[2], c[3].filter(re => re.test(t)).length); return { name: c[0], desc: c[1], max: c[2], got, tip: c[4] }; });
  }
  function tryBox(st) {
    return `<h3>먼저 직접 써 보기</h3>
      <p>${esc(st.tryIntro || '실습 프롬프트를 보기 전에, 회의록을 팀장님 보고용으로 요약해 달라는 프롬프트를 직접 써 봅니다. 아래 여섯 가지가 들어 있는지로 10점 만점에 몇 점인지 알려 드립니다.')}</p>
      ${table(['좋은 질문의 구조 (CO-STAR)', '내용', '배점'], COSTAR.map(c => [c[0], c[1], c[2] + '점']))}
      <p class="try-src">기준: 쉴라 테오(Sheila Teo)의 CO-STAR 기법 · <a href="https://medium.com/data-science/how-i-won-singapores-gpt-4-prompt-engineering-competition-34c195a93d41" target="_blank" rel="noopener noreferrer">How I Won Singapore's GPT-4 Prompt Engineering Competition (Medium)</a>. 항목별 배점은 이 실습을 위해 임의로 정한 것입니다.</p>
      <div class="result-card try-hint"><strong>힌트 · 이렇게 요청해 보세요</strong>
        <p>아래 여섯 가지 질문에 한 줄씩 답한다는 생각으로 이어서 쓰면 됩니다.</p>
        <ol class="plain">
          <li>AI에게 어떤 역할을 맡기고, 어떤 자료를 주나요? <span>예: 너는 ○○팀의 ○○ 담당자야. 첨부한 ○○을 보고</span></li>
          <li>무엇을 해 달라고 하나요? 꼭 들어가야 할 내용은 무엇인가요? <span>예: ○○, ○○, ○○을 요약해줘</span></li>
          <li>어떤 형식으로 받고 싶나요? <span>예: 표로, 번호 순서로</span></li>
          <li>어떤 분위기의 글이면 좋겠나요? <span>예: 간결하게, 객관적으로</span></li>
          <li>누가 읽나요? <span>예: 처음 읽는 ○○이 ○분 안에 이해하도록</span></li>
          <li>결과물은 어떤 파일, 어느 정도 분량인가요? <span>예: 워드 한 장으로</span></li>
        </ol>
        <p class="try-frame">문장 틀: 너는 ( ) 담당자야. 첨부한 ( )을 ( )이 읽을 수 있게 ( )해줘. ( ) 형식으로, ( ) 분량으로 만들어줘.</p></div>
      ${noteBox(st.id + '.try', '내가 쓰는 프롬프트', '예: 너는 … 담당자야. 첨부한 … 을 …')}
      <div class="try-actions"><button class="g-btn" type="button" id="tryEval">평가받기</button></div>
      <div id="tryResult" class="try-result" aria-live="polite"></div>
      <details class="fold cn-fold try-fold"><summary>실습 프롬프트 보기 (직접 써 본 뒤에)</summary><div class="fold-b">${st.promptsTop.map(q => promptBox(D.texts[q.key], q.label)).join('')}</div></details>`;
  }
  function bindTry(st) {
    const btn = $('#tryEval'); if (!btn) return;
    btn.addEventListener('click', () => {
      const text = (S.notes[st.id + '.try'] || '').trim();
      const out = $('#tryResult');
      if (text.length < 10) { out.innerHTML = '<p class="try-empty">프롬프트를 먼저 써 주세요. (10자 이상)</p>'; return; }
      const r = scoreCostar(text); const sum = r.reduce((a, x) => a + x.got, 0);
      const miss = r.filter(x => x.got < x.max);
      out.innerHTML = `<div class="try-score"><span>10점 만점에</span><strong>${sum}점</strong></div>
        ${table(['요소', '점수', '보완할 점'], r.map(x => [x.name, `${x.got} / ${x.max}`, x.got === x.max ? '들어 있습니다' : x.tip]))}
        <p>${miss.length ? '빠진 요소를 보완해 다시 [평가받기]를 눌러 보세요.' : '여섯 가지가 모두 들어 있습니다. 실습 프롬프트와 비교해 보세요.'}</p>
        <p class="try-src">이 점수는 글에 들어 있는 표현을 찾아 자동으로 매긴 간이 점수입니다. 글을 AI에게 보내지 않으며, 내용이 맞는지까지 판단하지는 못합니다.</p>`;
    });
  }
  function renderStage(x) {
    const st = x.stage, p = x.part;
    $('#bcStage').textContent = st.solo ? `${p.short} › ${st.title}` : `${p.short} › ${st.no}단계 ${st.title}`;
    $('#shEyebrow').textContent = `${p.short} · ${st.kicker} · ${st.role}`;
    $('#shTitle').textContent = st.title;
    $('#shSum').textContent = st.goal.join(' ');
    $('#shMeta').innerHTML = `<span class="meta-chip active">산출물 · ${esc(st.output)}</span>`;
    const secs = [];
    let goal = `<ul class="plain">${st.goal.map(g => `<li>${esc(g)}</li>`).join('')}</ul><h3>이 단계에 필요한 것</h3>${ul(st.input)}`;
    if (st.tryPrompt) goal += tryBox(st);
    else if (st.promptsTop) goal += st.promptsTop.map(q => promptBox(D.texts[q.key], q.label)).join('');
    if (st.linkButton) goal += `<div class="go-studio mt16"><p><b>${esc(st.linkButton.label)}</b> — ${esc(st.linkButton.desc)}</p><a class="g-btn" href="${esc(st.linkButton.href)}" ${st.linkButton.download ? `download="${esc(st.linkButton.download)}"` : 'target="_blank" rel="noopener noreferrer"'}>${esc(st.linkButton.label)}</a></div>`;
    if (st.linkButton2) goal += `<div class="go-studio mt16"><p><b>${esc(st.linkButton2.label)}</b> — ${esc(st.linkButton2.desc)}</p><a class="g-btn" href="${esc(st.linkButton2.href)}" ${st.linkButton2.download ? `download="${esc(st.linkButton2.download)}"` : 'target="_blank" rel="noopener noreferrer"'}>${esc(st.linkButton2.label)}</a></div>`;
    if (st.copyButton) goal += `<div class="go-studio mt16"><p><b>운영 시트 사본 만들기</b> — 내 드라이브에 복사됩니다. 자동화 코드도 함께 복사됩니다.</p><a class="g-btn" href="${esc(D.sheetCopy)}" target="_blank" rel="noopener noreferrer">시트 사본 만들기</a></div>`;
    if (st.warn) goal += `<div class="safety-box mt16"><strong>꼭 지킬 것</strong><p>${esc(st.warn)}</p></div>`;
    secs.push(['goal', '학습 목표와 준비', goal]);
    let steps = `<ol class="plain">${st.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
    if (st.table && !st.table.after) steps += tableBlock(st.table);
    steps += tableBlock(st.table2);
    if (st.figures) steps += `<h3>${esc(st.figures.title)}</h3>${st.figures.items.map(f => `<figure class="result-fig"><div><img src="${esc(f.src)}" width="${f.w}" height="${f.h}" alt="${esc(f.alt)}" loading="lazy"></div><figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}<p class="local-note">${esc(st.figures.note)}</p>`;
    if (st.snippet) steps += `<h3>코드 맨 위 설정 영역만 고칩니다</h3>${promptBox(st.snippet, '설정 영역 예시 (Gemini 코드는 변수 이름이 다를 수 있음)', 'cn-code')}`;
    if (st.tip) steps += `<div class="result-card mt14"><strong>유료 계정 · 요청문 주소 바꾸는 법</strong><p>주소의 <code>/d/</code>와 <code>/edit</code> 사이 긴 문자열이 시트 고유번호입니다. 원본 번호 <code>${esc(D.sheetId)}</code> 자리에 내 사본 주소창의 번호를 넣습니다.</p></div>`;
    secs.push(['steps', '순서', steps]);
    if (st.prompt) secs.push(['prompt', '요청문 (복사해서 붙여 넣기)', promptBox(st.prompt.text, (st.code ? '1. ' : '') + st.prompt.label)]);
    if (st.prompts) secs.push(['prompt', st.prompts.length > 1 ? '복사할 것 (번호 순서대로)' : '요청문 (복사해서 붙여 넣기)', st.prompts.map((q, i) => promptBox(D.texts[q.key], (st.prompts.length > 1 ? (i + 1) + '. ' : '') + q.label)).join('')]);
    if (st.code) secs.push(['code', '참고 코드 (막힐 때)', codeBlock('2. ')]);
    if (st.extra) secs.push(['extra', st.extra.title, st.extra.html]);
    let chk = checklist(st.id, st.checks) + `<h3>성찰 질문</h3><p>${esc(st.reflect)}</p>`;
    if (st.table && st.table.after) chk += tableBlock(st.table);
    if (st.nextSolo) chk += `<div class="go-studio solo-next mt16"><p><b>강사와 함께하는 실습은 여기까지입니다.</b> 이제 같은 순서를 혼자 해 봅니다. ${esc(st.nextSolo.title)}</p><a class="g-btn" href="${esc(st.nextSolo.href)}">개인 실습 시작</a></div>`;
    if (st.quiz) secs.push(['quiz', '문제와 정답 확인', '<div class="sq" id="stageQuiz"></div>']);
    secs.push(['check', '검수', chk]);
    paint(st.id, secs);
    $('#stageBody').insertAdjacentHTML('afterbegin', stepFlow(p, st.id));
    if (st.tryPrompt) bindTry(st);
    if (st.quiz) stageQuiz(st);
  }
  function renderReview(x) {
    const r = x.review, p = x.part;
    $('#bcStage').textContent = `${p.short} › 마무리`;
    $('#shEyebrow').textContent = `${p.short} · WRAP-UP`;
    $('#shTitle').textContent = r.title;
    $('#shSum').textContent = p.id === 'mail' ? 'AI가 작성하고, 사람이 확인합니다. 보내기 전에 마지막으로 읽는 기준입니다. (원본 PPT 17번)' : '결과를 시트에 기록하고, 오늘 AI가 한 일과 내가 한 일을 나눠 봅니다.';
    $('#shMeta').innerHTML = '';
    const secs = [];
    const chk = ['check', p.id === 'mail' ? '발송 전 체크' : '검수', checklist(r.id, r.checks)];
    if (r.checkFirst) secs.push(chk);
    secs.push(['steps', p.id === 'mail' ? '정리하기' : '시트에 기록하기', `<ol class="plain">${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>`]);
    secs.push(['reflect', '성찰 질문', r.reflect.map((q, i) => noteBox(`${r.id}.q${i}`, q, '내 생각을 짧게 적어 보세요')).join('')]);
    if (r.homework) secs.push(['homework', '다음 시간 전 과제', ul(r.homework.map(esc))]);
    if (!r.checkFirst) secs.push(chk);
    paint(r.id, secs);
  }
  /* ---------- 점검: 나는 어떤 AI 사용자? ---------- */
  function checkLevel() {
    const C = D.selfcheck;
    const n = lv => C.levels[lv - 1].items.filter((_, i) => S.checks[`chk.${lv}.${i}`]).length;
    if (n(3) >= 2) return 3;
    if (n(2) >= 2) return 2;
    if (n(1) >= 1) return 1;
    return 0;
  }
  function resultHtml() {
    const lv = checkLevel(), r = D.selfcheck.result[String(lv)];
    const bar = [1, 2, 3].map(k => `<span class="cn-lv${k <= lv ? ' on' : ''}">${k}레벨</span>`).join('');
    return `<div class="cn-result"><div class="cn-lvbar">${bar}</div><strong>${esc(r[0])}</strong><p>${esc(r[1])}</p></div>`;
  }
  function renderCheck() {
    const C = D.selfcheck;
    $('#bcStage').textContent = '개인 연습실 · 체크하고 적용 시작하기';
    $('#shEyebrow').textContent = '7 · 개인 연습실';
    $('#shTitle').textContent = '체크하고 프롬프트로 적용 시작하기';
    $('#shSum').textContent = '실습 전에 지금 내가 AI를 어떻게 쓰고 있는지 점검합니다. 해당하는 것만 솔직하게 체크하세요. 나의 단계는 맨 마지막에 확인합니다. 결과는 이 기기에만 저장됩니다.';
    $('#shMeta').innerHTML = '<span class="meta-chip active">혼자 해 보기</span><span class="meta-chip">단계는 마지막에 확인</span>';
    const secs = [];
    /* 단계가 드러나지 않도록 문항을 섞어 한 목록으로 보여 준다. 단계는 맨 아래에서 단추를 눌러야 열린다. */
    const ORDER = [[2, 0], [1, 0], [3, 1], [2, 2], [1, 1], [3, 0], [2, 1], [3, 2]];
    secs.push(['quiz', '해당하는 것에 체크', `<p>평소 내 모습에 해당하는 것만 체크하세요. 몇 개를 체크해도 괜찮습니다.</p>
      <div class="checklist">${ORDER.map(([lv, i]) => `<label class="check-item"><input type="checkbox" data-k="chk.${lv}.${i}" ${S.checks[`chk.${lv}.${i}`] ? 'checked' : ''}><span>${esc(C.levels[lv - 1].items[i])}</span></label>`).join('')}</div>`]);
    secs.push(['apply', '프롬프트로 적용 시작하기', `<p>체크만 하고 끝내지 말고 지금 바로 AI에게 맡겨 봅니다. <b>업무가 아니어도 됩니다.</b> 가족 여행 일정 짜기, 모임 공지 쓰기, 장보기 목록처럼 일상의 일도 좋습니다.</p>
      <ol class="plain"><li>해 보고 싶은 일 하나를 아래에 적습니다.</li><li>요청문을 복사해 <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer">gemini.google.com</a>에 붙여 넣고, 대괄호 안을 내 일로 바꿔 보냅니다.</li><li>AI가 나눠 준 표에서 "AI에게 맡길 일" 하나를 골라 바로 시켜 봅니다.</li></ol>` +
      noteBox('apply.task', '내가 해 보고 싶은 일 (업무, 일상 모두 좋습니다)', '예: 교육생 20명에게 회의 안내 메일 보내기 / 가족 여행 2박 3일 일정 짜기') +
      promptBox(C.applyPrompt, '적용 시작 요청문 (gemini.google.com)') +
      noteBox('apply.result', 'AI에게 맡겨 본 일과 결과 한 줄', '예: 여행 일정 초안을 맡김. 이동 시간은 내가 지도에서 다시 확인함')]);
    secs.push(['tips', 'AI를 쓰기 전에 기억할 세 가지', `<div class="two-col">${C.tips.map(f => `<div class="result-card"><strong>${esc(f[0])}</strong><p>${esc(f[1])}</p></div>`).join('')}</div>`]);
    secs.push(['result', '나의 단계 확인', `<div id="cnResult"></div>`]);
    paint('check', secs);
    const box = $('#cnResult');
    const closed = () => { box.innerHTML = `<div class="go-studio"><p><b>체크를 모두 마쳤나요?</b> 단추를 누르면 나의 단계가 열립니다.</p><button class="g-btn" type="button" id="cnReveal">나의 단계 확인하기</button></div>`;
      $('#cnReveal').addEventListener('click', () => { box.innerHTML = resultHtml() + table(['단계', '기준'], C.levels.map(L => [L.name, L.short])) +
        `<p class="local-note">판정: 3레벨 문항 2개 이상 → 3레벨, 2레벨 문항 2개 이상 → 2레벨, 1레벨 문항 1개 이상 → 1레벨. ${esc(C.src)}</p>`; }); };
    closed();
    $('#stageBody').querySelectorAll('[data-k^="chk."]').forEach(i => i.addEventListener('change', closed));
  }
  function paint(id, secs) {
    const [prev, next] = navPair(id);
    $('#stageToc').innerHTML = '<strong>목차</strong>' + secs.map(s => `<a href="#${id}-${s[0]}" class="${s[0] === 'prompt' ? 'toc-run' : ''}">${esc(s[1])}</a>`).join('');
    const body = $('#stageBody');
    body.innerHTML = secs.map((s, i) => `<section id="${id}-${s[0]}"><span class="section-number">${i + 1}</span><h2>${esc(s[1])}</h2>${s[2]}</section>`).join('') +
      `<div class="lesson-navigation"><a href="${prev[0]}"><span>이전</span><strong>${esc(prev[1])}</strong></a><a class="lesson-next" href="${next[0]}"><span>다음</span><strong>${esc(next[1])}</strong></a></div>`;
    bindAll(body);
  }

  /* ---------- START 장표 ---------- */
  const SRC_YOZM = '출처: 요즘IT, 「AI vs 사람 맡길 일 고르는 기준 4가지」(위시켓 요즘IT 매거진) · 2026년 5~10월 요즘IT 사례 9편 분석';
  const SRC_AI = '출처: 과학기술정보통신부, 「2025 인터넷이용실태조사」 결과 발표(2026. 3. 31.) · 전국 22,671가구, 만 3세 이상 50,750명';
  const SIX = [['1장', '표지', '시선을 끄는 훅', '질문형·숫자형으로 3초 안에 멈추게'], ['2장', '문제', '독자의 불편', '"이런 적 있으시죠?"로 공감'], ['3장', '정보①', '핵심 정보', '비교나 개념 하나'], ['4장', '정보②', '핵심 정보', '3장과 짝이 되는 두 번째 정보'], ['5장', '선택 기준', '실천 방법', '독자가 바로 쓸 수 있는 기준'], ['6장', 'CTA', '행동 유도', '저장·댓글·공유 중 하나']];
  const KB1 = [['표지 훅', '청축·적축·갈축, 내 귀에는 뭐가 맞을까?'], ['1장', '청축·적축·갈축 / 3초 만에 고르기'], ['2장', '키감만 보고 샀다가 / 소음 때문에 후회할 수 있어요'], ['3장', '청축: 경쾌한 클릭음 / 타건 피드백이 분명해요'], ['4장', '적축: 조용하고 부드러움 / 갈축: 소리와 구분감의 중간'], ['5장', '사용 장소와 원하는 키감을 / 먼저 정하세요'], ['6장', '저장해 두고 매장에서 비교하세요']];
  const gi = g => SLIDES.findIndex(s => s.g === g);
  const SLIDES = [
    { g: 0, nav: '시작', title: '네 가지 키워드', html: () => `<span class="slide-kicker">START · Gemini 업무 자동화</span><h1>AI, 자동화, 카드뉴스, 사람의 확인</h1>
      <p class="slide-lead">실습 전에 보는 키워드. 먼저 제미나이 메일 자동화, 다음에 카드뉴스 만들기를 실습합니다.</p>
      <div class="kw3 cn-kw4"><a href="#start-${gi(1)}"><b>KEYWORD 1</b><strong>AI</strong><span>생성형 AI 이용 현황 · 오늘 쓰는 AI · API 키</span></a>
      <a href="#start-${gi(2)}"><b>KEYWORD 2</b><strong>자동화</strong><span>Apps Script · 맡길 일 고르는 기준 4가지 · 제미나이 메일 자동화 흐름</span></a>
      <a href="#start-${gi(3)}"><b>KEYWORD 3</b><strong>카드뉴스</strong><span>6장 구조 · 표지 훅 · 카드뉴스 만들기 흐름</span></a>
      <a href="#start-${gi(4)}"><b>KEYWORD 4</b><strong>사람의 확인</strong><span>AI가 만들고 사람이 확인하고 결정 · 보내기 전에 볼 것</span></a></div>` },
    { g: 1, nav: '1-1', title: '생성형 AI 이용 현황', html: () => `<span class="slide-kicker">1. AI · 1) 우리나라 생성형 AI 이용 현황</span><h1>국민 절반 가까이가 써 봤습니다</h1>
      <div class="stat3">
        <div class="stat"><em>생성형 AI 경험률</em><strong>44.5%</strong><div class="cap">2024년 33.3% → 2025년 44.5%</div><p>1년 사이 11.2%p 늘었습니다.</p></div>
        <div class="stat"><em>사무직 경험률</em><strong>71.9%</strong><div class="cap">직업별로 가장 높음</div><p>문서·메일·홍보물을 다루는 일에서 AI를 가장 먼저 쓰고 있습니다.</p></div>
        <div class="stat"><em>정보·결과물을 믿는다</em><strong>54.7%</strong><div class="cap">절반 남짓만 결과를 신뢰</div><p>AI가 만든 메일·코드·원고는 사람이 확인하고 써야 합니다.</p></div>
      </div><p class="src">${esc(SRC_AI)}</p>` },
    { g: 1, nav: '1-2', title: '서비스별 이용과 안 쓰는 이유', html: () => `<span class="slide-kicker">1. AI · 2) 어떤 AI를 쓰고, 왜 안 쓰나</span><h1>ChatGPT 41.8%, Gemini 9.8%</h1>
      <p class="slide-lead">서비스별 경험률(복수응답). 오늘은 무료로 시작하는 방법부터 봅니다.</p>
      <div class="pts"><div class="pt"><b>안 쓰는 이유 ①</b><strong>필요를 못 느낀다</strong><p>미이용자 55.5% 중 49.5%가 "관심 또는 필요가 없어서"라고 답했습니다.</p></div>
      <div class="pt"><b>안 쓰는 이유 ②</b><strong>방법을 모른다</strong><p>"이용 방법을 몰라서"가 60대 25.3%, 70대 이상 26.1%로 상대적으로 높았습니다.</p></div></div>
      <div class="note">오늘은 "내 일에 필요한 곳"(메일, 홍보 카드뉴스)과 "쓰는 방법"을 함께 해결합니다.</div><p class="src">${esc(SRC_AI)}</p>` },
    { g: 1, nav: '1-3', title: '오늘 쓰는 AI', html: () => `<span class="slide-kicker">1. AI · 3) 오늘 쓰는 AI</span><h1>도구마다 맡는 일이 다릅니다</h1>
      <div class="stat3 cn-tools">
        <div class="stat"><em>G-mail · 카드뉴스</em><strong>Gemini</strong><div class="cap">코드 작성, 원고 자동 생성</div><p>제미나이 메일 자동화에서는 메일 발송 코드를 받고, 카드뉴스 만들기에서는 시트 버튼으로 카드뉴스 원고를 만듭니다.</p></div>
        <div class="stat"><em>카드뉴스 만들기</em><strong>ChatGPT</strong><div class="cap">프로젝트에 지침을 한 번 저장</div><p>지침과 시트를 넣어 두면 요청문 한 번으로 게시 문구와 이미지 구성을 받습니다.</p></div>
        <div class="stat"><em>카드뉴스 만들기</em><strong>Canva</strong><div class="cap">편집할 수 있는 디자인</div><p>4:5 세로 카드 6장을 받습니다. 연결이 안 되면 표지 이미지 한 장으로 대신합니다.</p></div>
      </div><p class="src">요금제에 따라 ChatGPT 프로젝트·앱 연결과 Canva 기능이 다를 수 있습니다.</p>` },
    { g: 1, nav: '1-4', title: 'API 키란', html: () => `<span class="slide-kicker">1. AI · 4) API와 API 키 (카드뉴스 만들기)</span><h1>API 키는 내 AI 출입증입니다</h1>
      <div class="pts cn-pts3"><div class="pt"><b>API</b><strong>프로그램끼리 대화하는 창구</strong><p>사람이 채팅창에 쓰는 대신, 시트가 Gemini에게 직접 요청하고 답을 받아 옵니다.</p></div>
      <div class="pt"><b>API 키</b><strong>"내가 보낸 요청"이라는 증명</strong><p>Google AI Studio에서 발급합니다. 이 키로 쓴 사용량은 내 계정에 쌓입니다.</p></div>
      <div class="pt"><b>지킬 것</b><strong>비밀번호처럼 나만 보관</strong><p>채팅방·시트 셀·메신저에 붙여 넣지 않습니다.</p></div></div>` },
    { g: 2, nav: '2-1', title: 'Apps Script란', html: () => `<span class="slide-kicker">2. 자동화 · 1) Apps Script</span><h1>시트에 붙이는 작은 프로그램</h1>
      <div class="pts cn-pts3"><div class="pt"><b>무엇</b><strong>Google 서비스용 코드</strong><p>시트, Gmail, 캘린더를 이어 반복하는 일을 대신하게 하는 Google의 스크립트입니다.</p></div>
      <div class="pt"><b>어디서</b><strong>[확장 프로그램] → [Apps Script]</strong><p>시트 안에서 바로 열립니다. 설치할 것이 없습니다.</p></div>
      <div class="pt"><b>오늘</b><strong>메일 발송 · 원고 생성</strong><p>제미나이 메일 자동화는 목록대로 메일을 보내고, 카드뉴스 만들기는 이미 들어 있는 코드로 Gemini 원고를 받습니다.</p></div></div>` },
    { g: 2, nav: '2-2', title: '코드는 Gemini가', html: () => `<span class="slide-kicker">2. 자동화 · 2) 코드를 몰라도</span><h1>코드는 Gemini가, 판단은 내가</h1>
      <div class="recap"><div class="recap-col"><b>Gemini가 하는 일</b><span>요청한 기능대로 코드 쓰기</span><span>오류 문장을 보고 고치기</span><span>코드 설명하기</span></div>
      <div class="recap-col"><b>내가 하는 일</b><span>원하는 기능을 번호로 나눠 말하기</span><span>제목·본문·받는 사람 확인</span><span>테스트를 보고 전체 실행 결정</span></div></div>
      <div class="note">좋은 요청 = 정보의 구체성. 시트 구성과 기능을 빠짐없이 적을수록 고칠 일이 줄어듭니다.</div>` },
    { g: 2, nav: '2-3', title: '맡길 일 고르는 기준 4가지', html: () => `<span class="slide-kicker">2. 자동화 · 3) AI에게 무엇을 맡길까</span><h1>AI vs 사람, 맡길 일 고르는 기준 4가지</h1>
      <p class="slide-lead">요즘IT가 2026년 5~10월에 실린 AI 활용 사례 9편을 분석해 정리한 기준입니다. 파란 글씨는 오늘 제미나이 메일 자동화에 적용한 곳입니다.</p>
      <div class="pts"><div class="pt"><b>기준 1</b><strong>맡길 가치가 있는 일인가</strong><p>자주, 오래, 틀리면 위험하게 반복되는 일부터 맡깁니다. 1년에 한두 번 하는 일은 도구를 만들고 관리하는 품이 더 클 수 있습니다.</p><p class="cn-apply">오늘: 여러 사람에게 같은 안내 메일 보내기</p></div>
      <div class="pt"><b>기준 2</b><strong>정해진 답이 있는 일인가</strong><p>답이 정해진 일은 AI가 매번 판단하게 두지 않고 규칙으로 고정합니다. 그 규칙은 AI와 함께 만들어도 됩니다.</p><p class="cn-apply">오늘: "C열이 체크되어 있고 D열이 발송 완료가 아니면 보낸다"는 규칙을 Gemini와 코드로 만듦</p></div>
      <div class="pt"><b>기준 3</b><strong>틀리면 되돌릴 수 있는 일인가</strong><p>되돌리기 어려운 결정과 승인은 사람에게 남깁니다. "경계선을 정하는 건 AI의 성능이 아니라 오류의 비용"입니다.</p><p class="cn-apply">오늘: 보낸 메일은 되돌릴 수 없으니 발송은 내가 결정</p></div>
      <div class="pt"><b>기준 4</b><strong>어디서 확인할 것인가</strong><p>"완료" 보고만 믿지 말고, 결과를 언제 어디서 확인할지 맡기기 전에 정해 둡니다.</p><p class="cn-apply">오늘: 첫 번째 주소(내 주소)로 테스트 발송, 발송 전 체크리스트</p></div></div>
      <p class="src">${esc(SRC_YOZM)}</p>` },
    { g: 2, nav: '2-4', title: '먼저 해 본 사람들의 숫자', html: () => `<span class="slide-kicker">2. 자동화 · 4) 사례로 보는 기준</span><h1>먼저 맡겨 본 사람들이 겪은 일</h1>
      <div class="pts"><div class="pt"><b>기준 1 · 사업관리 담당자</b><strong>400쪽 · 매달 30분~1시간</strong><p>점검철 스캔본에서 서명 누락을 찾는 일을 가장 먼저 자동화했습니다. 1년에 한두 번 하는 일은 만들 수 있어도 만들지 않았습니다.</p></div>
      <div class="pt"><b>기준 2 · AI 진단 서비스 팀</b><strong>72점, 85점, 61점</strong><p>같은 페이지를 세 번 AI에게 진단시키자 점수가 매번 달랐습니다. 정해진 사실은 코드가, 판단만 AI가 맡도록 나눴습니다.</p></div>
      <div class="pt"><b>기준 3 · 법률 AI 서비스</b><strong>쟁점은 AI, 소송 결정은 사람</strong><p>틀려도 상담에서 바로잡을 수 있는 쟁점 정리는 AI가, 되돌리기 어려운 소송 여부는 끝까지 사람이 정하게 했습니다.</p></div>
      <div class="pt"><b>기준 4 · 개발 도구</b><strong>요구사항 40개 중 25개</strong><p>AI가 "개발 완료"라고 보고했지만 실제로 들어간 건 25개였습니다. 이후 추적표를 만들어 사람이 빠진 곳을 확인합니다.</p></div></div>
      <div class="note">AI에게 맡긴다는 것은 사람의 일이 사라지는 것이 아니라, 사람이 봐야 할 곳이 좁고 분명해지는 것입니다.</div>
      <p class="src">${esc(SRC_YOZM)}</p>` },
    { g: 2, nav: '2-5', title: '제미나이 메일 자동화 흐름', html: () => `<span class="slide-kicker">2. 자동화 · 5) 제미나이 메일 자동화</span><h1>시트에서 Gmail까지 일곱 단계</h1>
      <p class="slide-lead">코드는 AI에게 요청하고, 시트의 구성 요소는 내가 정합니다.</p>${flowHtml(FLOW_MAIL, 'wide4')}` },
    { g: 3, nav: '3-1', title: '카드뉴스 6장 구조', html: () => `<span class="slide-kicker">3. 카드뉴스 · 1) 6장의 역할</span><h1>장마다 맡은 일이 있습니다</h1>
      <p class="slide-lead">규칙: 장마다 제목 1줄 + 본문 2줄 이내. 확인되지 않은 사양·가격·건강 정보는 단정하지 않습니다.</p>
      <div class="cn-six">${SIX.map(x => `<div><b>${esc(x[0])} · ${esc(x[1])}</b><strong>${esc(x[2])}</strong><span>${esc(x[3])}</span></div>`).join('')}</div>
      <p class="src">출처: 운영 시트 'GPT 프로젝트 설정' 탭의 프로젝트 지침</p>` },
    { g: 3, nav: '3-2', title: '예시로 읽기', html: () => `<span class="slide-kicker">3. 카드뉴스 · 2) 예시로 읽기</span><h1>KB-001 · 스위치 소리 비교</h1>
      <p class="slide-lead">타깃: 기계식 키보드 입문자. 각 장이 여섯 역할 중 무엇인지 맞혀 보세요.</p>${table(['장', '원고 (제목 / 본문)'], KB1)}
      <p class="src">출처: 운영 시트 '카드뉴스 관리' 탭 KB-001 행</p>` },
    { g: 3, nav: '3-3', title: '좋은 표지 훅', html: () => `<span class="slide-kicker">3. 카드뉴스 · 3) 표지 훅</span><h1>표지 훅 세 가지 유형</h1>
      <div class="pts cn-pts3"><div class="pt"><b>01 · 질문형</b><strong>업무용 키보드, 예쁜 것보다 먼저 볼 5가지</strong><p>독자가 스스로 답을 떠올리게 합니다. (KB-003)</p></div>
      <div class="pt"><b>02 · 숫자형</b><strong>5만·10만·20만 원대, 어디서 차이가 날까?</strong><p>범위가 분명해 끝까지 볼 이유가 생깁니다. (KB-006)</p></div>
      <div class="pt"><b>03 · 공감형</b><strong>손목이 아프다면 키보드 높이부터 확인하세요</strong><p>불편을 먼저 짚어 "내 얘기"로 느끼게 합니다. (KB-005)</p></div></div>` },
    { g: 3, nav: '3-4', title: '카드뉴스 만들기 흐름', html: () => `<span class="slide-kicker">3. 카드뉴스 · 4) 카드뉴스 만들기</span><h1>시트 한 줄에서 디자인까지</h1>
      <p class="slide-lead">모든 결과가 내 시트 한 줄에 모입니다. 내가 직접 쓰는 칸은 B~I열 여덟 개뿐입니다.</p>${flowHtml(FLOW_CARD, 'wide')}` },
    { g: 4, nav: '4-1', title: '한도와 권한', html: () => `<span class="slide-kicker">4. 사람의 확인 · 1) 보내기 전에 알아 둘 것</span><h1>한도와 권한을 먼저 압니다</h1>
      <div class="stat3"><div class="stat"><em>개인 Gmail 계정</em><strong>100명</strong><div class="cap">Apps Script 하루 발송 받는 사람 수</div><p>Google Workspace 계정은 1,500명입니다. 한도는 바뀔 수 있습니다.</p><p class="src">출처: Google Apps Script, Quotas for Google Services</p></div>
      <div class="stat"><em>처음 한 번</em><strong>권한 승인</strong><div class="cap">"확인되지 않은 앱" 화면</div><p>내가 만든 코드라 Google 심사를 받지 않았다는 뜻입니다. 출처를 아는 코드일 때만 허용합니다.</p></div>
      <div class="stat"><em>되돌릴 수 없음</em><strong>테스트 먼저</strong><div class="cap">나에게 먼저 보내기</div><p>메일은 첫 번째 주소(내 주소)로 테스트한 뒤 발송합니다.</p></div></div>` },
    { g: 4, nav: '4-2', title: '실습 전 약속', html: () => `<span class="slide-kicker">4. 사람의 확인 · 2) 실습 전 약속</span><h1>AI가 작성하고, 사람이 확인합니다</h1>
      <div class="recap"><div class="recap-col"><b>AI가 하는 일</b><span>메일 발송 코드 쓰기</span><span>카드뉴스 원고·표지 훅 제안</span><span>게시 문구와 이미지 구성</span></div>
      <div class="recap-col"><b>사람이 하는 일</b><span>받는 사람과 주제 정하기</span><span>날짜·가격·건강 정보 확인</span><span>보낼지, 게시할지 최종 결정</span></div></div>
      <div class="note">예시 주소만 씁니다. API 키는 나만 봅니다. 모르는 코드는 허용하지 않습니다.</div>` }
  ];
  const GROUPS = ['시작', 'AI', '자동화', '카드뉴스', '사람의 확인'];
  let deckIdx = 0;
  function renderStart(i) {
    deckIdx = Math.max(0, Math.min(SLIDES.length - 1, i || 0));
    const sl = SLIDES[deckIdx];
    $('#deckWhere').textContent = sl.title;
    $('#deckSlide').innerHTML = sl.html();
    $('#deckTabs').innerHTML = GROUPS.map((g, k) => `<button type="button" role="tab" data-i="${gi(k)}" class="${sl.g === k ? 'on' : ''}">${k ? `<b>${k}</b>` : ''}${esc(g)}</button>`).join('');
    $('#deckDots').innerHTML = SLIDES.map((s, k) => `<button type="button" data-i="${k}" class="${k === deckIdx ? 'on' : ''}" aria-label="${esc(s.title)}" title="${esc(s.title)}"></button>`).join('');
    $('#viewStart').querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { location.hash = '#start-' + b.dataset.i; }));
    $('#deckPrev').disabled = false;
    $('#deckPrev').textContent = deckIdx === 0 ? '← 처음 화면' : '← 이전';
    $('#deckNext').textContent = deckIdx === SLIDES.length - 1 ? '메일 자동화로 →' : '다음 →';
  }
  $('#deckPrev').addEventListener('click', () => { if (deckIdx > 0) location.hash = '#start-' + (deckIdx - 1); else location.hash = '#ai'; });
  $('#deckNext').addEventListener('click', () => { location.hash = deckIdx === SLIDES.length - 1 ? '#' + SEQ[0].id : '#start-' + (deckIdx + 1); });
  document.addEventListener('keydown', e => {
    if ($('#viewStart').hidden || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' && deckIdx < SLIDES.length - 1) location.hash = '#start-' + (deckIdx + 1);
    if (e.key === 'ArrowLeft' && deckIdx > 0) location.hash = '#start-' + (deckIdx - 1);
  });

  /* ---------- 바로가기 ---------- */
  function renderQuick() {
    const groups = [
      ['AI 사용 현황', [['#ai', '현황', 'AI 사용 현황 안내'], ...SLIDES.map((s, i) => ['#start-' + i, s.nav, s.title])]],
      ['시작하기 전에', [['ai-test/', '맨 처음', 'AI 역량검사'], ['who/', '그다음', '나는 어떤 AI 사용자? 맞춰 보기']]],
      ...D.parts.map(p => [p.title, [...p.stages.map(s => ['#' + s.id, s.no + '단계', s.title]), ...(p.review ? [['#' + p.review.id, '마무리', p.review.title]] : [])]]),
      ['할루시네이션', [['#hallu', '정리', 'OpenAI · Anthropic 기준 줄이는 방법']]],
      ['관심정보 모으기', [['#track', '방법', 'ChatGPT · Gemini · Claude에서 예약하기']]],
      ['점검', [['#quiz', '퀴즈', '객관식 다섯 문제']]],
      ['의견 주세요!', [['#opinion', '의견', '다음 교육에서 배우고 싶은 과정']]],
      ['자료실', [['#materials', '자료', '파일, 요청문, 참고 코드']]],
      ['개인 연습실', [['#check', '연습', '체크하고 프롬프트로 적용 시작하기'], ['../prompt-practice/', '연습', '질문 구조 연습']]],
      ['안내', [['#safety', '유의', '실제 업무에 쓸 때'], ['#help', '도움', '막힐 때'], ['#sources', '출처', '참고 자료']]]
    ];
    $('#quickPanel').innerHTML = groups.map(g => `<div class="menu-group"><strong>${esc(g[0])}</strong>${g[1].map(x => `<a href="${x[0]}"><span>${esc(x[1])}</span>${esc(x[2])}</a>`).join('')}</div>`).join('');
    $('#quickPanel').addEventListener('click', e => { if (e.target.closest('a')) $('#quickMenu').open = false; });
    document.addEventListener('click', e => { if (!e.target.closest('#quickMenu')) $('#quickMenu').open = false; });
  }

  /* ---------- 라우팅 ---------- */
  const HOME_SECS = ['ai', 'gpt', 'practice', 'intro', 'before', 'goals', 'mail', 'card', 'materials', 'safety', 'help', 'sources', 'report', 'data', 'hallu', 'course', 'info', 'quiz', 'opinion', 'track'];
  function route() {
    const h = (location.hash || '#home').replace('#', '');
    const [view, sub] = h.split('-');
    ['#viewHome', '#viewStart', '#viewStage'].forEach(v => { $(v).hidden = true; });
    let target = null;
    $('#quickMenu').open = false;
    const x = find(view);
    if (view === 'check') { $('#viewStage').hidden = false; renderCheck(); }
    else if (view === 'start') { $('#viewStart').hidden = false; renderStart(Number(sub) || 0); }
    else if (x && x.stage) { $('#viewStage').hidden = false; renderStage(x); }
    else if (x && x.review) { $('#viewStage').hidden = false; renderReview(x); }
    else { $('#viewHome').hidden = false; renderHome(); if (HOME_SECS.includes(view)) target = document.getElementById('sec-' + view); }
    if (sub && view !== 'start') target = document.getElementById(h);
    requestAnimationFrame(() => { if (target) { const dt = target.closest('details'); if (dt) dt.open = true; target.scrollIntoView({ block: 'start' }); const h = location.hash; [250, 700].forEach(ms => setTimeout(() => { if (location.hash === h && Math.abs(target.getBoundingClientRect().top) > 140) target.scrollIntoView({ block: 'start' }); }, ms)); } else window.scrollTo(0, 0); });
  }

  renderStatic();
  renderQuick();
  window.addEventListener('hashchange', route);
  route();
})();
