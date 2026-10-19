// 커리어캐쳐 면접 리허설 (MVP)
// 흐름: 시작 → 질문 고르기 → 질문 듣기 → 준비 30초 → 말로 답하기 → 답변 확인 → 피드백 → 다시 답하기 → 전후 비교
// 음성은 브라우저 안에서 글자로만 바뀌고, 녹음 파일은 만들지도 보내지도 않는다.

import { QUESTIONS, CATEGORIES, findQuestion } from './questions.js';
import { RUBRIC, measure, speedLabel, deliveryScore, localEvaluate } from './scoring.js';
import { buildText, saveImage } from './save.js';

const PREP_SEC = 30;
const app = document.getElementById('app');
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

// ---------- 설정 (링크 파라미터 > 이 기기에 저장한 값) ----------
const params = new URLSearchParams(location.search);
const store = {
  get(k) { try { return localStorage.getItem('cc-interview-' + k); } catch { return null; } },
  set(k, v) { try { v ? localStorage.setItem('cc-interview-' + k, v) : localStorage.removeItem('cc-interview-' + k); } catch { /* 저장 불가 환경 */ } },
};
if (params.get('relay')) store.set('relay', params.get('relay'));
if (params.get('code')) store.set('code', params.get('code'));

const settings = {
  relay: store.get('relay') || '',
  code: store.get('code') || '',
  limit: [60, 90].includes(Number(params.get('t'))) ? Number(params.get('t')) : Number(store.get('limit')) || 60,
  textMode: !SR,
};
const assigned = (params.get('q') || '').split(',').map(findQuestion).filter(Boolean);

// 카카오톡 인앱 브라우저는 마이크가 막히는 경우가 많아, 처음 한 번은 외부 브라우저로 자동으로 넘긴다.
const KAKAO_EXTERNAL = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
if (/KAKAOTALK/i.test(navigator.userAgent)) {
  let tried = false;
  try { tried = sessionStorage.getItem('cc-kakao-tried') === '1'; sessionStorage.setItem('cc-kakao-tried', '1'); } catch { /* 무시 */ }
  if (!tried) location.href = KAKAO_EXTERNAL;
}

// ---------- 상태 ----------
const state = {
  screen: 'home',
  question: null,
  attempts: [], // {answer, metrics, result}
  draft: null,  // {answer, rawAnswer, durationSec}
  consent: false,
  log: [],      // 오늘 연습한 질문들 {question, attempts}. 화면을 닫으면 사라진다.
  saved: false, // 저장(이미지·PDF·복사)을 한 번이라도 했는지
};

// ---------- 공통 ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let cleanup = [];
function go(screen) {
  cleanup.forEach(fn => fn());
  cleanup = [];
  state.screen = screen;
  render();
  window.scrollTo(0, 0);
}
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2600);
}
function header(step) {
  const showLog = state.log.length && !['ask', 'loading', 'records'].includes(state.screen);
  return `<header class="top no-print"><button class="brand" data-act="home" aria-label="처음으로">커리어캐쳐 <b>면접 리허설</b></button>${showLog ? `<button class="btn ghost sm" data-act="records">연습 기록 ${state.log.length}</button>` : step ? `<span class="step">${esc(step)}</span>` : ''}</header>`;
}
function inAppBrowser() {
  const ua = navigator.userAgent;
  if (/KAKAOTALK/i.test(ua)) return '카카오톡';
  if (/NAVER\(inapp/i.test(ua)) return '네이버';
  if (/Instagram|FBAN|FBAV|Line\//i.test(ua)) return '앱';
  return '';
}

// ---------- 음성 ----------
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.95;
  const voice = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('ko'));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

// 브라우저 음성 인식. 휴대폰에서는 인식이 중간에 끊기므로 답변 중에는 자동으로 다시 켠다.
function createRecognizer(onText, onError) {
  const rec = new SR();
  rec.lang = 'ko-KR';
  rec.continuous = true;
  rec.interimResults = true;
  let committed = '';
  let sessionFinals = [];
  let active = false;

  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript.trim();
      if (!t) continue;
      if (e.results[i].isFinal) {
        // 일부 안드로이드는 앞 문장까지 합친 결과를 다시 보낸다. 이어지는 결과면 교체한다.
        const last = sessionFinals[sessionFinals.length - 1];
        if (last && t.startsWith(last)) sessionFinals[sessionFinals.length - 1] = t;
        else if (!last || !last.startsWith(t)) sessionFinals.push(t);
      } else {
        interim += ' ' + t;
      }
    }
    onText(join(committed, sessionFinals.join(' ')), interim.trim());
  };
  rec.onerror = e => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    active = false;
    onError(e.error);
  };
  rec.onend = () => {
    committed = join(committed, sessionFinals.join(' '));
    sessionFinals = [];
    if (active) { try { rec.start(); } catch { /* 이미 시작됨 */ } }
  };
  return {
    start() { active = true; rec.start(); },
    stop() { active = false; try { rec.stop(); } catch { /* 무시 */ } return join(committed, sessionFinals.join(' ')); },
    text() { return join(committed, sessionFinals.join(' ')); },
  };
}
const join = (a, b) => [a, b].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

// ---------- 화면: 시작 ----------
function homeView() {
  const inApp = inAppBrowser();
  const aiOn = Boolean(settings.relay);
  return `${header()}
  <main class="wrap">
    <section class="hero">
      <h1>듣고, 말하고,<br>한 가지만 고쳐서 다시.</h1>
      <p>질문을 듣고 말로 답하면, 커리어캐쳐 기준으로 피드백을 드립니다. 같은 질문에 한 번 더 답해 달라진 점을 확인해 보세요. 카메라는 쓰지 않습니다.</p>
    </section>
    ${inApp ? `<div class="notice warn"><b>${esc(inApp)} 안에서 열려 있어요.</b> 이 화면에서는 마이크가 막힐 수 있습니다. ${inApp === '카카오톡' ? `아래 버튼을 눌러 Chrome이나 Safari에서 열어 주세요.<a class="btn primary sm" href="${KAKAO_EXTERNAL}">다른 브라우저로 열기</a>` : '오른쪽 위 메뉴에서 <b>다른 브라우저로 열기</b>(Chrome, Safari 등)를 눌러 주세요.'}<button class="btn ghost sm" data-act="copy-link">주소 복사</button></div>` : ''}
    ${!SR ? `<div class="notice">이 브라우저는 음성 인식을 지원하지 않아 <b>글로 답하기</b>로 진행합니다. 말로 연습하려면 Chrome(안드로이드·PC) 또는 Safari(아이폰)에서 열어 주세요.</div>` : ''}
    <section class="card">
      <h2>시작 전에 확인해 주세요</h2>
      <ul class="plain">
        <li>말한 소리는 휴대폰 브라우저의 음성 인식 기능(Chrome은 Google, 아이폰은 Apple)이 글자로 바꿉니다. 이 앱은 녹음 파일을 만들거나 보관하지 않습니다.</li>
        <li>${aiOn ? '피드백을 만들 때 질문과 답변 글만 AI 평가 서버로 보냅니다. 서버는 답변을 저장하지 않습니다.' : '피드백은 이 휴대폰 안에서 만들어지며, 답변은 어디에도 전송하지 않습니다.'}</li>
        <li>회원가입이 없고, 화면을 닫으면 답변은 사라집니다. 실명, 학교, 회사 이름은 말하지 않아도 됩니다.</li>
        <li>점수는 연습용 참고치이며 합격을 예측하지 않습니다. 목소리 톤, 외모, 표정은 평가하지 않습니다.</li>
      </ul>
      <label class="check"><input type="checkbox" id="consent" ${state.consent ? 'checked' : ''}> 위 내용을 확인했습니다</label>
    </section>
    <section class="card">
      <h2>답변 시간</h2>
      <div class="seg" role="radiogroup" aria-label="답변 시간">
        ${[60, 90].map(s => `<button role="radio" aria-checked="${settings.limit === s}" class="${settings.limit === s ? 'on' : ''}" data-act="limit" data-v="${s}">${s}초</button>`).join('')}
      </div>
      ${SR ? `<label class="check"><input type="checkbox" id="textmode" ${settings.textMode ? 'checked' : ''}> 말하기가 어려우면 글로 답하기</label>` : ''}
    </section>
    <button class="btn primary big" data-act="start">${assigned.length ? `강사가 준 질문 ${assigned.length}개로 시작` : '질문 고르기'}</button>
    <details class="card settings">
      <summary>강사용 설정 ${aiOn ? '<span class="pill ok">AI 연결됨</span>' : '<span class="pill">자동 피드백</span>'}</summary>
      <p class="muted">AI 평가 서버 주소와 수업 코드를 넣으면 AI 피드백을 받습니다. 배포 링크에 <code>?relay=주소&amp;code=수업코드&amp;q=1,4,7</code>를 붙이면 참여자는 입력 없이 바로 시작합니다.</p>
      <label>AI 평가 서버 주소<input id="relay" type="url" inputmode="url" placeholder="https://....workers.dev" value="${esc(settings.relay)}"></label>
      <label>수업 코드<input id="code" type="text" autocomplete="off" value="${esc(settings.code)}"></label>
      <div class="row"><button class="btn ghost" data-act="save-settings">저장</button><button class="btn ghost" data-act="share-link">배포 링크 복사</button></div>
    </details>
  </main>`;
}

// ---------- 화면: 질문 고르기 ----------
function pickView() {
  const list = assigned.length ? assigned : QUESTIONS;
  const groups = assigned.length ? [['강사가 준 질문', list]] : CATEGORIES.map(c => [c, list.filter(q => q.cat === c)]);
  return `${header('질문 고르기')}
  <main class="wrap">
    <button class="btn ghost wide" data-act="random">아무 질문이나 골라 주세요</button>
    ${groups.map(([name, qs]) => `
      <h2 class="group">${esc(name)}</h2>
      <ul class="qlist">${qs.map(q => `<li><button data-act="choose" data-id="${q.id}"><span class="qn">${q.id}</span>${esc(q.text)}</button></li>`).join('')}</ul>
    `).join('')}
  </main>`;
}

// ---------- 화면: 질문 듣기·준비·답변 ----------
function askView() {
  const q = state.question;
  const round = state.attempts.length + 1;
  return `${header(round === 1 ? '첫 번째 답변' : `${round}번째 답변`)}
  <main class="wrap">
    <section class="question">
      <p class="qcat">${esc(q.cat)} 질문</p>
      <h1 id="qtext">${esc(q.text)}</h1>
      <button class="btn ghost sm" data-act="listen">질문 다시 듣기</button>
    </section>
    ${round > 1 ? `<div class="notice focus"><b>이번에 고칠 한 가지</b>${esc(state.attempts[state.attempts.length - 1].result.next_fix)}</div>` : `<p class="tip">${esc(q.tip)}</p>`}
    <section class="stage" id="stage">
      <div class="timer" id="timer" aria-live="polite"><span class="tlabel">준비</span><span class="tnum">${PREP_SEC}</span></div>
      <p class="muted center" id="stageMsg">답할 내용을 머릿속으로 정리해 보세요.</p>
      <div class="live" id="live" hidden></div>
      <textarea id="typed" rows="8" placeholder="여기에 답변을 써 주세요" hidden></textarea>
    </section>
    <button class="btn primary big" id="mainBtn" data-act="answer-now">바로 답하기</button>
  </main>`;
}

function bindAsk() {
  const q = state.question;
  const timerEl = document.getElementById('timer');
  const msg = document.getElementById('stageMsg');
  const live = document.getElementById('live');
  const typed = document.getElementById('typed');
  const btn = document.getElementById('mainBtn');
  let phase = 'prep';
  let left = PREP_SEC;
  let startedAt = 0;
  let rec = null;
  let tick = null;

  const setTimer = (label, n, warn) => {
    timerEl.innerHTML = `<span class="tlabel">${label}</span><span class="tnum">${n}</span>`;
    timerEl.classList.toggle('warn', Boolean(warn));
  };

  speak(q.text);
  tick = setInterval(() => {
    left -= 1;
    if (phase === 'prep') {
      setTimer('준비', left);
      if (left <= 0) beginAnswer();
    } else if (phase === 'answer') {
      setTimer('남은 시간', left, left <= 10);
      if (left <= 0) finish();
    }
  }, 1000);

  function beginAnswer() {
    if (phase !== 'prep') return;
    phase = 'answer';
    left = settings.limit;
    startedAt = Date.now();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    setTimer('남은 시간', left);
    btn.textContent = '답변 끝내기';
    btn.dataset.act = 'finish';
    if (settings.textMode) {
      msg.textContent = '답변을 글로 써 주세요. 시간이 지나도 이어서 쓸 수 있습니다.';
      typed.hidden = false;
      typed.focus();
      return;
    }
    msg.innerHTML = '<span class="rec-dot" aria-hidden="true"></span>듣고 있어요. 편하게 말해 주세요.';
    live.hidden = false;
    live.innerHTML = '<span class="muted">말하면 여기에 글자로 나타납니다.</span>';
    rec = createRecognizer(
      (finalText, interim) => {
        live.innerHTML = `${esc(finalText)} <span class="interim">${esc(interim)}</span>`;
        live.scrollTop = live.scrollHeight;
      },
      err => {
        const denied = err === 'not-allowed' || err === 'service-not-allowed';
        toast(denied ? '마이크 권한이 꺼져 있어요. 글로 답하기로 바꿉니다.' : '음성 인식이 멈췄어요. 이어서 글로 써 주세요.');
        const sofar = rec ? rec.text() : '';
        rec = null;
        live.hidden = true;
        typed.hidden = false;
        typed.value = sofar;
        msg.textContent = denied ? '브라우저 주소창 옆 자물쇠 아이콘에서 마이크를 허용하면 다음부터 말로 답할 수 있습니다.' : '';
        if (denied) settings.textMode = true;
      },
    );
    try { rec.start(); } catch { toast('음성 인식을 시작하지 못했어요.'); }
  }

  function finish() {
    if (phase === 'done') return;
    if (phase === 'prep') { beginAnswer(); return; }
    phase = 'done';
    clearInterval(tick);
    const durationSec = Math.min(settings.limit, (Date.now() - startedAt) / 1000);
    let text = typed.value.trim();
    if (rec) text = join(rec.stop(), text);
    state.draft = { answer: text, rawAnswer: text, durationSec, typed: settings.textMode || !typed.hidden };
    // 인식 마지막 조각이 늦게 도착하는 경우가 있어 잠깐 기다린다.
    setTimeout(() => { if (rec) state.draft.answer = state.draft.rawAnswer = join(rec.text(), typed.value.trim()); go('review'); }, rec ? 600 : 0);
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (btn.dataset.act === 'answer-now') beginAnswer();
    else finish();
  });
  cleanup.push(() => { clearInterval(tick); if (rec && phase !== 'done') rec.stop(); if ('speechSynthesis' in window) speechSynthesis.cancel(); });
}

// ---------- 화면: 답변 확인 ----------
function reviewView() {
  const d = state.draft;
  const empty = !d.answer;
  return `${header('답변 확인')}
  <main class="wrap">
    <section class="card">
      <h2>이렇게 답하셨어요</h2>
      <p class="muted">${d.typed ? '' : '음성 인식이 잘못 받아 적은 낱말만 고쳐 주세요. 내용을 새로 쓰면 실제 말하기와 달라집니다. '}답변 시간 ${Math.round(d.durationSec)}초</p>
      <textarea id="answer" rows="9">${esc(d.answer)}</textarea>
      ${empty ? '<p class="warn-text">인식된 답변이 없어요. 다시 답하거나 글로 써 주세요.</p>' : ''}
    </section>
    <button class="btn primary big" data-act="evaluate">피드백 받기</button>
    <button class="btn ghost wide" data-act="redo">이 답변 버리고 다시 답하기</button>
  </main>`;
}

async function evaluate() {
  const answer = document.getElementById('answer').value.trim();
  if (answer.length < 5) { toast('답변이 너무 짧아요. 조금 더 말하거나 써 주세요.'); return; }
  const d = state.draft;
  // 지표는 사용자가 고치기 전 원문 기준(군말 수가 지워지지 않도록), 글로 쓴 답은 속도를 보지 않는다.
  const metrics = measure(d.typed ? answer : d.rawAnswer || answer, d.durationSec);
  metrics.typed = d.typed;
  state.screen = 'loading';
  app.innerHTML = `${header('피드백 만드는 중')}<main class="wrap"><div class="loading"><div class="spinner" aria-hidden="true"></div><p>답변을 커리어캐쳐 기준으로 살펴보고 있어요.</p></div></main>`;

  const prev = state.attempts[state.attempts.length - 1];
  let result = null;
  if (settings.relay) {
    try {
      result = await remoteEvaluate({ answer, metrics, prev });
    } catch (err) {
      toast(`AI 평가 서버에 연결하지 못해 간이 피드백으로 보여 드려요. (${err.message})`);
    }
  }
  if (!result) result = localEvaluate({ answer, metrics, limitSec: settings.limit });
  // 전달 점수는 항상 같은 기준으로 계산한다. 글로 쓴 답변은 전달을 평가하지 않는다.
  if (d.typed) { result.scores.delivery = null; result.reasons.delivery = '글로 답해 전달은 평가하지 않습니다'; }
  else { const dv = deliveryScore(metrics, settings.limit); result.scores.delivery = dv.score; result.reasons.delivery = dv.reason; }

  state.attempts.push({ answer, metrics, result });
  if (state.attempts.length === 1) state.log.push({ question: state.question, attempts: state.attempts });
  state.saved = false;
  state.draft = null;
  go(state.attempts.length > 1 ? 'compare' : 'report');
}

async function remoteEvaluate({ answer, metrics, prev }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch(settings.relay.replace(/\/+$/, '') + '/evaluate', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'X-Class-Code': settings.code },
      body: JSON.stringify({
        question: state.question.text,
        answer,
        durationSec: Math.round(metrics.durationSec),
        limitSec: settings.limit,
        typed: metrics.typed,
        previous: prev ? { answer: prev.answer, next_fix: prev.result.next_fix } : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `오류 ${res.status}`);
    data.source = 'ai';
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('응답 시간 초과');
    throw err;
  } finally {
    clearTimeout(t);
  }
}

// ---------- 화면: 피드백 ----------
function scoreBars(scores, reasons, prevScores) {
  return `<ul class="scores">${RUBRIC.map(r => {
    const v = scores[r.key];
    const p = prevScores ? prevScores[r.key] : null;
    const diff = v != null && p != null ? v - p : null;
    return `<li>
      <div class="sl"><b>${r.label}</b><span class="muted">${esc(reasons[r.key] || r.looks)}</span></div>
      <div class="sv">${v == null ? '<span class="muted">-</span>' : `<span class="bar" style="--v:${v}"><i></i></span><span class="num">${v}</span>`}${diff ? `<span class="diff ${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '+' : ''}${diff}</span>` : ''}</div>
    </li>`;
  }).join('')}</ul>`;
}

function metricsRow(m) {
  const fillerList = Object.entries(m.fillerDetail || {}).map(([k, n]) => `${k} ${n}`).join(', ');
  return `<dl class="metrics">
    <div><dt>답변 길이</dt><dd>${m.durationSec}초</dd></div>
    ${m.typed ? '' : `<div><dt>말 속도</dt><dd>분당 ${m.perMin}음절 <small>${speedLabel(m.perMin)}</small></dd></div>
    <div><dt>군말</dt><dd>${m.fillers}번 ${fillerList ? `<small>${esc(fillerList)}</small>` : ''}</dd></div>`}
  </dl>`;
}

function feedbackBody(a) {
  const r = a.result;
  return `
    <div class="nextfix"><p class="eyebrow">다음에 고칠 한 가지</p><p class="big">${esc(r.next_fix)}</p></div>
    <section class="card fb">
      <h3>잘한 점</h3><p>${esc(r.strength)}</p>
      <h3>고칠 점</h3><p>${esc(r.improvement)}</p>
      <h3>이렇게 바꿔 말해 보세요</h3><blockquote>${esc(r.rewrite_example)}</blockquote>
      <p class="muted small">[ ] 표시는 본인의 실제 경험으로 채워 주세요. 하지 않은 일을 지어내지 않도록 비워 두었습니다.</p>
    </section>`;
}

function disclaimer(a) {
  return `<p class="disclaimer">${a.result.source === 'ai' ? 'AI 피드백' : '자동 피드백(답변 속 표현을 정해진 규칙으로 살펴본 결과로, 내용의 깊이까지는 판단하지 못할 수 있습니다)'}입니다. 점수는 연습용 참고치이며 합격을 예측하지 않습니다. 전달 점수는 받아 적은 글과 시간만으로 계산하며 목소리 톤·억양은 보지 않습니다. 음성 인식은 "음, 어" 같은 군말을 빠뜨리기도 합니다.</p>`;
}

function reportView() {
  const a = state.attempts[state.attempts.length - 1];
  return `${header('피드백')}
  <main class="wrap">
    <p class="qsmall">${esc(state.question.text)}</p>
    ${feedbackBody(a)}
    <section class="card"><h3>항목별 점수 <small class="muted">각 5점</small></h3>${scoreBars(a.result.scores, a.result.reasons)}</section>
    <section class="card"><h3>말하기 지표</h3>${metricsRow(a.metrics)}</section>
    <details class="card"><summary>내 답변 보기</summary><p class="answer">${esc(a.answer)}</p></details>
    <button class="btn primary big" data-act="retry">한 가지 고쳐서 다시 답하기</button>
    <button class="btn ghost wide" data-act="pick">다른 질문 연습하기</button>
    ${savePanel()}
    ${disclaimer(a)}
  </main>`;
}

function compareView() {
  const first = state.attempts[0];
  const last = state.attempts[state.attempts.length - 1];
  const sum = s => Object.values(s).filter(v => v != null).reduce((x, y) => x + y, 0);
  const delta = sum(last.result.scores) - sum(first.result.scores);
  return `${header('전후 비교')}
  <main class="wrap">
    <p class="qsmall">${esc(state.question.text)}</p>
    <section class="hero small">
      <h1>${delta > 0 ? `처음보다 ${delta}점 올랐어요.` : delta === 0 ? '점수는 같지만, 달라진 문장을 확인해 보세요.' : '이번엔 점수가 내려갔어요. 괜찮습니다.'}</h1>
      ${last.result.comparison ? `<p>${esc(last.result.comparison)}</p>` : ''}
    </section>
    <section class="card"><h3>항목별 변화 <small class="muted">${state.attempts.length > 2 ? '첫 답변 대비' : ''}</small></h3>${scoreBars(last.result.scores, last.result.reasons, first.result.scores)}</section>
    <section class="compare">
      <div class="card"><h3>처음 답변</h3>${metricsRow(first.metrics)}<p class="answer">${esc(first.answer)}</p></div>
      <div class="card"><h3>${state.attempts.length > 2 ? '이번' : '다시 한'} 답변</h3>${metricsRow(last.metrics)}<p class="answer">${esc(last.answer)}</p></div>
    </section>
    ${feedbackBody(last)}
    <button class="btn primary big" data-act="pick">다른 질문 연습하기</button>
    <button class="btn ghost wide" data-act="retry">같은 질문 한 번 더</button>
    ${savePanel()}
    ${disclaimer(last)}
  </main>`;
}

// ---------- 저장 ----------
function savePanel() {
  const n = state.log.length;
  return `<section class="card save no-print">
    <h3>피드백 저장하기</h3>
    <p class="muted small">화면을 닫으면 기록이 사라져요. 오늘 연습한 질문 ${n}개의 피드백이 모두 담깁니다.</p>
    <div class="savebtns">
      <button class="btn primary" data-act="save-image">이미지로 저장</button>
      <button class="btn ghost" data-act="save-pdf">PDF로 저장</button>
      <button class="btn ghost" data-act="save-text">글로 복사</button>
    </div>
    <p class="muted small">이미지는 휴대폰 사진첩에 저장하거나 카카오톡 "나에게 보내기"로 보낼 수 있어요. 글로 복사하면 메모장이나 카카오톡에 붙여 넣을 수 있습니다.</p>
    ${state.screen !== 'records' ? '<button class="linkbtn" data-act="records">오늘 연습 기록 한눈에 보기</button>' : ''}
  </section>`;
}

function recordsView() {
  if (!state.log.length) return `${header('연습 기록')}<main class="wrap"><p class="muted">아직 연습한 질문이 없어요.</p><button class="btn primary big" data-act="pick">질문 고르기</button></main>`;
  const d = new Date();
  return `${header('연습 기록')}
  <main class="wrap records">
    <section class="hero small">
      <p class="eyebrow print-only">커리어캐쳐 면접 리허설</p>
      <h1>면접 연습 기록 <small class="muted">${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}</small></h1>
      <p>오늘 ${state.log.length}개 질문을 연습했어요.</p>
    </section>
    ${savePanel()}
    ${state.log.map((item, i) => {
      const first = item.attempts[0];
      const last = item.attempts[item.attempts.length - 1];
      return `<article class="card rec">
        <p class="eyebrow">질문 ${i + 1} · 답변 ${item.attempts.length}번</p>
        <h2>${esc(item.question.text)}</h2>
        <div class="nextfix"><p class="eyebrow">다음에 고칠 한 가지</p><p class="big">${esc(last.result.next_fix)}</p></div>
        ${scoreBars(last.result.scores, last.result.reasons, item.attempts.length > 1 ? first.result.scores : null)}
        <div class="fb">
          <h3>잘한 점</h3><p>${esc(last.result.strength)}</p>
          <h3>고칠 점</h3><p>${esc(last.result.improvement)}</p>
          <h3>이렇게 바꿔 말해 보세요</h3><blockquote>${esc(last.result.rewrite_example)}</blockquote>
          <h3>마지막 답변</h3><p class="answer">${esc(last.answer)}</p>
        </div>
      </article>`;
    }).join('')}
    <button class="btn primary big no-print" data-act="pick">다른 질문 연습하기</button>
    <p class="disclaimer">점수는 연습용 참고치이며 합격을 예측하지 않습니다. [ ] 표시는 본인의 실제 경험으로 채워 주세요. eunkyoungan.github.io/-/interview</p>
  </main>`;
}

async function doSave(act) {
  if (!state.log.length) { toast('먼저 질문 하나를 연습해 주세요.'); return; }
  if (act === 'save-text') {
    await copy(buildText(state.log), '피드백을 글로 복사했어요. 메모장이나 카카오톡에 붙여 넣어 주세요.');
    state.saved = true;
  } else if (act === 'save-image') {
    try {
      const how = await saveImage(state.log);
      if (how !== 'cancelled') { state.saved = true; toast(how === 'shared' ? '저장할 곳을 골라 주세요.' : '이미지를 내려받았어요.'); }
    } catch (err) { toast(err.message || '이미지 저장에 실패했어요.'); }
  } else if (act === 'save-pdf') {
    if (state.screen !== 'records') go('records');
    state.saved = true;
    toast('인쇄 창에서 "PDF로 저장"을 골라 주세요.');
    setTimeout(() => window.print(), 300);
  }
}

window.addEventListener('beforeunload', e => {
  if (state.log.length && !state.saved) { e.preventDefault(); e.returnValue = ''; }
});

// ---------- 렌더링 ----------
const views = { home: homeView, pick: pickView, ask: askView, review: reviewView, report: reportView, compare: compareView, records: recordsView };
function render() {
  app.innerHTML = views[state.screen]();
  if (state.screen === 'ask') bindAsk();
}

app.addEventListener('change', e => {
  if (e.target.id === 'consent') state.consent = e.target.checked;
  if (e.target.id === 'textmode') settings.textMode = e.target.checked;
});

app.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'home') { if (state.screen !== 'loading') go('home'); }
  else if (act === 'limit') { settings.limit = Number(el.dataset.v); store.set('limit', String(settings.limit)); render(); }
  else if (act === 'start') {
    if (!state.consent) { toast('시작 전 확인 항목에 체크해 주세요.'); document.getElementById('consent').focus(); return; }
    go('pick');
  }
  else if (act === 'choose' || act === 'random') {
    const pool = assigned.length ? assigned : QUESTIONS;
    state.question = act === 'random' ? pool[Math.floor(Math.random() * pool.length)] : findQuestion(el.dataset.id);
    state.attempts = [];
    go('ask');
  }
  else if (act === 'listen') speak(state.question.text);
  else if (act === 'redo' || act === 'retry') go('ask');
  else if (act === 'evaluate') evaluate();
  else if (act === 'pick') go('pick');
  else if (act === 'records') go('records');
  else if (act === 'save-image' || act === 'save-pdf' || act === 'save-text') doSave(act);
  else if (act === 'save-settings' || act === 'share-link') {
    settings.relay = document.getElementById('relay').value.trim();
    settings.code = document.getElementById('code').value.trim();
    if (settings.relay && !/^https:\/\//.test(settings.relay)) { toast('서버 주소는 https://로 시작해야 합니다.'); return; }
    store.set('relay', settings.relay);
    store.set('code', settings.code);
    if (act === 'share-link') {
      const url = new URL(location.pathname, location.origin);
      if (settings.relay) url.searchParams.set('relay', settings.relay);
      if (settings.code) url.searchParams.set('code', settings.code);
      if (assigned.length) url.searchParams.set('q', assigned.map(q => q.id).join(','));
      url.searchParams.set('t', String(settings.limit));
      copy(url.href, '배포 링크를 복사했어요. 질문을 고르려면 끝에 &q=1,4,7 처럼 번호를 붙이세요.');
    } else {
      toast('저장했어요.');
      render();
    }
  }
  else if (act === 'copy-link') copy(location.href, '주소를 복사했어요. 다른 브라우저 주소창에 붙여 넣어 주세요.');
});

async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { prompt('아래 내용을 길게 눌러 복사해 주세요.', text); }
}

render();
