/* 카드뉴스 자동화 실습실 — 화면 전환, START 장표, 3단계 실습, 메모·검수 표시.
   입력한 내용은 어디에도 보내지 않으며 이 기기의 localStorage에만 저장한다. */
(function () {
  'use strict';
  const D = window.LAB;
  const $ = (s, el) => (el || document).querySelector(s);
  const KEY = 'cardnewsLab.v1';

  let S;
  try { S = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { S = {}; }
  S.checks = S.checks || {};
  S.notes = S.notes || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 불가 시 무시 */ } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ul = a => `<ul class="plain">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;

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
  function promptBox(text, label) {
    return `<div class="prompt-box tall"><span class="box-label">${esc(label || '요청문')}</span><button class="copy-button" type="button">복사</button><pre>${esc(text)}</pre></div>`;
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
  function table(head, rows, raw) {
    return `<div class="g-table"><table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${raw ? c : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
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
    ['Google Sheets', '기획 입력', '타깃·주제·장수를 한 줄에 (B~I열)'],
    ['Gemini API', '원고 자동 생성', '표지 훅, 1~6장, 이미지 프롬프트 (J~Q열)'],
    ['사람', '검토와 수정', '사실·과장·길이를 직접 확인'],
    ['ChatGPT 프로젝트', '디자인 초안', '게시 문구, 이미지 구성, Canva 디자인'],
    ['Google Sheets', '기록·관리', '결과 링크, 상태, 게시 후 성과']
  ];
  function renderHome() {
    $('#homeFlow').innerHTML = FLOW.map((f, i) => `<li><b>${i + 1}</b><div><strong>${esc(f[1])}</strong><span>${esc(f[0])} · ${esc(f[2])}</span></div></li>`).join('');
    $('#homeStages').innerHTML = `<section class="level-section">
      <div class="level-head"><div><span class="level-kicker">PRACTICE</span><h2>실습 3단계와 마무리</h2></div>
      <p>한 편의 카드뉴스가 시트 한 줄에서 출발해 원고, 디자인, 기록까지 이어집니다. 각 단계 끝의 검수 항목을 모두 확인하면 완료로 셉니다.</p></div>
      <div class="lesson-grid">${D.stages.map(s => `<a class="lesson-card ${stageDone(s.id) ? 'is-done' : ''}" href="#${s.id}">
        <span class="lesson-code">${esc(s.kicker)} · ${esc(s.time)}</span><h3>${esc(s.title)}</h3><p>${esc(s.goal[0])}</p>
        <div class="lesson-output">산출물 <span>${esc(s.output)}</span></div><div class="lesson-arrow">${esc(s.role)} →</div></a>`).join('')}
      <a class="lesson-card ${stageDone('review') ? 'is-done' : ''}" href="#review"><span class="lesson-code">WRAP-UP · ${esc(D.review.time)}</span><h3>기록하고 돌아보기</h3><p>결과 링크와 상태를 시트에 기록하고, 오늘 AI와 사람이 한 일을 나눠 봅니다.</p><div class="lesson-output">산출물 <span>카드뉴스 1편과 링크</span></div><div class="lesson-arrow">마무리 →</div></a>
      </div></section>`;
    renderProgress();
  }
  function renderStatic() {
    $('#copyLink').href = D.sheetCopy;
    $('#copyLinkTop').href = D.sheetCopy;
    $('#timelineTable').innerHTML = '<thead><tr><th>시간</th><th>구분</th><th>단계</th><th>내용</th><th>산출물</th></tr></thead><tbody>' +
      D.timeline.map(r => `<tr${r[1] === '휴식' ? ' class="cn-break"' : ''}>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') + '</tbody>';
    $('#materialBox').innerHTML = [['guide', 'ChatGPT 프로젝트 지침'], ['request', '카드뉴스 제작 요청문 (주소와 ID만 바꿔 사용)'], ['cover', '표지 이미지 요청문'], ['fix', '디자인 수정 요청문']]
      .map(([k, l]) => promptBox(D.texts[k], l)).join('');
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
    let goal = `<ul class="plain">${st.goal.map(g => `<li>${esc(g)}</li>`).join('')}</ul><h3>이 단계에 필요한 것</h3>${ul(st.input.map(esc))}`;
    if (id === 's1') goal += `<div class="go-studio mt16"><p><b>운영 시트 사본 만들기</b> — 내 드라이브에 복사됩니다.</p><a class="g-btn" href="${esc(D.sheetCopy)}" target="_blank" rel="noopener noreferrer">시트 사본 만들기</a></div>`;
    if (st.warn) goal += `<div class="safety-box mt16"><strong>API 키는 비밀번호처럼</strong><p>${esc(st.warn)}</p></div>`;
    secs.push(['goal', '학습 목표와 준비', goal]);
    let steps = `<ol class="plain">${st.steps.map(x => `<li>${x}</li>`).join('')}</ol>`;
    if (id === 's1') steps += `<h3>카드뉴스 관리 탭 열 지도</h3>${table(['열', '이름', '누가 채우나요', '메모'], D.columns)}<h3>입력 예시</h3>${table(['열', '입력'], st.example)}`;
    if (id === 's3') steps += `<div class="result-card mt14"><strong>요청문 주소 바꾸는 법</strong><p>주소의 <code>/d/</code>와 <code>/edit</code> 사이 긴 문자열이 시트 고유번호입니다. 원본 번호 <code>${esc(D.sheetId)}</code> 자리에 내 사본 주소창의 번호를 넣습니다.</p></div>`;
    secs.push(['steps', '순서', steps]);
    if (st.prompt) secs.push(['prompt', '요청문 (복사해서 붙여 넣기)', promptBox(st.prompt.text, st.prompt.label)]);
    if (st.prompts) secs.push(['prompt', '요청문 (복사해서 붙여 넣기)', st.prompts.map(p => promptBox(D.texts[p.key], p.label)).join('')]);
    secs.push(['note', '내 기록', st.fields.map(f => noteBox(`${id}.${f[0]}`, f[1], f[2])).join('') + '<p class="local-note">이 칸은 이 기기 브라우저에만 저장됩니다. 실제 기록은 내 시트에 남깁니다.</p>']);
    let chk = checklist(id, st.checks) + `<h3>성찰 질문</h3><p>${esc(st.reflect)}</p>`;
    if (st.examples) chk += `<h3>함께 찾아볼 예시 (시트 원문)</h3>${table(['유형', '예시'], st.examples)}`;
    secs.push(['check', '검수', chk]);
    const n = Number(st.no);
    const prev = n === 1 ? ['#start', 'START · AI, 구조, 역할'] : [`#s${n - 1}`, `${n - 1}단계 · ${D.stages[n - 2].title}`];
    const next = n === 3 ? ['#review', '마무리 · 기록하고 돌아보기'] : [`#s${n + 1}`, `${n + 1}단계 · ${D.stages[n].title}`];
    paint(id, secs, prev, next);
  }
  function renderReview() {
    const r = D.review;
    $('#bcStage').textContent = '마무리 기록하고 돌아보기';
    $('#shEyebrow').textContent = 'WRAP-UP · 기록';
    $('#shTitle').textContent = '기록하고 돌아보기';
    $('#shSum').textContent = '결과를 시트에 기록하고, 오늘 AI가 한 일과 내가 한 일을 나눠 봅니다.';
    $('#shMeta').innerHTML = `<span class="meta-chip active">${esc(r.time)}</span><span class="meta-chip">산출물 · 카드뉴스 1편과 링크</span>`;
    const secs = [
      ['steps', '시트에 기록하기', `<ol class="plain">${r.steps.map(x => `<li>${x}</li>`).join('')}</ol>`],
      ['reflect', '성찰 질문', r.reflect.map((q, i) => noteBox(`review.q${i}`, q, '내 생각을 짧게 적어 보세요')).join('')],
      ['homework', '2회차 전 과제', ul(r.homework.map(esc))],
      ['check', '검수', checklist('review', r.checks)]
    ];
    paint('review', secs, ['#s3', '3단계 · ' + D.stages[2].title], ['#home', '처음 화면']);
  }
  function paint(id, secs, prev, next) {
    $('#stageToc').innerHTML = '<strong>목차</strong>' + secs.map(s => `<a href="#${id}-${s[0]}" class="${s[0] === 'prompt' ? 'toc-run' : ''}">${esc(s[1])}</a>`).join('');
    const body = $('#stageBody');
    body.innerHTML = secs.map((s, i) => `<section id="${id}-${s[0]}"><span class="section-number">${i + 1}</span><h2>${esc(s[1])}</h2>${s[2]}</section>`).join('') +
      `<div class="lesson-navigation"><a href="${prev[0]}"><span>이전</span><strong>${esc(prev[1])}</strong></a><a class="lesson-next" href="${next[0]}"><span>다음</span><strong>${esc(next[1])}</strong></a></div>`;
    bindCopy(body); bindNotes(body); bindChecks(body);
  }

  /* ---------- START 장표 ---------- */
  const SIX = [
    ['1장', '표지', '시선을 끄는 훅', '질문형·숫자형으로 3초 안에 멈추게'],
    ['2장', '문제', '독자의 불편', '"이런 적 있으시죠?"로 공감'],
    ['3장', '정보①', '핵심 정보', '비교나 개념 하나'],
    ['4장', '정보②', '핵심 정보', '3장과 짝이 되는 두 번째 정보'],
    ['5장', '선택 기준', '실천 방법', '독자가 바로 쓸 수 있는 기준'],
    ['6장', 'CTA', '행동 유도', '저장·댓글·공유 중 하나']
  ];
  const KB1 = [
    ['표지 훅', '청축·적축·갈축, 내 귀에는 뭐가 맞을까?'], ['1장', '청축·적축·갈축 / 3초 만에 고르기'],
    ['2장', '키감만 보고 샀다가 / 소음 때문에 후회할 수 있어요'], ['3장', '청축: 경쾌한 클릭음 / 타건 피드백이 분명해요'],
    ['4장', '적축: 조용하고 부드러움 / 갈축: 소리와 구분감의 중간'], ['5장', '사용 장소와 원하는 키감을 / 먼저 정하세요'],
    ['6장', '저장해 두고 매장에서 비교하세요']
  ];
  const gi = g => SLIDES.findIndex(s => s.g === g);
  const SRC_AI = '출처: 과학기술정보통신부, 「2025 인터넷이용실태조사」 결과 발표(2026. 3. 31.) · 전국 22,671가구, 만 3세 이상 50,750명';
  const SLIDES = [
    { g: 0, nav: '시작', title: '세 가지 키워드', html: () => `<span class="slide-kicker">START · AI 활용 카드뉴스 제작</span><h1>AI, 구조, 역할</h1>
      <p class="slide-lead">실습 전에 보는 세 가지 키워드</p>
      <div class="kw3"><a href="#start-${gi(1)}"><b>KEYWORD 1</b><strong>AI</strong><span>우리나라 생성형 AI 이용 현황 · 오늘 쓰는 AI 세 가지 · API 키</span></a>
      <a href="#start-${gi(2)}"><b>KEYWORD 2</b><strong>구조</strong><span>카드뉴스 6장의 역할 · 표지 훅 · 시트 한 줄에서 디자인까지</span></a>
      <a href="#start-${gi(3)}"><b>KEYWORD 3</b><strong>역할</strong><span>AI가 하는 일과 사람이 하는 일 · 실습 전 약속</span></a></div>` },
    { g: 1, nav: '1-1', title: '생성형 AI 이용 현황', html: () => `<span class="slide-kicker">1. AI · 1) 우리나라 생성형 AI 이용 현황</span><h1>국민 절반 가까이가 써 봤습니다</h1>
      <div class="stat3">
        <div class="stat"><em>생성형 AI 경험률</em><strong>44.5%</strong><div class="cap">2024년 33.3% → 2025년 44.5%</div><p>1년 사이 11.2%p 늘었습니다. 사무직 경험률은 71.9%로 직업 중 가장 높습니다.</p></div>
        <div class="stat"><em>서비스별 경험률 (복수응답)</em><strong>41.8%</strong><div class="cap">ChatGPT 41.8% · Gemini 9.8%</div><p>오늘 실습에서 쓰는 두 서비스가 1·2위입니다. 유료 구독 비율은 7.9%로, 대부분 무료로 씁니다.</p></div>
        <div class="stat"><em>정보·결과물을 믿는다</em><strong>54.7%</strong><div class="cap">절반 남짓만 결과를 신뢰</div><p>AI 결과물은 그대로 쓰기보다 확인하고 고쳐서 쓰는 도구라는 뜻입니다. 오늘 2단계에서 직접 검토합니다.</p></div>
      </div>
      <p class="src">${esc(SRC_AI)}</p>` },
    { g: 1, nav: '1-2', title: '아직 안 쓰는 이유', html: () => `<span class="slide-kicker">1. AI · 2) 아직 쓰지 않는 사람들</span><h1>"필요 없어서", "방법을 몰라서"</h1>
      <p class="slide-lead">생성형 AI를 쓰지 않는 55.5% 가운데 49.5%가 "관심 또는 필요가 없어서"라고 답했습니다.</p>
      <div class="pts"><div class="pt"><b>10~20대</b><strong>필요를 못 느낀다</strong><p>12~19세 68.2%, 20대 56.0%가 관심·필요가 없다는 이유를 가장 많이 꼽았습니다.</p></div>
      <div class="pt"><b>60대 이상</b><strong>쓰는 방법을 모른다</strong><p>"이용 방법을 몰라서"라는 응답이 60대 25.3%, 70대 이상 26.1%로 상대적으로 높았습니다.</p></div></div>
      <div class="note">오늘 수업은 "내 일에 필요한 곳"과 "쓰는 방법"을 함께 해결합니다. 카드뉴스 한 편을 끝까지 만들어 보면 어디에 쓸지가 보입니다.</div>
      <p class="src">${esc(SRC_AI)}</p>` },
    { g: 1, nav: '1-3', title: '오늘 쓰는 AI 세 가지', html: () => `<span class="slide-kicker">1. AI · 3) 오늘 쓰는 AI 세 가지</span><h1>도구마다 맡는 일이 다릅니다</h1>
      <div class="stat3 cn-tools">
        <div class="stat"><em>2단계 · 원고</em><strong>Gemini</strong><div class="cap">시트 안에서 버튼 하나로</div><p>시트의 [카드뉴스 AI] 메뉴가 Gemini API를 불러 6장 원고와 이미지 프롬프트를 칸에 채웁니다. 채팅창을 열지 않아도 됩니다.</p></div>
        <div class="stat"><em>3단계 · 기획 보강</em><strong>ChatGPT</strong><div class="cap">프로젝트에 지침을 한 번 저장</div><p>프로젝트 지침과 시트를 넣어 두면 요청문 한 번으로 게시 문구, 이미지 구성, 해시태그를 받습니다.</p></div>
        <div class="stat"><em>3단계 · 디자인</em><strong>Canva</strong><div class="cap">편집할 수 있는 디자인</div><p>4:5 세로 카드 6장을 편집 가능한 디자인으로 받습니다. 연결이 안 되면 표지 이미지 한 장으로 대신합니다.</p></div>
      </div>
      <p class="src">요금제에 따라 ChatGPT 프로젝트·앱 연결과 Canva 기능이 다를 수 있습니다. 수업 전에 내 계정에서 확인합니다.</p>` },
    { g: 1, nav: '1-4', title: 'API 키란', html: () => `<span class="slide-kicker">1. AI · 4) API와 API 키</span><h1>API 키는 내 AI 출입증입니다</h1>
      <div class="pts cn-pts3"><div class="pt"><b>API</b><strong>프로그램끼리 대화하는 창구</strong><p>사람이 채팅창에 쓰는 대신, 시트가 Gemini에게 직접 요청하고 답을 받아 옵니다.</p></div>
      <div class="pt"><b>API 키</b><strong>"내가 보낸 요청"이라는 증명</strong><p>Google AI Studio에서 발급합니다. 이 키로 쓴 사용량은 내 계정에 쌓입니다.</p></div>
      <div class="pt"><b>지킬 것</b><strong>비밀번호처럼 나만 보관</strong><p>채팅방·시트 셀·메신저에 붙여 넣지 않습니다. 시트의 등록 메뉴는 키를 내 계정의 비공개 공간에 보관합니다.</p></div></div>
      <div class="note">무료 사용에는 하루·분당 호출 한도가 있습니다. 한도와 데이터 활용 조건은 Google 공식 가격 안내에서 확인합니다.</div>` },
    { g: 2, nav: '2-1', title: '카드뉴스 6장 구조', html: () => `<span class="slide-kicker">2. 구조 · 1) 6장의 역할</span><h1>장마다 맡은 일이 있습니다</h1>
      <p class="slide-lead">규칙: 장마다 제목 1줄 + 본문 2줄 이내. 확인되지 않은 사양·가격·건강 정보는 단정하지 않습니다.</p>
      <div class="cn-six">${SIX.map(x => `<div><b>${esc(x[0])} · ${esc(x[1])}</b><strong>${esc(x[2])}</strong><span>${esc(x[3])}</span></div>`).join('')}</div>
      <p class="src">출처: 운영 시트 'GPT 프로젝트 설정' 탭의 프로젝트 지침</p>` },
    { g: 2, nav: '2-2', title: '예시로 읽기', html: () => `<span class="slide-kicker">2. 구조 · 2) 예시로 읽기</span><h1>KB-001 · 스위치 소리 비교</h1>
      <p class="slide-lead">타깃: 기계식 키보드 입문자. 각 장이 여섯 역할 중 무엇인지 맞혀 보세요.</p>
      ${table(['장', '원고 (제목 / 본문)'], KB1)}
      <p class="src">출처: 운영 시트 '카드뉴스 관리' 탭 KB-001 행</p>` },
    { g: 2, nav: '2-3', title: '좋은 표지 훅', html: () => `<span class="slide-kicker">2. 구조 · 3) 표지 훅</span><h1>표지 훅 세 가지 유형</h1>
      <p class="slide-lead">내 주제로 두 가지 유형을 골라 써 봅니다. 1단계에서 시트에 옮깁니다.</p>
      <div class="pts cn-pts3"><div class="pt"><b>01 · 질문형</b><strong>업무용 키보드, 예쁜 것보다 먼저 볼 5가지</strong><p>독자가 스스로 답을 떠올리게 합니다. (KB-003)</p></div>
      <div class="pt"><b>02 · 숫자형</b><strong>5만·10만·20만 원대, 어디서 차이가 날까?</strong><p>범위가 분명해 끝까지 볼 이유가 생깁니다. (KB-006)</p></div>
      <div class="pt"><b>03 · 공감형</b><strong>손목이 아프다면 키보드 높이부터 확인하세요</strong><p>불편을 먼저 짚어 "내 얘기"로 느끼게 합니다. (KB-005)</p></div></div>` },
    { g: 2, nav: '2-4', title: '시트 한 줄에서 디자인까지', html: () => `<span class="slide-kicker">2. 구조 · 4) 오늘의 흐름</span><h1>시트 한 줄에서 디자인까지</h1>
      <p class="slide-lead">모든 결과가 내 시트 한 줄에 모입니다. 내가 직접 쓰는 칸은 B~I열 여덟 개뿐입니다.</p>
      <ol class="cn-flow wide">${FLOW.map((f, i) => `<li><b>${i + 1}</b><div><strong>${esc(f[1])}</strong><span>${esc(f[0])} · ${esc(f[2])}</span></div></li>`).join('')}</ol>` },
    { g: 3, nav: '3-1', title: 'AI와 사람의 역할', html: () => `<span class="slide-kicker">3. 역할 · 1) 역할 나누기</span><h1>AI가 쓰고, 사람이 결정합니다</h1>
      <div class="recap"><div class="recap-col"><b>AI가 하는 일</b><span>6장 원고 초안 쓰기</span><span>표지 훅 여러 개 제안</span><span>이미지 구성과 프롬프트</span><span>게시 문구와 해시태그</span></div>
      <div class="recap-col"><b>사람이 하는 일</b><span>타깃과 주제 정하기</span><span>사실·가격·건강 정보 확인</span><span>과장과 오타 고치기</span><span>게시 여부 최종 결정</span></div></div>
      <div class="note">AI 결과물을 믿는다는 사람은 54.7%입니다. 고칠 곳을 하나 이상 찾아 직접 고친 사람이 이 카드뉴스의 작성자입니다.</div>` },
    { g: 3, nav: '3-2', title: '실습 전 약속', html: () => `<span class="slide-kicker">3. 역할 · 2) 실습 전 약속</span><h1>실습 전에 약속할 세 가지</h1>
      <div class="pts cn-pts3"><div class="pt"><b>01</b><strong>API 키는 나만 봅니다</strong><p>채팅방, 시트 셀, 단체 메신저에 붙여 넣지 않습니다.</p></div>
      <div class="pt"><b>02</b><strong>모르는 코드는 허용하지 않습니다</strong><p>"확인되지 않은 앱" 승인은 출처를 아는 시트에서만 합니다.</p></div>
      <div class="pt"><b>03</b><strong>확인 필요는 직접 확인합니다</strong><p>가격·사양·건강 정보는 공식 자료로 확인한 뒤 게시합니다.</p></div></div>` }
  ];
  const GROUPS = ['시작', 'AI', '구조', '역할'];
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
      ['실습', [...D.stages.map(s => ['#' + s.id, s.no + '단계', s.title]), ['#review', '마무리', '기록하고 돌아보기']]],
      ['자료와 안내', [['#timeline', '시간표', '시간표 (3시간)'], ['#materials', '자료', '복사해서 쓰는 자료'], ['#safety', '유의', '내 일에 쓸 때'], ['#help', '도움', '막힐 때'], ['#sources', '출처', '참고 자료']]]
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
    else if (/^s[123]$/.test(view)) { $('#viewStage').hidden = false; renderStage(view); }
    else if (view === 'review') { $('#viewStage').hidden = false; renderReview(); }
    else { $('#viewHome').hidden = false; renderHome(); if (HOME_SECS.includes(view)) target = document.getElementById('sec-' + view); }
    if (sub && view !== 'start') target = document.getElementById(h);
    requestAnimationFrame(() => { if (target) target.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); });
  }

  renderStatic();
  renderQuick();
  window.addEventListener('hashchange', route);
  route();
})();
