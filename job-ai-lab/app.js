/* AI 취업지원 실습실 — 화면 전환, 내담자 유형, 3단계 표(분석→진단→전략), AI 표 붙여 넣기, 검수 표시.
   입력한 내용은 어디에도 보내지 않으며 이 기기의 localStorage에만 저장한다. */
(function () {
  'use strict';
  const D = window.LAB;
  const $ = (s, el) => (el || document).querySelector(s);
  const KEY = 'jobAiLab.v1';

  /* ---------- 저장 ---------- */
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { S = {}; }
  S.type = S.type || 'youth';
  S.checks = S.checks || {};
  S.req = S.req || [];          // 1단계 요구역량표 [{part, quote, need, comp, must}]
  S.judge = S.judge || {};      // 2단계 {type: {comp: {j, q, note, gapOverride}}}
  S.plan = S.plan || {};        // 3단계 {type: {rows: [{item, gap, strategy, support, goal, date}], msg}}
  S.notes = S.notes || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 불가 시 무시 */ } };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const client = () => D.clients[S.type];
  /* 판단 기준(자기진단 양식): 기본은 직업공통능력 21개 · 4점 척도. 기관 양식으로 바꿀 수 있다. */
  S.form = S.form || { mode: 'default', items: [], max: 4, cut: 3, text: '' };
  S.self = S.self || {};        // 직접 고친 자기진단 점수 {유형(.c): {항목: 점수}}
  const isCustom = () => S.form.mode === 'custom' && S.form.items.length > 0;
  const crit = () => (isCustom() ? S.form.items : D.competencies);
  const compNames = () => crit().map(c => c.name);
  const scaleMax = () => (isCustom() ? Number(S.form.max) || 4 : 4);
  const scaleCut = () => (isCustom() ? Number(S.form.cut) || 3 : 3);
  const selfKey = () => S.type + (isCustom() ? '.c' : '');
  function selfScore(n) {
    const o = (S.self[selfKey()] || {})[n];
    if (o !== undefined && o !== '') return Number(o);
    return isCustom() ? '' : client().self[n];
  }
  const FILE_BASE = 'files/';

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

  function parseMdTable(text) {
    const rows = [];
    text.split(/\r?\n/).forEach(ln => {
      const t = ln.trim();
      if (!t.startsWith('|')) return;
      const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      if (cells.every(c => /^:?-{2,}:?$/.test(c))) return;
      rows.push(cells);
    });
    if (rows.length > 1 && rows[0].some(c => /구분|하위능력|격차 항목|공고/.test(c))) rows.shift();
    return rows;
  }
  function normComp(name) {
    const n = (name || '').replace(/\s/g, '');
    if (!n) return '';
    const names = compNames();
    return names.find(c => c.replace(/\s/g, '') === n) || names.find(c => n.includes(c.replace(/\s/g, ''))) || '';
  }
  function splitComps(cell) {
    return (cell || '').split(/[,，·/]/).map(normComp).filter(Boolean);
  }
  function gapType(j, s) {
    if (s === '' || s === undefined || s === null) return '';
    const hi = Number(s) >= scaleCut();
    if (j === '충족') return hi ? '충족' : '과소평가';
    if (j === '부분' || j === '미흡') return hi ? '증거 부족' : '역량 부족';
    return '';
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

  /* ---------- 진행 ---------- */
  function stageDone(id) {
    const st = D.stages.find(s => s.id === id);
    return st.checks.every((_, i) => S.checks[`${id}.${i}`]);
  }
  function renderProgress() {
    const n = D.stages.filter(s => stageDone(s.id)).length;
    $('#pgNum').textContent = `${n} / ${D.stages.length}`;
    $('#pgBar').style.width = (n / D.stages.length * 100) + '%';
  }

  /* ---------- 시작 화면 ---------- */
  function renderTypePick() {
    const box = $('#typePick');
    box.innerHTML = Object.entries(D.clients).map(([k, c]) =>
      `<button type="button" class="type-btn ${S.type === k ? 'on' : ''}" data-type="${k}"><b>${k === 'youth' ? 'A' : 'B'}</b><div><strong>${esc(c.label)} · ${esc(c.who)}</strong><span>${esc(c.summary)}</span></div></button>`).join('');
    box.querySelectorAll('.type-btn').forEach(b => b.addEventListener('click', () => { S.type = b.dataset.type; save(); renderTypePick(); renderHomeStages(); }));
  }
  function renderTimeline() {
    $('#timelineTable').innerHTML = '<thead><tr><th>시간</th><th>구분</th><th>단계</th><th>내용</th><th>산출물</th></tr></thead><tbody>' +
      D.timeline.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td></tr>`).join('') + '</tbody>';
  }
  function renderHomeStages() {
    const c = client();
    $('#homeStages').innerHTML = `<section class="level-section">
      <div class="level-head"><div><span class="level-kicker">PRACTICE · ${esc(c.label)}</span><h2>실습 3단계와 사례 검토</h2></div>
      <p>${esc(c.who)}이(가) 한빛시 일자리플러스센터 직업상담사 공고에 지원합니다. 1단계 표가 2단계로, 2단계 격차표가 3단계로 자동으로 넘어갑니다.</p></div>
      <div class="lesson-grid">${D.stages.map(s => `<a class="lesson-card ${stageDone(s.id) ? 'is-done' : ''}" href="#${s.id}">
        <span class="lesson-code">${esc(s.kicker)} · ${esc(s.time)}</span><h3>${esc(s.title)}</h3><p>${esc(s.goal[0])}</p>
        <div class="lesson-output">산출물 <span>${esc(['요구역량표', '격차표', '취업지원 계획서'][Number(s.no) - 1])}</span></div><div class="lesson-arrow">${esc(s.role)} →</div></a>`).join('')}
      <a class="lesson-card" href="#review"><span class="lesson-code">REVIEW · ${esc(D.review.time)}</span><h3>사례 검토와 적용</h3><p>AI 결과와 내 판단이 달랐던 곳을 동료와 검토하고, 내 상담 절차에 넣을 한 가지를 정합니다.</p><div class="lesson-output">산출물 <span>적용 계획</span></div><div class="lesson-arrow">검토 →</div></a>
      </div></section>`;
    renderProgress();
  }
  function renderDownloads() {
    $('#zipLink').href = FILE_BASE + D.zip;
    $('#downloadGroups').innerHTML = D.files.map(g => `<h3 class="dl-h">${esc(g.group)}</h3><div class="dl-grid">${g.items.map(([f, d]) =>
      `<div class="dl-item"><div><strong>${esc(f)}</strong><span>${esc(d)}</span></div><div class="btn-pair"><a class="g-btn ghost" href="${FILE_BASE}${encodeURIComponent(f)}.pdf" download>PDF</a><a class="g-btn ghost" href="${FILE_BASE}${encodeURIComponent(f)}.docx" download>DOCX</a></div></div>`).join('')}</div>`).join('');
    $('#skillGrid').innerHTML = D.skills.map(s => `<div class="dl-item"><div><strong>${esc(s.title)}</strong><span>${esc(s.name)}.zip · ${esc(s.desc)}</span></div><a class="g-btn ghost" href="${FILE_BASE}%EC%8A%A4%ED%82%AC/${s.name}.zip" download>zip</a></div>`).join('');
    const a = D.after;
    $('#afterBox').innerHTML = `<div class="two-col">
      <div class="result-card"><strong>Gemini 스킬로 등록</strong><ol class="plain">${a.gemini.map(x => `<li>${esc(x)}</li>`).join('')}</ol><p class="local-note">${esc(a.gemini_note)}</p></div>
      <div class="result-card"><strong>ChatGPT 프로젝트 지침으로 등록</strong><ol class="plain">${a.chatgpt.map(x => `<li>${esc(x)}</li>`).join('')}</ol><p class="local-note">${esc(a.chatgpt_note)}</p></div></div>`;
    $('#sourceList').innerHTML = D.sources.map(s => `<li>${esc(s).replace(/(https?:\/\/\S+)/, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}</li>`).join('');
    $('#sourceList').classList.add('sources-ol');
    $('#helpList').innerHTML = `<div class="two-col">
      <div class="result-card"><strong>파일 첨부가 안 된다</strong><p>파일 대신 본문을 복사해 요청문 아래에 붙여 넣습니다. 자료 받기의 DOCX를 열어 전체 선택(Ctrl+A), 복사(Ctrl+C)합니다.</p></div>
      <div class="result-card"><strong>"오늘 이용량을 다 썼다"는 안내가 뜬다</strong><p>ChatGPT에 같은 요청문을 그대로 넣습니다. 2단계는 하위능력을 3~4개씩 나눠 보내면 이용량을 아낄 수 있습니다.</p></div>
      <div class="result-card"><strong>AI가 표가 아닌 글로 답한다</strong><p>"위 내용을 요청문의 열 순서대로 마크다운 표 하나로만 다시 출력해 줘"라고 보냅니다.</p></div>
      <div class="result-card"><strong>표로 옮기기를 눌러도 아무 일이 없다</strong><p>붙여 넣은 글에 세로줄(|)로 나뉜 표가 있어야 합니다. 머리글 행이 요청문의 열 순서와 같은지 확인합니다. 그래도 안 되면 표에 직접 입력합니다.</p></div>
      <div class="result-card"><strong>복사 단추가 듣지 않는다</strong><p>글 상자가 선택된 상태가 되므로 Ctrl+C로 복사합니다.</p></div>
      <div class="result-card"><strong>처음부터 다시 하고 싶다</strong><p>각 단계 표 위의 [표 비우기]를 누릅니다. 이 기기에 저장된 내용만 지워집니다.</p></div></div>`;
  }

  /* ---------- 먼저 알기 ---------- */
  function renderBasics() {
    const areas = [...new Set(D.competencies.map(c => c.area))];
    const secs = [
      ['b1', '취업시장의 변화 3가지와 고용서비스의 역할 3가지', `<p>생성형 AI가 자료 탐색과 문서 초안 작성에 쓰이면서 같은 직무에서도 요구 역량의 조합이 달라지고, 구직자는 이전 과업 가운데 새 직무에 쓸 수 있는 경험을 설명해야 하며, 고용서비스에는 AI 매칭이 들어왔습니다(안은경, 2026, Ⅰ.1·Ⅴ.2). 이 실습실은 그 변화에 대응하는 실무자의 역할을 세 단계에 하나씩 두었습니다.</p>
        <div class="g-table"><table><thead><tr><th>변화</th><th>역할</th><th>하는 일</th><th>단계</th></tr></thead><tbody>${D.roles.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table></div>
        <p class="local-note">역할 이름 세 가지는 원고의 두 과제(공고 읽기와 연결, AI 추천 판단)를 세 단계에 맞춰 커리어캐쳐가 나눠 붙인 것입니다.</p>`],
      ['b2', '채용 트렌드 2027 키워드가 들어가는 자리', `<p>윤영돈(2026)의 10대 키워드를 각 단계의 활동에 연결했습니다. 키워드 정의는 책 본문과 대조해 쓰며, 여기서는 어느 단계에서 무엇을 볼지만 적었습니다.</p>
        <div class="kw-grid">${D.keywords.map(k => `<div class="kw-item"><strong>${esc(k[0])}<em>${esc(k[1])}</em></strong><span>${esc(k[2])}</span></div>`).join('')}</div>`],
      ['b3', '판단 기준: 직업공통능력 7개 영역 21개 하위능력', `<p>직무와 상관없이 모든 직업인에게 공통으로 요구되는 능력입니다. 2026년 4월 28일 고용노동부가 직업기초능력(10개 영역 34개 하위능력)을 직업공통능력 7개 영역 21개 하위능력으로 개편하면서 인공지능(AI)활용능력, 디지털책임의식, 산업안전보건의식을 새로 넣었습니다(고용노동부, 2026). 직무별 전문 역량은 NCS 능력단위(ncs.go.kr)를 씁니다.</p>
        <div class="comp-grid">${areas.map(a => `<div class="comp-area"><strong>${esc(a)}</strong>${D.competencies.filter(c => c.area === a).map(c => `<span>${esc(c.name)}</span>`).join('')}</div>`).join('')}</div>
        <p class="local-note">이 실습실의 "판정 단서"는 커리어캐쳐가 쓴 요약입니다. 표준 원문의 수행기준·평가준거는 NCS 누리집의 직업공통능력 표준 파일에서 확인합니다.</p>`],
      ['b4', '격차 유형 네 가지와 처방', `<p>2단계에서 자기진단(1~4점)과 AI 서류 판정(충족·부분·미흡)을 겹치면 격차 유형이 나옵니다. 유형이 다르면 처방이 다릅니다. 이 규칙은 커리어캐쳐의 제안이며 표준화 검사가 아닙니다.</p>
        <div class="g-table"><table><thead><tr><th>유형</th><th>규칙</th><th>전략</th></tr></thead><tbody>${D.gapTypes.map(g => `<tr><td>${esc(g.id)}</td><td>${esc(g.rule)}</td><td>${esc(g.strategy)}</td></tr>`).join('')}</tbody></table></div>`],
      ['b5', 'AI에 맡기는 일과 맡기지 않는 일', `<ul class="plain">
        <li><b>맡기는 것</b>: 긴 글에서 문장 추출, 기준에 따른 분류, 표 초안 만들기, 문장 다듬기.</li>
        <li><b>맡기지 않는 것</b>: 적합 여부 최종 판단, 제도의 금액·요건 확정, 내담자에게 전할 말의 최종 결정.</li>
        <li><b>항상 하는 것</b>: AI 결과의 모든 행을 원문과 대조한다. 근거 문장이 원문에 없으면 그 행은 지운다.</li>
        <li><b>절대 하지 않는 것</b>: 실제 내담자의 식별 정보를 가리지 않고 넣는 것. 나이·성별·학교로 판단하게 하는 것.</li></ul>
        <h3>오늘 쓰는 도구</h3>${D.tools.map(t => `<div class="tool-row"><div><strong>${esc(t.name)}</strong><p>${esc(t.how)}</p><small>${esc(t.note)}</small></div><a class="g-btn ghost" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">열기</a></div>`).join('')}`],
    ];
    $('#basicsToc').innerHTML = '<strong>목차</strong>' + secs.map(s => `<a href="#basics-${s[0]}">${esc(s[1])}</a>`).join('');
    $('#basicsBody').innerHTML = secs.map((s, i) => `<section id="basics-${s[0]}"><span class="section-number">${i + 1}</span><h2>${esc(s[1])}</h2>${s[2]}</section>`).join('') +
      `<div class="lesson-navigation"><a href="#home"><span>처음</span><strong>실습 목록으로</strong></a><a class="lesson-next" href="#s1"><span>다음</span><strong>1단계 · 채용공고를 요구역량표로</strong></a></div>`;
  }

  /* ---------- 단계 화면 ---------- */
  function renderStage(id) {
    const st = D.stages.find(s => s.id === id);
    const c = client();
    $('#bcStage').textContent = `${st.no}단계 ${st.title}`;
    $('#shEyebrow').textContent = `${st.kicker} · ${st.role}`;
    $('#shTitle').textContent = st.title;
    $('#shSum').textContent = st.goal.join(' ');
    $('#shMeta').innerHTML = `<span class="meta-chip active">${esc(st.time)}</span><span class="meta-chip">${esc(c.label)} · ${esc(c.who)}</span>`;
    const typeBar = `<div class="type-bar"><div><strong>내담자: ${esc(c.who)}</strong><div class="local-note mt2">${esc(c.summary)}</div></div>
      <div class="type-sw">${Object.entries(D.clients).map(([k, v]) => `<button type="button" data-type="${k}" class="${S.type === k ? 'on' : ''}">${esc(v.label)}</button>`).join('')}</div></div>`;
    const secs = [];
    secs.push(['goal', '학습 목표와 넣을 것', `<ul class="plain">${st.goal.map(g => `<li>${esc(g)}</li>`).join('')}</ul>${typeBar}
      <h3>이 단계에 넣는 것</h3><ul class="plain">${st.input.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      ${st.no === '1' ? fileRows(['01_채용공고_직업상담사']) : st.no === '2' ? fileRows([c.file, '04_자기진단_응답지']) : ''}
      <div class="safety-box mt16"><strong>이 유형에서 확인할 점</strong><p>${esc(c['focus' + st.no])}</p></div>`]);
    secs.push(['steps', '순서', `<ol class="plain">${st.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`]);
    secs.push(['prompt', '요청문 (복사해서 AI에 붙여 넣기)', `<div id="promptArea"></div>`]);
    secs.push(['sheet', ['요구역량표', '격차표', '취업지원 계획서'][Number(st.no) - 1], `<div id="sheetArea"></div>`]);
    secs.push(['check', '검수', `<div class="checklist">${st.checks.map((x, i) => `<label class="check-item"><input type="checkbox" data-k="${id}.${i}" ${S.checks[`${id}.${i}`] ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('')}</div>
      <h3>성찰 질문</h3><p>${esc(st.reflect)}</p>${st.extra ? `<div class="result-card mt14"><strong>참고</strong><p>${esc(st.extra)}</p></div>` : ''}`]);
    const prev = st.no === '1' ? ['#basics', '먼저 알기'] : [`#s${Number(st.no) - 1}`, `${Number(st.no) - 1}단계`];
    const next = st.no === '3' ? ['#review', '사례 검토와 적용'] : [`#s${Number(st.no) + 1}`, `${Number(st.no) + 1}단계 · ${D.stages[Number(st.no)].title}`];
    $('#stageToc').innerHTML = '<strong>목차</strong>' + secs.map(s => `<a href="#${id}-${s[0]}" class="${s[0] === 'sheet' ? 'toc-run' : ''}">${esc(s[1])}</a>`).join('');
    $('#stageBody').innerHTML = secs.map((s, i) => `<section id="${id}-${s[0]}"><span class="section-number">${i + 1}</span><h2>${esc(s[1])}</h2>${s[2]}</section>`).join('') +
      `<div class="lesson-navigation"><a href="${prev[0]}"><span>이전</span><strong>${esc(prev[1])}</strong></a><a class="lesson-next" href="${next[0]}"><span>다음</span><strong>${esc(next[1])}</strong></a></div>`;
    $('#stageBody').querySelectorAll('.type-sw button').forEach(b => b.addEventListener('click', () => { S.type = b.dataset.type; save(); renderStage(id); }));
    $('#stageBody').querySelectorAll('.check-item input').forEach(i => i.addEventListener('change', () => { S.checks[i.dataset.k] = i.checked; save(); }));
    ({ s1: renderS1, s2: renderS2, s3: renderS3 })[id]();
  }
  function fileRows(names) {
    return `<div class="file-list">${names.map(n => { const d = D.files.flatMap(g => g.items).find(x => x[0] === n); return `<div class="file-row"><div><strong>${esc(n)}</strong><span>${esc(d ? d[1] : '')}</span></div><div class="btn-pair"><a class="g-btn ghost" href="${FILE_BASE}${encodeURIComponent(n)}.pdf" download>PDF</a><a class="g-btn ghost" href="${FILE_BASE}${encodeURIComponent(n)}.docx" download>DOCX</a></div></div>`; }).join('')}</div>`;
  }
  function promptBox(text, label) {
    return `<div class="prompt-box tall"><span class="box-label">${esc(label || '요청문')}</span><button class="copy-button" type="button">요청문 복사</button><pre>${esc(text)}</pre></div>`;
  }
  function bindCopy(root) {
    root.querySelectorAll('.copy-button').forEach(b => b.addEventListener('click', () => copyText(b.parentElement.querySelector('pre').textContent, b)));
  }
  function pasteBox(label, btnText) {
    return `<div class="paste-box"><label>AI 표 붙여 넣기</label><textarea placeholder="AI가 만든 표 전체를 복사해 여기에 붙여 넣습니다. 세로줄(|)로 나뉜 표여야 합니다."></textarea>
      <div class="sheet-actions mt8"><button class="g-btn" type="button" data-act="import">${esc(btnText)}</button><button class="g-btn ghost" type="button" data-act="clear">표 비우기</button><button class="g-btn ghost" type="button" data-act="copy">${esc(label)} 복사</button><button class="g-btn ghost" type="button" data-act="print">인쇄</button></div><div class="g-msg" data-msg></div></div>`;
  }
  function tableToMd(headers, rows) {
    return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n` + rows.map(r => `| ${r.map(x => String(x || '').replace(/\|/g, '｜').replace(/\n/g, ' ')).join(' | ')} |`).join('\n');
  }

  /* 1단계 */
  function renderS1() {
    const c = client();
    $('#promptArea').innerHTML = formNote() + promptBox(D.prompts.s1.replace(/\{\{critname\}\}/g, isCustom() ? `우리 기관 평가 항목 ${S.form.items.length}개` : D.critName)
      .replace('{{complist}}', isCustom() ? S.form.items.map(x => `- ${x.name}${x.cue ? ': ' + x.cue : ''}`).join('\n') : D.compListText).replace('{{focus}}', c.focus1));
    bindCopy($('#promptArea'));
    drawS1();
  }
  function drawS1() {
    const area = $('#sheetArea');
    const H = ['구분', '공고 원문 문장', '요구 역량', '대응 하위능력', '필수/우대'];
    const opts = compNames().map(n => `<option>${esc(n)}</option>`).join('');
    area.innerHTML = pasteBox('요구역량표', '표로 옮기기') +
      `<div class="sheet-wrap"><div class="g-table"><table class="edit-table"><thead><tr><th>#</th>${H.map(h => `<th>${h}</th>`).join('')}<th></th></tr></thead><tbody>${S.req.map((r, i) => `<tr>
        <td class="ro num">${i + 1}</td>
        <td><select data-f="part"><option ${r.part === '담당업무' ? 'selected' : ''}>담당업무</option><option ${r.part === '자격요건' ? 'selected' : ''}>자격요건</option><option ${r.part === '우대사항' ? 'selected' : ''}>우대사항</option></select></td>
        <td class="w260"><textarea data-f="quote">${esc(r.quote)}</textarea></td>
        <td class="w160"><textarea data-f="need">${esc(r.need)}</textarea></td>
        <td class="w200"><select data-f="comp"><option value="">해당 없음(NCS 확인)</option>${opts}</select><select data-f="comp2" class="mt4"><option value="">(둘째 없음)</option>${opts}</select></td>
        <td><select data-f="must"><option ${r.must === '필수(업무)' ? 'selected' : ''}>필수(업무)</option><option ${r.must === '필수' ? 'selected' : ''}>필수</option><option ${r.must === '우대' ? 'selected' : ''}>우대</option></select></td>
        <td><button class="row-del" type="button" title="행 지우기">×</button></td></tr>`).join('')}</tbody></table></div>
      <div class="sheet-actions mt8"><button class="g-btn ghost" type="button" data-act="add">행 추가</button></div>
      ${S.req.length ? '' : '<div class="empty-note">아직 표가 비어 있습니다. AI 표를 위 칸에 붙여 넣고 [표로 옮기기]를 누르거나 [행 추가]로 직접 입력합니다.</div>'}</div>`;
    area.querySelectorAll('tbody tr').forEach((tr, i) => {
      const r = S.req[i];
      tr.querySelector('[data-f=comp]').value = r.comp[0] || '';
      tr.querySelector('[data-f=comp2]').value = r.comp[1] || '';
      tr.querySelectorAll('[data-f]').forEach(el => el.addEventListener('input', () => {
        const f = el.dataset.f;
        if (f === 'comp' || f === 'comp2') { r.comp = [tr.querySelector('[data-f=comp]').value, tr.querySelector('[data-f=comp2]').value].filter(Boolean); }
        else r[f] = el.value;
        save();
      }));
      tr.querySelector('.row-del').addEventListener('click', () => { S.req.splice(i, 1); save(); drawS1(); });
    });
    area.querySelector('[data-act=add]').addEventListener('click', () => { S.req.push({ part: '담당업무', quote: '', need: '', comp: [], must: '필수(업무)' }); save(); drawS1(); });
    bindSheetActions(area, {
      import(rows) {
        let n = 0;
        rows.forEach(r => {
          if (r.length < 4 || !r[1]) return;
          const part = /우대/.test(r[0]) ? '우대사항' : /자격/.test(r[0]) ? '자격요건' : '담당업무';
          const must = /우대/.test(r[4] || '') ? '우대' : /업무/.test(r[4] || '') || part === '담당업무' ? '필수(업무)' : '필수';
          S.req.push({ part, quote: r[1], need: r[2] || '', comp: splitComps(r[3]).slice(0, 2), must }); n++;
        });
        save(); drawS1(); return n;
      },
      clear() { S.req = []; save(); drawS1(); },
      md: () => tableToMd(H, S.req.map(r => [r.part, r.quote, r.need, r.comp.join(', ') || '해당 없음', r.must])),
    });
  }

  /* 2단계 */
  function targetComps() {
    const set = [];
    const names = compNames();
    S.req.forEach(r => r.comp.forEach(c => { if (names.includes(c) && !set.includes(c)) set.push(c); }));
    return set.length || !isCustom() ? set : names.slice();
  }
  function judgeOf(comp) {
    S.judge[S.type] = S.judge[S.type] || {};
    S.judge[S.type][comp] = S.judge[S.type][comp] || { j: '', q: '', note: '', ov: '' };
    return S.judge[S.type][comp];
  }
  function s2Prompt(list) {
    const c = client();
    const items = list.map(n => { const cc = crit().find(x => x.name === n); return `- ${n}: ${cc ? cc.cue : ''}`; }).join('\n');
    return D.prompts.s2.replace('{{focus}}', c.focus2).replace('{{list}}', items || '(1단계 요구역량표가 비어 있습니다. 먼저 1단계를 마칩니다.)');
  }
  function renderS2() {
    const list = targetComps();
    const area = $('#promptArea');
    const chunks = []; for (let i = 0; i < list.length; i += 4) chunks.push(list.slice(i, i + 4));
    area.innerHTML = (list.length ? '' : `<div class="empty-note">1단계 요구역량표에 대응 하위능력이 없어 판정 대상이 없습니다. <a href="#s1">1단계로 돌아가기</a></div>`) +
      promptBox(s2Prompt(list), `요청문 · 하위능력 ${list.length}개`) +
      (list.length > 4 ? `<details class="fold"><summary>3~4개씩 나누기 (${chunks.length}번에 나눠 보내기)</summary><div class="fold-b">${chunks.map((ch, i) => promptBox(s2Prompt(ch), `${i + 1}번째 요청문 · ${ch.join(', ')}`)).join('')}</div></details>` : '');
    bindCopy(area);
    drawS2(list);
  }
  function drawS2(list) {
    const area = $('#sheetArea');
    const c = client();
    const H = ['하위능력', '직무 요구', `자기진단(1~${scaleMax()})`, 'AI 판정', '근거 문장(원문 인용)', '격차 유형'];
    const need = comp => { const r = S.req.find(x => x.comp.includes(comp)); return r ? r.must : ''; };
    area.innerHTML = formNote() + pasteBox('격차표', '판정 옮기기') +
      `<div class="gap-legend"><span class="g0">충족</span><span class="g1">증거 부족 (자기진단 ${scaleCut()}점 이상, 서류 미흡)</span><span class="g2">과소평가 (자기진단 ${scaleCut()}점 미만, 서류 충족)</span><span class="g3">역량 부족 (둘 다 낮음)</span><span>구직 여건 제약 (직접 고름)</span></div>
      <div class="sheet-wrap"><div class="g-table"><table class="edit-table"><thead><tr>${H.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${list.map(n => {
        const j = judgeOf(n); const s = selfScore(n); const g = j.ov || gapType(j.j, s);
        return `<tr class="gap-${g.replace(/\s/g, '')}" data-comp="${esc(n)}"><td class="ro">${esc(n)}</td><td class="ro">${esc(need(n))}</td><td class="num"><input class="score-in" type="number" min="1" max="${scaleMax()}" step="1" value="${esc(s)}" data-score aria-label="${esc(n)} 자기진단 점수"></td>
          <td><select data-f="j"><option value="">—</option>${['충족', '부분', '미흡'].map(x => `<option ${j.j === x ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
          <td class="w260"><textarea data-f="q">${esc(j.q)}</textarea></td>
          <td class="gapcell"><select data-f="ov"><option value="">${esc(g || '—')} (자동)</option>${D.gapTypes.map(x => `<option value="${esc(x.id)}" ${j.ov === x.id ? 'selected' : ''}>${esc(x.id)}</option>`).join('')}</select></td></tr>`; }).join('')}</tbody></table></div>
      ${list.length ? '' : '<div class="empty-note">1단계 표의 대응 하위능력이 여기에 자동으로 들어옵니다.</div>'}</div>
      <h3>내담자에게 전할 문장 3개</h3><p class="local-note">판정("AI활용능력이 미흡합니다")이 아니라 다음 행동("업무에 AI를 쓴 경험 한 가지를 포트폴리오에 넣어 봅시다")으로 씁니다.</p>
      <div class="plan-text"><textarea data-note="s2msg" placeholder="1.&#10;2.&#10;3.">${esc((S.notes[S.type + '.s2msg']) || '')}</textarea></div>`;
    area.querySelectorAll('tbody tr').forEach(tr => {
      const n = tr.dataset.comp; const j = judgeOf(n);
      tr.querySelectorAll('[data-f]').forEach(el => el.addEventListener('input', () => { j[el.dataset.f] = el.value; save(); if (el.dataset.f !== 'q') drawS2(list); }));
      tr.querySelector('[data-score]').addEventListener('change', e => { const k = selfKey(); S.self[k] = S.self[k] || {}; S.self[k][n] = e.target.value; save(); drawS2(list); });
    });
    area.querySelector('[data-note]').addEventListener('input', e => { S.notes[S.type + '.s2msg'] = e.target.value; save(); });
    bindSheetActions(area, {
      import(rows) {
        let n = 0;
        rows.forEach(r => {
          const comp = normComp(r[0]); if (!comp || !list.includes(comp)) return;
          const j = judgeOf(comp);
          j.j = /충족/.test(r[1] || '') ? '충족' : /부분/.test(r[1] || '') ? '부분' : /미흡/.test(r[1] || '') ? '미흡' : j.j;
          j.q = (r[2] || '').replace(/^["“]|["”]$/g, '');
          if (r[3]) j.note = r[3];
          n++;
        });
        save(); drawS2(list); return n;
      },
      clear() { S.judge[S.type] = {}; S.self[selfKey()] = {}; S.notes[S.type + '.s2msg'] = ''; save(); drawS2(list); },
      md: () => tableToMd(H, list.map(n => { const j = judgeOf(n); return [n, need(n), selfScore(n), j.j, j.q, j.ov || gapType(j.j, selfScore(n))]; })) + '\n\n내담자에게 전할 문장:\n' + (S.notes[S.type + '.s2msg'] || ''),
    });
  }

  /* 3단계 */
  function gapRows() {
    const c = client();
    return targetComps().map(n => { const j = judgeOf(n); return { comp: n, gap: j.ov || gapType(j.j, selfScore(n)) }; }).filter(x => x.gap && x.gap !== '충족');
  }
  function planOf() {
    S.plan[S.type] = S.plan[S.type] || { rows: [], msg: '' };
    const p = S.plan[S.type];
    const gaps = gapRows();
    gaps.forEach(g => { if (!p.rows.some(r => r.item === g.comp)) p.rows.push({ item: g.comp, gap: g.gap, strategy: '', support: '', goal: '', date: '' }); });
    p.rows.forEach(r => { const g = gaps.find(x => x.comp === r.item); if (g) r.gap = g.gap; });
    return p;
  }
  function renderS3() {
    const c = client();
    const gaps = gapRows();
    const gapsText = gaps.length ? tableToMd(['격차 항목', '유형', '자기진단', 'AI 판정', '근거 문장'], gaps.map(g => { const j = judgeOf(g.comp); return [g.comp, g.gap, selfScore(g.comp), j.j, j.q]; })) : '(2단계 격차표가 비어 있습니다. 먼저 2단계를 마칩니다.)';
    $('#promptArea').innerHTML = (gaps.length ? '' : `<div class="empty-note">2단계 격차표에 충족을 뺀 항목이 없습니다. <a href="#s2">2단계로 돌아가기</a></div>`) +
      promptBox(D.prompts.s3.replace('{{type}}', `${c.label} · ${c.summary}`).replace('{{gaps}}', gapsText).replace('{{focus}}', c.focus3));
    bindCopy($('#promptArea'));
    drawS3();
  }
  function drawS3() {
    const area = $('#sheetArea');
    const p = planOf();
    const H = ['격차 항목', '유형', '전략', '지원 제도(공식 주소, 확인일)', '이번 달 목표', '점검일'];
    const sups = D.supports.filter(s => s.for.includes(S.type));
    area.innerHTML = pasteBox('계획서', '계획 옮기기') +
      `<div class="sheet-wrap"><div class="g-table"><table class="edit-table"><thead><tr>${H.map(h => `<th>${h}</th>`).join('')}<th></th></tr></thead><tbody>${p.rows.map((r, i) => `<tr class="gap-${(r.gap || '').replace(/\s/g, '')}">
        <td class="ro">${esc(r.item)}</td><td class="gapcell"><select data-f="gap">${D.gapTypes.map(x => `<option ${r.gap === x.id ? 'selected' : ''}>${esc(x.id)}</option>`).join('')}</select></td>
        <td class="w200"><textarea data-f="strategy">${esc(r.strategy)}</textarea></td>
        <td class="w220"><textarea data-f="support" placeholder="제도 이름 / 공식 주소 / 확인일">${esc(r.support)}</textarea></td>
        <td class="w180"><textarea data-f="goal">${esc(r.goal)}</textarea></td>
        <td><input type="date" data-f="date" value="${esc(r.date)}"></td>
        <td><button class="row-del" type="button" title="행 지우기">×</button></td></tr>`).join('')}</tbody></table></div>
      <div class="sheet-actions mt8"><button class="g-btn ghost" type="button" data-act="add">행 추가 (구직 여건 제약 등)</button><button class="g-btn ghost" type="button" data-act="date2w">점검일 비면 2주 뒤로</button></div>
      ${p.rows.length ? '' : '<div class="empty-note">2단계 격차표에서 충족을 뺀 항목이 여기에 자동으로 들어옵니다.</div>'}</div>
      <h3>지원 제도 공식 확인</h3><p class="local-note">AI가 제안한 제도 이름을 아래 공식 사이트에서 찾아 요건을 확인하고, 표의 지원 제도 칸에 주소와 오늘 날짜(${today()})를 적습니다.</p>
      <div class="sup-list">${sups.map(s => `<div class="sup-row"><div><strong>${esc(s.name)}</strong><span>${esc(s.note)}</span></div>${s.url ? `<a class="g-btn ghost" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.site)} 열기</a>` : ''}</div>`).join('')}</div>
      <h3>내담자에게 전할 문장 3개</h3><div class="plan-text"><textarea data-note="msg" placeholder="1.&#10;2.&#10;3.">${esc(p.msg || '')}</textarea></div>`;
    area.querySelectorAll('tbody tr').forEach((tr, i) => {
      const r = p.rows[i];
      tr.querySelectorAll('[data-f]').forEach(el => el.addEventListener('input', () => { r[el.dataset.f] = el.value; save(); if (el.dataset.f === 'gap') tr.className = 'gap-' + el.value.replace(/\s/g, ''); }));
      tr.querySelector('.row-del').addEventListener('click', () => { p.rows.splice(i, 1); save(); drawS3(); });
    });
    area.querySelector('[data-act=add]').addEventListener('click', () => { p.rows.push({ item: '', gap: '구직 여건 제약', strategy: '', support: '', goal: '', date: '' }); save(); drawS3(); });
    area.querySelector('[data-act=date2w]').addEventListener('click', () => { p.rows.forEach(r => { if (!r.date) r.date = addDays(14); }); save(); drawS3(); });
    area.querySelector('[data-note]').addEventListener('input', e => { p.msg = e.target.value; save(); });
    bindSheetActions(area, {
      import(rows) {
        let n = 0;
        rows.forEach(r => {
          if (r.length < 3) return;
          const comp = normComp(r[0]);
          let row = p.rows.find(x => x.item === comp || x.item === r[0]);
          if (!row) { row = { item: comp || r[0], gap: D.gapTypes.find(g => (r[1] || '').includes(g.id))?.id || '증거 부족', strategy: '', support: '', goal: '', date: '' }; p.rows.push(row); }
          row.strategy = r[2] || row.strategy;
          if (r[3]) row.support = r[3];
          if (r[4]) row.goal = r[4];
          if (r[5] && /\d{4}-\d{2}-\d{2}/.test(r[5])) row.date = r[5].match(/\d{4}-\d{2}-\d{2}/)[0];
          n++;
        });
        save(); drawS3(); return n;
      },
      clear() { S.plan[S.type] = { rows: [], msg: '' }; save(); drawS3(); },
      md: () => `# 취업지원 계획서 · ${client().label} · ${client().who}\n\n` + tableToMd(H, p.rows.map(r => [r.item, r.gap, r.strategy, r.support, r.goal, r.date])) + '\n\n내담자에게 전할 문장:\n' + (p.msg || ''),
    });
  }

  function bindSheetActions(area, h) {
    const ta = area.querySelector('.paste-box textarea');
    const msg = area.querySelector('[data-msg]');
    const say = (t, bad) => { const m = area.querySelector('[data-msg]') || msg; m.textContent = t; m.classList.toggle('bad', !!bad); };
    area.querySelector('[data-act=import]').addEventListener('click', () => {
      const rows = parseMdTable(ta.value);
      if (!rows.length) return say('세로줄(|)로 나뉜 표를 찾지 못했습니다. AI에게 "마크다운 표 하나로만 다시 출력해 줘"라고 요청합니다.', true);
      const n = h.import(rows);
      say(n ? `${n}행을 옮겼습니다. 원문과 한 줄씩 대조해 고칩니다.` : '옮길 수 있는 행이 없습니다. 머리글 열 순서가 요청문과 같은지 확인합니다.', !n);
    });
    area.querySelector('[data-act=clear]').addEventListener('click', () => { if (confirm('이 표를 비울까요? 이 기기에 저장된 내용만 지워집니다.')) h.clear(); });
    area.querySelector('[data-act=copy]').addEventListener('click', e => copyText(h.md(), e.currentTarget));
    area.querySelector('[data-act=print]').addEventListener('click', () => window.print());
  }

  /* ---------- 검토·적용 ---------- */
  function renderReview() {
    const c = client();
    $('#bcStage').textContent = '사례 검토와 적용';
    $('#shEyebrow').textContent = `REVIEW · ${D.review.time}`;
    $('#shTitle').textContent = '사례 검토와 적용';
    $('#shSum').textContent = '2인 1조로 검토 기록을 쓰고 공유합니다. AI 활용과 사례 검토의 효과는 검증된 것이 아니므로 "효과가 있다"고 단정하지 않고, 달랐던 지점과 그 이유를 남기는 데 집중합니다.';
    $('#shMeta').innerHTML = `<span class="meta-chip active">${esc(c.label)}</span>`;
    const secs = [
      ['q', '검토 질문', `<ol class="plain">${D.review.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ol><div class="plan-text"><textarea data-note="review" placeholder="검토 기록">${esc(S.notes.review || '')}</textarea></div>`],
      ['a', '내 상담 절차에 넣을 한 가지', `<p>${esc(D.review.apply)}</p><div class="plan-text"><textarea data-note="apply" placeholder="언제 / 무엇을 / 어떻게">${esc(S.notes.apply || '')}</textarea></div>
        <div class="sheet-actions mt8"><button class="g-btn ghost" type="button" id="copyReview">검토 기록과 적용 계획 복사</button></div>`],
      ['s', '실습 결과 전체 복사', `<p>세 단계 표와 전달 문장을 마크다운으로 묶습니다. 기관 문서나 메모 프로그램에 붙여 넣어 보관합니다.</p><div class="sheet-actions"><button class="g-btn" type="button" id="copyAll">전체 결과 복사 (${esc(c.label)})</button></div><div class="g-msg" id="allMsg"></div>`],
    ];
    $('#stageToc').innerHTML = '<strong>목차</strong>' + secs.map(s => `<a href="#review-${s[0]}">${esc(s[1])}</a>`).join('');
    $('#stageBody').innerHTML = secs.map((s, i) => `<section id="review-${s[0]}"><span class="section-number">${i + 1}</span><h2>${esc(s[1])}</h2>${s[2]}</section>`).join('') +
      `<div class="lesson-navigation"><a href="#s3"><span>이전</span><strong>3단계 · 취업지원 계획서</strong></a><a class="lesson-next" href="#home"><span>처음</span><strong>실습 목록으로</strong></a></div>`;
    $('#stageBody').querySelectorAll('[data-note]').forEach(t => t.addEventListener('input', () => { S.notes[t.dataset.note] = t.value; save(); }));
    $('#copyReview').addEventListener('click', e => copyText(`검토 기록:\n${S.notes.review || ''}\n\n적용 계획:\n${S.notes.apply || ''}`, e.currentTarget));
    $('#copyAll').addEventListener('click', e => {
      const p = planOf();
      const list = targetComps();
      const md = `# AI 취업지원 실습 결과 · ${c.label} · ${c.who} · ${today()}\n\n## 1단계 요구역량표\n` +
        tableToMd(['구분', '공고 원문 문장', '요구 역량', '대응 하위능력', '필수/우대'], S.req.map(r => [r.part, r.quote, r.need, r.comp.join(', ') || '해당 없음', r.must])) +
        `\n\n## 2단계 격차표\n` + tableToMd(['하위능력', '자기진단', 'AI 판정', '근거 문장', '격차 유형'], list.map(n => { const j = judgeOf(n); return [n, selfScore(n), j.j, j.q, j.ov || gapType(j.j, selfScore(n))]; })) +
        `\n\n내담자에게 전할 문장:\n${S.notes[S.type + '.s2msg'] || ''}\n\n## 3단계 취업지원 계획서\n` +
        tableToMd(['격차 항목', '유형', '전략', '지원 제도', '이번 달 목표', '점검일'], p.rows.map(r => [r.item, r.gap, r.strategy, r.support, r.goal, r.date])) +
        `\n\n내담자에게 전할 문장:\n${p.msg || ''}\n\n## 검토 기록\n${S.notes.review || ''}\n\n## 적용 계획\n${S.notes.apply || ''}\n`;
      copyText(md, e.currentTarget);
    });
  }



  /* ---------- 자기진단 양식 설정 ---------- */
  function formNote() {
    return `<div class="form-note">${isCustom() ? `<b>우리 기관 양식 사용 중</b> · 평가 항목 ${S.form.items.length}개, ${scaleMax()}점 척도(${scaleCut()}점 이상을 높음으로 봄)` : '<b>기본 양식</b> · 직업공통능력 21개 하위능력, 4점 척도'} · <a href="#form">양식 바꾸기</a></div>`;
  }
  function parseFormText(text) {
    const items = [];
    text.split(/\r?\n/).forEach(ln => {
      const t = ln.trim(); if (!t) return;
      let cells = t.startsWith('|') ? t.replace(/^\|/, '').replace(/\|$/, '').split('|') : t.split(/\t|\s*\|\s*/);
      cells = cells.map(c => c.trim());
      if (cells.every(c => /^:?-{2,}:?$/.test(c) || !c)) return;
      const name = cells[0].replace(/^\d+[.)]\s*/, '').replace(/^[-•·]\s*/, '');
      if (!name || /^(항목|평가 ?항목|영역|구분|문항)$/.test(name)) return;
      if (!items.some(x => x.name === name)) items.push({ name, cue: cells.slice(1).filter(Boolean).join(' ') });
    });
    return items;
  }
  function renderForm() {
    $('#bcStage').textContent = '자기진단 양식 바꾸기';
    $('#shEyebrow').textContent = 'SETTING · 교육 뒤 기관에서 쓸 때';
    $('#shTitle').textContent = '자기진단 양식 바꾸기';
    $('#shSum').textContent = '기본 양식은 직업공통능력 21개 하위능력과 4점 척도입니다. 기관에서 쓰는 평가 양식이 있으면 그 항목과 척도로 바꿔 쓸 수 있습니다. 바꾼 양식은 1단계의 대응 항목, 2단계의 자기진단과 AI 판정 항목에 함께 적용됩니다.';
    $('#shMeta').innerHTML = `<span class="meta-chip active">${isCustom() ? '우리 기관 양식 사용 중' : '기본 양식 사용 중'}</span>`;
    const f = S.form;
    const sample = '의사소통 | 내담자·기업과 말과 글로 소통한 경험\n직무 이해 | 지원 직무의 업무와 요건을 설명할 수 있음\n구직 기술 | 이력서·자기소개서·면접 준비 수준\n디지털 활용 | 문서·전산·AI 도구로 업무를 처리한 경험\n구직 의지 | 구직 활동 계획과 실행 정도';
    const secs = [
      ['how', '쓰는 방법', `<ol class="plain"><li>기관 평가 양식의 항목을 아래 칸에 한 줄에 하나씩 적습니다. 엑셀이나 한글 표에서 항목과 설명 두 열을 복사해 붙여 넣어도 됩니다.</li>
        <li>항목 뒤에 세로줄(|)을 넣고 설명을 적으면 AI 판정의 단서로 쓰입니다. 설명은 없어도 됩니다.</li>
        <li>척도의 최고점과, 몇 점부터 "높음"으로 볼지를 정합니다. 격차 유형 계산에 쓰입니다.</li>
        <li>[이 양식 적용]을 누릅니다. 실습 전에 먼저 설정합니다. 중간에 바꾸면 1단계 표의 대응 항목을 다시 골라야 합니다.</li></ol>
        <div class="result-card mt14"><strong>점수는 어디에 넣나</strong><p>2단계 격차표의 자기진단 칸에 내담자가 응답한 점수를 직접 입력합니다. 기본 양식에서도 이 칸은 고칠 수 있습니다.</p></div>`],
      ['set', '양식 설정', `<div class="paste-box"><label>평가 항목 (한 줄에 하나 · 항목 | 설명)</label><textarea id="formText" placeholder="${esc(sample)}">${esc(f.text || '')}</textarea></div>
        <div class="form-scale"><label>척도 최고점 <input type="number" id="formMax" min="2" max="100" value="${esc(f.max || 4)}"></label>
        <label>이 점수 이상을 높음으로 봄 <input type="number" id="formCut" min="1" max="100" value="${esc(f.cut || 3)}"></label></div>
        <div class="sheet-actions mt8"><button class="g-btn" type="button" id="formApply">이 양식 적용</button><button class="g-btn ghost" type="button" id="formSample">예시 넣기</button><button class="g-btn ghost" type="button" id="formReset">기본 양식으로 되돌리기</button></div>
        <div class="g-msg" id="formMsg"></div>
        <h3>지금 적용된 항목</h3><div class="g-table"><table><thead><tr><th>#</th><th>항목</th><th>설명(판정 단서)</th></tr></thead><tbody>${crit().map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.name)}</td><td>${esc(x.cue || '')}</td></tr>`).join('')}</tbody></table></div>`],
      ['note', '유의할 점', `<ul class="plain"><li>이 화면의 설정은 이 기기 브라우저에만 저장됩니다. 동료와 같은 양식을 쓰려면 평가 항목 칸의 글을 복사해 전달합니다.</li>
        <li>격차 유형(충족, 증거 부족, 과소평가, 역량 부족) 계산은 커리어캐쳐의 제안이며 표준화 검사가 아닙니다. 기관 양식의 해석 기준이 따로 있으면 그 기준을 우선합니다.</li>
        <li>모든 수강생의 기본 양식 자체를 바꾸려면 저장소의 <code>job-ai-lab/tools/build.py</code>에서 <code>COMPETENCIES</code>를 고친 뒤 다시 배포합니다.</li></ul>`],
    ];
    $('#stageToc').innerHTML = '<strong>목차</strong>' + secs.map(s => `<a href="#form-${s[0]}">${esc(s[1])}</a>`).join('');
    $('#stageBody').innerHTML = secs.map((s, i) => `<section id="form-${s[0]}"><span class="section-number">${i + 1}</span><h2>${esc(s[1])}</h2>${s[2]}</section>`).join('') +
      `<div class="lesson-navigation"><a href="#home"><span>처음</span><strong>실습 목록으로</strong></a><a class="lesson-next" href="#s1"><span>다음</span><strong>1단계 · 채용공고를 요구역량표로</strong></a></div>`;
    const say = (t, bad) => { const m = $('#formMsg'); m.textContent = t; m.classList.toggle('bad', !!bad); };
    $('#formSample').addEventListener('click', () => { $('#formText').value = sample; $('#formMax').value = 5; $('#formCut').value = 4; });
    $('#formApply').addEventListener('click', () => {
      const text = $('#formText').value; const items = parseFormText(text);
      const max = Math.round(Number($('#formMax').value)); const cut = Math.round(Number($('#formCut').value));
      if (!items.length) return say('평가 항목을 한 줄에 하나씩 적습니다.', true);
      if (!(max >= 2 && max <= 100) || !(cut >= 1 && cut <= max)) return say('척도 최고점은 2~100, 높음 기준은 1부터 최고점 사이의 숫자로 적습니다.', true);
      S.form = { mode: 'custom', items, max, cut, text };
      const names = items.map(x => x.name); let dropped = 0;
      S.req.forEach(r => { const n = r.comp.length; r.comp = r.comp.filter(c => names.includes(c)); dropped += n - r.comp.length; });
      save(); renderForm();
      say(`항목 ${items.length}개, ${max}점 척도를 적용했습니다.` + (dropped ? ` 1단계 표에서 새 양식에 없는 대응 항목 ${dropped}개를 비웠습니다.` : ''));
    });
    $('#formReset').addEventListener('click', () => {
      if (!confirm('기본 양식(직업공통능력 21개, 4점 척도)으로 되돌릴까요? 적어 둔 항목 글은 그대로 남습니다.')) return;
      S.form.mode = 'default'; const names = D.competencies.map(c => c.name);
      S.req.forEach(r => { r.comp = r.comp.filter(c => names.includes(c)); });
      save(); renderForm(); say('기본 양식으로 되돌렸습니다.');
    });
  }

  /* ---------- START 장표 ---------- */
  const ST = D.start;
  const srcLine = (t, u) => `<p class="src">출처: ${esc(t)}${u ? ` · <a href="${esc(u)}" target="_blank" rel="noopener noreferrer">원문 보기</a>` : ''}</p>`;
  const HL = ['AI 네이티브', '오케스트라 인재', '커리어 민첩성', '롱제비티'];
  const SLIDES = [
    { g: 0, nav: '시작', title: '세 가지 키워드', html: () => `<span class="slide-kicker">START · AI 활용 취업지원 실무</span><h1>변화, 트렌드, 역할</h1>
      <p class="slide-lead">실습 전에 세 가지 키워드로 배경을 살펴봅니다. 채용시장에서 달라진 점, 2027년 채용 트렌드, 취업지원 실무자의 역할 순서입니다.</p>
      <div class="kw3"><a href="#start-1"><b>KEYWORD 1</b><strong>변화</strong><span>구직자가 맞이하는 변화, 고용서비스업 종사자가 맞이하는 변화</span></a>
      <a href="#start-3"><b>KEYWORD 2</b><strong>트렌드</strong><span>2027년 채용 트렌드 10가지, 2026년과 달라진 네 가지</span></a>
      <a href="#start-5"><b>KEYWORD 3</b><strong>역할</strong><span>사례로 보는 구직자의 마음, 우리의 역할 3S</span></a></div>` },
    { g: 1, nav: '1-1', title: '구직자가 맞이하는 변화', html: () => `<span class="slide-kicker">1. 변화 · 1) 구직자</span><h1>구직자가 맞이하는 변화</h1>
      <div class="stat3">${ST.seeker.map(x => `<div class="stat"><em>${esc(x.tag)}</em><strong>${esc(x.num)}</strong><div class="cap">${esc(x.cap)}</div><p>${esc(x.more)}</p>${srcLine(x.src, x.url)}</div>`).join('')}</div>
      <div class="note">${esc(ST.seeker_note)}</div>` },
    { g: 1, nav: '1-2', title: '고용서비스업 종사자가 맞이하는 변화', html: () => `<span class="slide-kicker">1. 변화 · 2) 고용서비스업 종사자</span><h1>종사자가 맞이하는 변화</h1>
      <div class="pts">${ST.worker.map((x, i) => `<div class="pt"><b>0${i + 1}</b><strong>${esc(x.h)}</strong><p>${esc(x.p)}</p>${srcLine(x.src)}</div>`).join('')}</div>` },
    { g: 2, nav: '2-1', title: '2027년 채용 트렌드', html: () => `<span class="slide-kicker">2. 트렌드 · 3) 2027년 채용 트렌드</span><h1>2027년 채용 트렌드 10가지</h1>
      <p class="slide-lead">키워드를 누르면 설명이 펼쳐집니다. 파란 테두리 네 개는 다음 장에서 2026년과 비교합니다.</p>
      <div class="t10">${ST.trend27.map((k, i) => `<details class="${HL.includes(k[0]) ? 'hl' : ''}"><summary><b>${String(i + 1).padStart(2, '0')}</b><strong>${esc(k[0])}</strong><span>${esc(k[1])}</span></summary><p>${esc(k[2])}</p></details>`).join('')}</div>
      ${srcLine(ST.trend27_src, ST.trend27_url)}` },
    { g: 2, nav: '2-2', title: '2026년과 달라진 점', html: () => `<span class="slide-kicker">2. 트렌드 · 4) 2026년과 달라진 점</span><h1>2026년과 달라진 점</h1>
      <p class="slide-lead">2027년 키워드 가운데 네 가지를 2026년 키워드와 나란히 놓았습니다.</p>
      <div class="shift">${ST.shift.map(r => `<div class="shift-row"><div class="y26"><small>2026</small>${esc(r[0])}</div><div class="arr">→</div><div class="y27"><small>2027</small>${esc(r[1])}</div><p>${esc(r[2])}<i>${esc(r[3])}</i></p></div>`).join('')}</div>
      <div class="chips26">${ST.trend26.map(k => `<span>2026 · ${esc(k)}</span>`).join('')}</div>
      ${srcLine(ST.trend26_src, ST.trend26_url)}<p class="src">${esc(ST.shift_note)}</p>` },
    ...ST.cases.map((cs, i) => ({ g: 3, nav: `3-1${i ? 'b' : 'a'}`, title: `${cs.no} · 구직자의 마음`, html: () => `<span class="slide-kicker">3. 역할 · 1) 사례로 알아보는 구직자의 마음 · ${esc(cs.no)}</span><h1>${esc(cs.title)}</h1>
      <div class="case"><div class="case-what"><b>현장에서 자주 보는 장면</b><p>${esc(cs.what)}</p></div>
      <div class="bubbles"><b>구직자의 마음</b>${cs.mind.map(m => `<div class="bubble">${esc(m)}</div>`).join('')}</div></div>
      <div class="note">${esc(cs.lack)}</div><p class="src">${esc(ST.cases_note)}</p>` })),
    { g: 3, nav: '3-2', title: '우리의 역할 3S', html: () => `<span class="slide-kicker">3. 역할 · 2) 그렇다면 우리의 역할은?</span><h1>3S: Simple, Specific, Skill</h1>
      <div class="s3">${ST.s3.map(x => `<a href="${esc(x.href)}"><strong><i>S</i>${esc(x.k.slice(1))}</strong><em>${esc(x.ko)}</em><p>${esc(x.p)}</p><span>${esc(x.do)} →</span></a>`).join('')}</div>
      <p class="src">${esc(ST.s3_note)}</p>` },
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
    $('#deckNext').textContent = deckIdx === SLIDES.length - 1 ? '먼저 알기로 →' : '다음 →';
  }
  $('#deckPrev').addEventListener('click', () => { if (deckIdx > 0) location.hash = '#start-' + (deckIdx - 1); });
  $('#deckNext').addEventListener('click', () => { location.hash = deckIdx === SLIDES.length - 1 ? '#basics' : '#start-' + (deckIdx + 1); });
  document.addEventListener('keydown', e => {
    if ($('#viewStart').hidden || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' && deckIdx < SLIDES.length - 1) location.hash = '#start-' + (deckIdx + 1);
    if (e.key === 'ArrowLeft' && deckIdx > 0) location.hash = '#start-' + (deckIdx - 1);
  });

  /* ---------- 바로가기 ---------- */
  function renderQuick() {
    const groups = [
      ['START · 세 가지 키워드', SLIDES.map((s, i) => ['#start-' + i, s.nav, s.title])],
      ['먼저 알기', [['#basics-b1', '기준 1', '변화 3가지와 역할 3가지'], ['#basics-b2', '기준 2', '채용 트렌드 키워드가 들어가는 자리'], ['#basics-b3', '기준 3', '직업공통능력 21개 하위능력'], ['#basics-b4', '기준 4', '격차 유형 네 가지와 처방'], ['#basics-b5', '기준 5', 'AI에 맡기는 일과 맡기지 않는 일']]],
      ['실습', [...D.stages.map(s => ['#' + s.id, s.no + '단계', s.title]), ['#review', '검토', '사례 검토와 적용']]],
      ['자료와 안내', [['#timeline', '시간표', '시간표 (14:00~17:00)'], ['#downloads', '자료', '자료 파일 받기'], ['#after', '교육 뒤', '내 AI에 등록하기'], ['#form', '양식', '자기진단 양식 바꾸기'], ['#privacy', '유의', '실제 내담자 서류를 다룰 때'], ['#help', '도움', '막힐 때'], ['#sources', '출처', '참고 자료']]],
    ];
    $('#quickPanel').innerHTML = groups.map(g => `<div class="menu-group"><strong>${esc(g[0])}</strong>${g[1].map(x => `<a href="${x[0]}"><span>${esc(x[1])}</span>${esc(x[2])}</a>`).join('')}</div>`).join('');
    $('#quickPanel').addEventListener('click', e => { if (e.target.closest('a')) $('#quickMenu').open = false; });
    document.addEventListener('click', e => { if (!e.target.closest('#quickMenu')) $('#quickMenu').open = false; });
  }

  /* ---------- 라우팅 ---------- */
  const HOME_SECS = ['timeline', 'downloads', 'after', 'privacy', 'help', 'sources'];
  function route() {
    const h = (location.hash || '#home').replace('#', '');
    const [view, sub] = h.split('-');
    ['#viewHome', '#viewStart', '#viewBasics', '#viewStage'].forEach(v => { $(v).hidden = true; });
    let target = null;
    $('#quickMenu').open = false;
    if (view === 'start') { $('#viewStart').hidden = false; renderStart(Number(sub) || 0); }
    else if (view === 'basics') { $('#viewBasics').hidden = false; renderBasics(); }
    else if (/^s[123]$/.test(view)) { $('#viewStage').hidden = false; renderStage(view); }
    else if (view === 'review') { $('#viewStage').hidden = false; renderReview(); }
    else if (view === 'form') { $('#viewStage').hidden = false; renderForm(); }
    else { $('#viewHome').hidden = false; renderTypePick(); renderHomeStages(); if (HOME_SECS.includes(view)) target = document.getElementById('sec-' + view); }
    if (sub && view !== 'start') target = document.getElementById(h);
    requestAnimationFrame(() => { if (target) target.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); });
  }

  renderTimeline();
  renderDownloads();
  renderQuick();
  window.addEventListener('hashchange', route);
  route();
})();
