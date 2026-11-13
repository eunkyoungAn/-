// 커리어캐쳐 면접 리허설 (MVP)
// 흐름: 시작 → 질문 고르기 → 질문 듣기 → 준비 30초 → 말로 답하기 → 답변 확인 → 피드백 → 다시 답하기 → 전후 비교
// 음성 모드: 브라우저 음성 인식으로 글자만 받는다. 녹음 파일은 만들지 않는다.
// 영상 모드(선택): 카메라로 녹화하고 시선·억양·템포를 휴대폰 안에서만 분석한다. 영상은 참여자가 직접 저장한다.

import { QUESTIONS, CATEGORIES, findQuestion } from './questions.js';
import { RUBRIC, measure, speedLabel, localEvaluate, totalScore, voiceScore } from './scoring.js';
import { BASIS, REFS, NOTICE } from './rubric.js';
import { buildText, buildSetText, saveImage, fileName } from './save.js';
import * as gem from './gemini.js';
import * as files from './files.js';
import { canRecord, openCamera, stopStream, startRecorder, startAudioAnalysis, startGaze, loadGazeModel, scoreNonverbal, saveVideo } from './video.js';

const PREP_SEC = 30;
const FOLLOW_PREP_SEC = 10;
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
  video: store.get('video') === '1' && canRecord(),
};
const assigned = (params.get('q') || '').split(',').map(findQuestion).filter(Boolean);

// 리포트를 받을 이메일(선택). 이 기기 브라우저에만 기억하고, 보내기를 누를 때만 쓴다.
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
let email = store.get('email') || '';
const KEY_URL = 'https://aistudio.google.com/apikey';

// 참여자가 직접 추가한 질문. 이 기기의 브라우저에만 저장되고 어디에도 보내지 않는다.
const CUSTOM_TIP = '첫 문장에 답을 먼저 말하고, 경험 하나를 근거로 들어 보세요.';
let custom = [];
try { custom = JSON.parse(store.get('custom') || '[]').filter(q => q && q.id && q.text); } catch { custom = []; }
const saveCustom = () => store.set('custom', custom.length ? JSON.stringify(custom) : '');
// 내 자료로 만든 예상 질문집. 이 기기 브라우저에만 저장된다.
let qset = null;
try { qset = JSON.parse(store.get('qset') || 'null'); } catch { qset = null; }
const saveQset = () => store.set('qset', qset ? JSON.stringify(qset) : '');
const setQuestions = () => (qset ? qset.questions : []);
const getQuestion = id => setQuestions().find(q => q.id === id) || custom.find(q => q.id === id) || findQuestion(id);
const hasGemini = () => Boolean(gem.getKey());

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
  follow: null,  // 꼬리질문 진행 중 {text, missing, main}
  material: { job: '', company: '', docs: { 자기소개서: '', 경력기술서: '', 포트폴리오: '', 경험노트: '' }, posting: '', files: [] },
  comps: null,   // 뽑은 핵심 역량(질문 만들기 전 확인용)
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
  toast.t = setTimeout(() => el.classList.remove('show'), Math.min(9000, Math.max(2600, String(msg).length * 90)));
}
function header(step) {
  const showLog = state.log.length && !['ask', 'loading', 'records'].includes(state.screen);
  return `<header class="top no-print"><button class="brand" data-act="home" aria-label="처음으로">커리어캐쳐 <b>면접 리허설</b></button>${showLog ? `<button class="btn ghost sm" data-act="records">리포트 ${state.log.length}</button>` : step ? `<span class="step">${esc(step)}</span>` : ''}</header>`;
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
      <p>질문을 듣고 말로 답하면, 커리어캐쳐 기준으로 피드백을 드립니다. 같은 질문에 한 번 더 답해 달라진 점을 확인해 보세요. 카메라는 원할 때만 켭니다.</p>
    </section>
    ${inApp ? `<div class="notice warn"><b>${esc(inApp)} 안에서 열려 있어요.</b> 이 화면에서는 마이크가 막힐 수 있습니다. ${inApp === '카카오톡' ? `아래 버튼을 눌러 Chrome이나 Safari에서 열어 주세요.<a class="btn primary sm" href="${KAKAO_EXTERNAL}">다른 브라우저로 열기</a>` : '오른쪽 위 메뉴에서 <b>다른 브라우저로 열기</b>(Chrome, Safari 등)를 눌러 주세요.'}<button class="btn ghost sm" data-act="copy-link">주소 복사</button></div>` : ''}
    ${!SR ? `<div class="notice">이 브라우저는 음성 인식을 지원하지 않아 <b>글로 답하기</b>로 진행합니다. 말로 연습하려면 Chrome(안드로이드·PC) 또는 Safari(아이폰)에서 열어 주세요.</div>` : ''}
    <button class="btn ghost wide" data-act="guide">처음이신가요? 이용 방법 보기</button>
    <section class="card form">
      <h2>피드백 리포트 받을 이메일 <small class="muted">선택</small></h2>
      <label class="field">이메일 주소<input id="email" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" value="${esc(email)}"></label>
      <p class="muted small">연습을 마치고 "이메일로 리포트 받기"를 누르면 이 주소로 피드백 리포트를 보내 드려요. 주소는 이 휴대폰에만 기억하고, 보내기를 누를 때만 사용합니다. 비워 두고 시작해도 됩니다.</p>
    </section>
    <section class="card">
      <h2>시작 전에 확인해 주세요</h2>
      <ul class="plain">
        <li>말한 소리는 휴대폰 브라우저의 음성 인식 기능(Chrome은 Google, 아이폰은 Apple)이 글자로 바꿉니다. 이 앱은 녹음 파일을 만들거나 보관하지 않습니다.</li>
        <li>${hasGemini() ? '내 Gemini 키가 연결되어 있어, 피드백·꼬리질문을 만들 때 질문과 답변 글(질문 만들기에서는 넣은 자료)이 Google Gemini로 전송됩니다.' : aiOn ? '피드백을 만들 때 질문과 답변 글만 AI 평가 서버로 보냅니다. 서버는 답변을 저장하지 않습니다.' : '피드백은 이 휴대폰 안에서 만들어지며, 답변은 어디에도 전송하지 않습니다.'}</li>
        <li>회원가입이 없고, 화면을 닫으면 답변은 사라집니다. 실명, 학교, 회사 이름은 말하지 않아도 됩니다.</li>
        <li>점수는 연습용 참고치이며 합격을 예측하지 않습니다. 외모, 표정, 목소리 높낮이 자체는 평가하지 않습니다.</li>
        ${settings.video ? '<li>영상 녹화를 켜면 시선 방향, 억양 변화, 말 빠르기를 이 휴대폰 안에서만 분석합니다. 영상은 어디에도 전송되지 않으며, 저장 버튼을 눌러야 휴대폰에 남습니다.</li>' : ''}
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
    ${canRecord() ? `<section class="card">
      <h2>답변 방식</h2>
      <div class="seg" role="radiogroup" aria-label="답변 방식">
        <button role="radio" aria-checked="${!settings.video}" class="${!settings.video ? 'on' : ''}" data-act="video-mode" data-v="0">목소리만</button>
        <button role="radio" aria-checked="${settings.video}" class="${settings.video ? 'on' : ''}" data-act="video-mode" data-v="1">영상 녹화</button>
      </div>
      <p class="muted small">${settings.video ? '실제 화상 면접처럼 내 모습을 보며 답합니다. 시선, 억양, 템포 분석과 영상 저장이 추가됩니다. 휴대폰을 눈높이에 세워 두면 좋아요.' : '카메라 없이 목소리로만 연습합니다. 부담 없이 시작하기 좋아요.'}</p>
    </section>` : ''}
    <details class="card settings gem" ${hasGemini() ? '' : ''}>
      <summary>AI 피드백·꼬리질문 (내 Gemini 키) ${hasGemini() ? '<span class="pill ok">연결됨</span>' : '<span class="pill">선택</span>'}</summary>
      ${keyPanel()}
    </details>
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
    <section class="card mine-set">
      <h2>내 자료로 예상 질문 만들기</h2>
      <p class="muted small">자기소개서, 경력기술서, 포트폴리오, 경험노트 파일을 첨부하거나 붙여 넣으면 지원 직무에서 검증할 역량을 뽑고, 역량별 예상 질문과 핵심 답변 스크립트를 만들어 드려요. 내 Gemini API 키가 필요합니다.</p>
      <button class="btn primary wide" data-act="${qset ? 'qset' : 'material'}">${qset ? `나의 예상 질문집 보기 (${qset.questions.length}개)` : '자료 넣고 질문 만들기'}</button>
    </section>
    ${qset ? `<h2 class="group">내 자료 기반 질문 · ${esc(qset.job)}</h2>
      <ul class="qlist">${qset.questions.map((q, i) => `<li><button data-act="choose" data-id="${q.id}"><span class="qn">${i + 1}</span>${esc(q.text)}</button></li>`).join('')}</ul>` : ''}
    <section class="card ask-custom">
      <h2>연습하고 싶은 질문이 있나요?</h2>
      <p class="muted small">지원하는 회사에서 나올 것 같은 질문, 받기 두려운 질문을 직접 넣어 보세요. 이 휴대폰에만 저장됩니다.</p>
      <textarea id="customText" rows="2" maxlength="150" placeholder="예: 고객 불만을 해결한 경험을 말해 주세요"></textarea>
      <button class="btn primary wide" data-act="add-custom">내 질문 추가하고 바로 연습</button>
    </section>
    ${custom.length ? `<h2 class="group">내가 추가한 질문</h2>
      <ul class="qlist">${custom.map(q => `<li class="mine"><button data-act="choose" data-id="${q.id}"><span class="qn">내</span>${esc(q.text)}</button><button class="del" data-act="del-custom" data-id="${q.id}" aria-label="이 질문 지우기">지우기</button></li>`).join('')}</ul>` : ''}
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
  const f = state.follow;
  const hint = !f && q.keywords && q.keywords.length
    ? `<details class="card hint"><summary>막히면 키워드 보기</summary><p class="kw">${q.keywords.map(k => `<span>${esc(k)}</span>`).join('')}</p>${q.numbers && q.numbers.length ? `<p class="muted small">넣을 숫자: ${q.numbers.map(esc).join(' / ')}</p>` : ''}</details>` : '';
  return `${header(f ? '꼬리질문' : round === 1 ? '첫 번째 답변' : `${round}번째 답변`)}
  <main class="wrap">
    <section class="question">
      <p class="qcat">${f ? '꼬리질문' : `${esc(q.cat)} 질문`}</p>
      <h1 id="qtext">${esc(f ? f.text : q.text)}</h1>
      <button class="btn ghost sm" data-act="listen">질문 다시 듣기</button>
    </section>
    ${f ? `<div class="notice focus"><b>면접관이 더 듣고 싶은 것</b>${esc(f.missing)}</div>`
      : round > 1 ? `<div class="notice focus"><b>이번에 고칠 한 가지</b>${esc(state.attempts[state.attempts.length - 1].result.next_fix)}</div>`
      : `<p class="tip">${esc(q.must_evidence ? '이 질문에서 확인하는 것: ' + q.must_evidence : q.tip)}</p>`}
    ${hint}
    <section class="stage" id="stage">
      ${settings.video && !settings.textMode ? '<div class="cam" id="camWrap"><video id="cam" playsinline muted autoplay></video><span class="cam-tip" id="camTip">카메라를 켜는 중...</span></div>' : ''}
      <div class="timer" id="timer" aria-live="polite"><span class="tlabel">준비</span><span class="tnum">${f ? FOLLOW_PREP_SEC : PREP_SEC}</span></div>
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
  let left = state.follow ? FOLLOW_PREP_SEC : PREP_SEC;
  let startedAt = 0;
  let rec = null;
  let tick = null;
  const cam = document.getElementById('cam');
  let camStream = null;
  let recorder = null;
  let audioA = null;
  let gaze = null;
  if (cam) {
    const tip = document.getElementById('camTip');
    openCamera().then(stream => {
      if (phase === 'done') { stopStream(stream); return; }
      camStream = stream;
      cam.srcObject = stream;
      tip.textContent = '화면 속 얼굴 말고 카메라 렌즈를 봐 주세요';
      loadGazeModel().catch(() => {}); // 준비 시간 동안 시선 분석 모델을 미리 불러 둔다
      if (phase === 'answer') startCapture();
    }).catch(() => {
      toast('카메라를 켜지 못해 목소리로만 진행합니다. 브라우저에서 카메라 권한을 확인해 주세요.');
      document.getElementById('camWrap').hidden = true;
    });
  }
  function startCapture() {
    if (!camStream || recorder) return;
    try { recorder = startRecorder(camStream); } catch { toast('이 브라우저에서는 녹화를 시작하지 못했어요.'); }
    audioA = startAudioAnalysis(camStream);
    gaze = startGaze(cam);
    document.getElementById('camTip').innerHTML = '<span class="rec-dot" aria-hidden="true"></span>녹화 중';
  }

  const setTimer = (label, n, warn) => {
    timerEl.innerHTML = `<span class="tlabel">${label}</span><span class="tnum">${n}</span>`;
    timerEl.classList.toggle('warn', Boolean(warn));
  };

  speak(state.follow ? state.follow.text : q.text);
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
    startCapture();
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

  async function finish() {
    if (phase === 'done') return;
    if (phase === 'prep') { beginAnswer(); return; }
    phase = 'done';
    clearInterval(tick);
    const durationSec = Math.min(settings.limit, (Date.now() - startedAt) / 1000);
    let text = typed.value.trim();
    if (rec) text = join(rec.stop(), text);
    state.draft = { answer: text, rawAnswer: text, durationSec, typed: settings.textMode || !typed.hidden };
    if (recorder || audioA || gaze) {
      btn.disabled = true;
      btn.textContent = '영상 정리 중...';
      state.draft.audio = audioA ? audioA.stop() : null;
      state.draft.gaze = gaze ? gaze.stop() : null;
      if (recorder) { try { state.draft.video = await recorder.stop(); } catch { state.draft.video = null; } }
    }
    stopStream(camStream);
    camStream = null;
    // 인식 마지막 조각이 늦게 도착하는 경우가 있어 잠깐 기다린다.
    setTimeout(() => { if (rec) state.draft.answer = state.draft.rawAnswer = join(rec.text(), typed.value.trim()); go('review'); }, rec ? 600 : 0);
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (btn.dataset.act === 'answer-now') beginAnswer();
    else finish();
  });
  cleanup.push(() => {
    clearInterval(tick);
    if (phase !== 'done') {
      if (rec) rec.stop();
      if (recorder) recorder.stop();
      if (audioA) audioA.stop();
      if (gaze) gaze.stop();
      phase = 'done';
    }
    stopStream(camStream);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  });
}

// ---------- 화면: 답변 확인 ----------
function reviewView() {
  const d = state.draft;
  const empty = !d.answer;
  const willFollow = !state.follow && hasGemini();
  return `${header(state.follow ? '꼬리질문 답변 확인' : '답변 확인')}
  <main class="wrap">
    <section class="card">
      <h2>${state.follow ? '꼬리질문에 이렇게 답하셨어요' : '이렇게 답하셨어요'}</h2>
      <p class="muted">${d.typed ? '' : '음성 인식이 잘못 받아 적은 낱말만 고쳐 주세요. 내용을 새로 쓰면 실제 말하기와 달라집니다. '}답변 시간 ${Math.round(d.durationSec)}초</p>
      <textarea id="answer" rows="9">${esc(d.answer)}</textarea>
      ${empty ? '<p class="warn-text">인식된 답변이 없어요. 다시 답하거나 글로 써 주세요.</p>' : ''}
    </section>
    <button class="btn primary big" data-act="evaluate">${willFollow ? '다음: 꼬리질문 받기' : '피드백 받기'}</button>
    ${willFollow ? '<button class="btn ghost wide" data-act="evaluate-skip">꼬리질문 없이 피드백 받기</button>' : ''}
    <button class="btn ghost wide" data-act="redo">이 답변 버리고 다시 답하기</button>
  </main>`;
}

function showLoading(step, text) {
  cleanup.forEach(fn => fn());
  cleanup = [];
  state.screen = 'loading';
  app.innerHTML = `${header(step)}<main class="wrap"><div class="loading"><div class="spinner" aria-hidden="true"></div><p>${esc(text)}</p></div></main>`;
  window.scrollTo(0, 0);
}

async function evaluate(skipFollow) {
  const answer = document.getElementById('answer').value.trim();
  if (answer.length < 5) { toast('답변이 너무 짧아요. 조금 더 말하거나 써 주세요.'); return; }
  const d = state.draft;
  // 지표는 사용자가 고치기 전 원문 기준(군말 수가 지워지지 않도록), 글로 쓴 답은 속도를 보지 않는다.
  const metrics = measure(d.typed ? answer : d.rawAnswer || answer, d.durationSec);
  metrics.typed = d.typed;
  const q = state.question;

  // 꼬리질문 답변이면 본질문 답변과 합쳐 평가한다.
  if (state.follow) {
    const f = state.follow;
    state.follow = null;
    const follow = { text: f.text, missing: f.missing, answer, metrics };
    if (d.video && d.video.blob.size) follow.video = { ...d.video, url: URL.createObjectURL(d.video.blob) };
    state.draft = null;
    return finalize(f.main, follow);
  }

  const main = { answer, metrics, d };
  state.draft = null;
  if (hasGemini() && !skipFollow) {
    showLoading('꼬리질문 고르는 중', '답변을 듣고 면접관이 더 확인하고 싶은 부분을 찾고 있어요.');
    try {
      const fu = await gem.pickFollowup(q, answer);
      if (fu && fu.followup) {
        state.follow = { text: fu.followup, missing: fu.missing || '', main };
        go('ask');
        return;
      }
    } catch (err) {
      toast(`꼬리질문을 만들지 못해 바로 피드백으로 넘어가요. (${err.cause || err.message})`);
    }
  }
  return finalize(main, null);
}

async function finalize(main, follow) {
  const { answer, metrics, d } = main;
  const q = state.question;
  showLoading('피드백 만드는 중', '답변을 커리어캐쳐 기준으로 살펴보고 있어요.');
  const prev = state.attempts[state.attempts.length - 1];
  let result = null;
  if (hasGemini()) {
    try {
      const r = await gem.evaluateAnswer({ q, answer, follow, previous: prev ? { answer: prev.answer, next_fix: prev.result.next_fix } : null });
      result = { ...r, source: 'ai' };
    } catch (err) {
      toast(`Gemini 평가에 실패해 자동 피드백으로 보여 드려요. (${err.cause || err.message}) 자세한 원인은 처음 화면의 연결 점검에서 볼 수 있어요.`);
    }
  }
  if (!result && settings.relay) {
    try {
      result = await remoteEvaluate({ answer, metrics, prev });
    } catch (err) {
      toast(`AI 평가 서버에 연결하지 못해 간이 피드백으로 보여 드려요. (${err.message})`);
    }
  }
  if (!result) result = localEvaluate({ answer, metrics, limitSec: settings.limit });
  // 옛 형식(중계 서버) 결과를 새 기준 항목으로 옮긴다.
  if (result.scores.lead != null) {
    const o = result.scores;
    const or = result.reasons || {};
    result.scores = { specific: Math.round((o.structure + o.specificity) / 2), jobfit: o.jobfit, logic: o.lead };
    result.reasons = { specific: [or.structure, or.specificity].filter(Boolean).join(', '), jobfit: or.jobfit, logic: or.lead };
  }
  // 전달 항목은 AI 연결 여부와 관계없이 같은 규칙으로 계산한다.
  const voice = voiceScore(metrics, d.audio);
  result.scores.voice = voice.score;
  result.reasons.voice = voice.reason;
  const attempt = { answer, metrics, result };
  if (follow) attempt.follow = follow;
  const tips = [...voice.tips];
  if (d.video || d.audio || d.gaze) {
    const nv = scoreNonverbal({ gaze: d.gaze, audio: d.audio });
    result.scores.nonverbal = nv.nonverbal.score;
    result.reasons.nonverbal = nv.nonverbal.reason;
    result.scores.env = nv.env.score;
    result.reasons.env = nv.env.reason;
    tips.push(...nv.tips);
    attempt.nv = { observed: nv.observed, tips };
    if (d.video && d.video.blob.size) attempt.video = { ...d.video, url: URL.createObjectURL(d.video.blob) };
  } else {
    result.scores.nonverbal = null;
    result.reasons.nonverbal = '영상 녹화를 켜면 측정합니다';
    result.scores.env = null;
    result.reasons.env = '영상 녹화를 켜면 측정합니다';
    if (tips.length) attempt.nv = { observed: [], tips };
  }
  result.total = totalScore(result.scores);
  state.attempts.push(attempt);
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
function scoreBars(scores, reasons, prevScores, items = RUBRIC) {
  let group = '';
  return `<ul class="scores">${items.map(r => {
    const v = scores[r.key];
    const p = prevScores ? prevScores[r.key] : null;
    const diff = v != null && p != null ? Math.round((v - p) * 10) / 10 : null;
    const head = r.group && r.group !== group ? `<li class="grp">${r.group === '내용' ? '답변 내용 (주요 평가)' : '전달력 (코칭 지표)'}</li>` : '';
    group = r.group || group;
    return `${head}<li>
      <div class="sl"><b>${r.label}${r.weight ? ` <small class="muted">${r.weight}%</small>` : ''}</b><span class="muted">${esc(reasons[r.key] || r.looks)}</span></div>
      <div class="sv">${v == null ? '<span class="muted">-</span>' : `<span class="bar" style="--v:${v}"><i></i></span><span class="num">${v}</span>`}${diff ? `<span class="diff ${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '+' : ''}${diff}</span>` : ''}</div>
    </li>`;
  }).join('')}</ul>`;
}

function totalCard(t, prevT) {
  if (!t || t.total == null) return '';
  const diff = prevT && prevT.total != null ? Math.round((t.total - prevT.total) * 10) / 10 : null;
  return `<section class="total">
    <div><p class="eyebrow">총점</p><p class="tnum2">${t.total.toFixed(1)}<small>점</small>${diff ? `<span class="diff ${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '+' : ''}${diff}</span>` : ''}</p><p class="muted small">100점 만점</p></div>
    <p class="muted small">${t.missing.length ? `${t.missing.join(', ')}은(는) 측정하지 않아 나머지 항목(가중치 합 ${t.measuredWeight}%)으로 환산했습니다.` : '여섯 항목을 가중치대로 합산했습니다.'} 연습용 참고치입니다.</p>
  </section>`;
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
      ${r.probe && !a.follow ? `<h3>추천 꼬리질문</h3><p>${esc(r.probe)}</p><p class="muted small">면접관이라면 이렇게 더 물을 수 있어요. 이 질문에 답할 내용을 다음 답변에 미리 넣어 보세요.</p>` : ''}
      <p class="muted small">[ ] 표시는 본인의 실제 경험으로 채워 주세요. 하지 않은 일을 지어내지 않도록 비워 두었습니다.</p>
    </section>`;
}

// 질문별 평가 기준(이 질문의 핵심)을 충족했는지
function criteriaSection(a) {
  const list = a.result.criteria_results;
  if (!list || !list.length) return '';
  return `<section class="card crit">
    <h3>이 질문의 핵심 <small class="muted">평가 기준별 확인</small></h3>
    <ul>${list.map(c => `<li><span class="lv lv-${c.level === '충족' ? 'ok' : c.level === '부분' ? 'mid' : 'no'}">${esc(c.level)}</span><div><b>${esc(c.criterion)}</b><p class="muted small">${esc(c.comment)}</p></div></li>`).join('')}</ul>
  </section>`;
}

// 정량·성과 보완: 답변에 나온 숫자와 덧붙일 숫자
function numbersSection(a) {
  const found = a.result.numbers_found || [];
  const add = a.result.numbers_to_add || [];
  if (!found.length && !add.length) return '';
  return `<section class="card nums-fb">
    <h3>숫자로 보완하기 <small class="muted">성과는 숫자와 전후 비교로</small></h3>
    <p class="small"><b>답변에 나온 숫자</b> ${found.length ? found.map(n => `<span class="tag">${esc(n)}</span>`).join(' ') : '<span class="muted">없음. 결과를 숫자로 말해 보세요.</span>'}</p>
    ${add.length ? `<p class="small"><b>덧붙이면 좋은 숫자</b></p><ul>${add.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    <p class="muted small">기억나는 실제 값만 쓰세요. 정확하지 않으면 "약", "이상"을 붙여 말해도 됩니다.</p>
  </section>`;
}

function followSection(a) {
  const f = a.follow;
  if (!f) return '';
  const qi = state.log.findIndex(x => x.attempts.includes(a));
  const ai = qi >= 0 ? state.log[qi].attempts.indexOf(a) : -1;
  return `<section class="card follow">
    <h3>꼬리질문</h3>
    <p><b>${esc(f.text)}</b></p>
    <p class="muted small">확인하려던 것: ${esc(f.missing)}</p>
    <p class="answer">${esc(f.answer)}</p>
    ${f.video ? `<div class="vid"><video src="${f.video.url}" controls playsinline preload="metadata"></video><button class="btn ghost wide no-print" data-act="save-video" data-q="${qi}" data-a="${ai}" data-f="1">꼬리질문 영상 저장</button></div>` : ''}
  </section>`;
}

function disclaimer(a) {
  return `<p class="disclaimer">${a.result.source === 'ai' ? 'AI 피드백' : '자동 피드백(답변 속 표현을 정해진 규칙으로 살펴본 결과로, 내용의 깊이까지는 판단하지 못할 수 있습니다)'}입니다. ${NOTICE} 음성 인식은 "음, 어" 같은 군말을 빠뜨리기도 합니다.</p>`;
}

function reportView() {
  const a = state.attempts[state.attempts.length - 1];
  return `${header('피드백')}
  <main class="wrap">
    <p class="qsmall">${esc(state.question.text)}</p>
    ${totalCard(a.result.total)}
    ${feedbackBody(a)}
    <section class="card"><h3>항목별 점수 <small class="muted">각 5점, 괄호는 가중치</small></h3>${scoreBars(a.result.scores, a.result.reasons)}</section>
    ${criteriaSection(a)}
    ${numbersSection(a)}
    ${followSection(a)}
    <section class="card"><h3>말하기 지표</h3>${metricsRow(a.metrics)}</section>
    ${nvSection(a)}
    ${scoreGuide(a)}
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
  const tot = a => (a.result.total && a.result.total.total != null ? a.result.total.total : 0);
  const delta = Math.round((tot(last) - tot(first)) * 10) / 10;
  return `${header('전후 비교')}
  <main class="wrap">
    <p class="qsmall">${esc(state.question.text)}</p>
    <section class="hero small">
      <h1>${delta > 0 ? `처음보다 ${delta}점 올랐어요.` : delta === 0 ? '점수는 같지만, 달라진 문장을 확인해 보세요.' : '이번엔 점수가 내려갔어요. 괜찮습니다.'}</h1>
      ${last.result.comparison ? `<p>${esc(last.result.comparison)}</p>` : ''}
    </section>
    ${totalCard(last.result.total, first.result.total)}
    <section class="card"><h3>항목별 변화 <small class="muted">${state.attempts.length > 2 ? '첫 답변 대비' : ''}</small></h3>${scoreBars(last.result.scores, last.result.reasons, first.result.scores)}</section>
    <section class="compare">
      <div class="card"><h3>처음 답변</h3>${metricsRow(first.metrics)}<p class="answer">${esc(first.answer)}</p></div>
      <div class="card"><h3>${state.attempts.length > 2 ? '이번' : '다시 한'} 답변</h3>${metricsRow(last.metrics)}<p class="answer">${esc(last.answer)}</p></div>
    </section>
    ${feedbackBody(last)}
    ${criteriaSection(last)}
    ${numbersSection(last)}
    ${followSection(last)}
    ${nvSection(last)}
    ${scoreGuide(last)}
    <button class="btn primary big" data-act="pick">다른 질문 연습하기</button>
    <button class="btn ghost wide" data-act="retry">같은 질문 한 번 더</button>
    ${savePanel()}
    ${disclaimer(last)}
  </main>`;
}

// 참여자가 점수의 근거를 직접 볼 수 있게 평가 기준과 근거 자료를 보여 준다.
function scoreGuide(a) {
  const ai = a && a.result.source === 'ai';
  const refRow = k => { const r = REFS[k]; return `<li><b>[${r.grade}]</b> ${esc(r.cite)} <span class="muted">${esc(r.use)}</span> <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="no-print">원문</a></li>`; };
  return `<details class="card guide print-open">
    <summary>평가 기준과 근거</summary>
    <p class="small">답변 내용의 구체성과 직무역량 입증을 주요 평가항목으로 두고, 목소리·시선·움직임은 전달력을 고치기 위한 코칭 지표로 따로 봅니다. 각 항목 1~5점에 가중치를 곱해 100점 만점으로 계산합니다.</p>
    <table class="rubric"><thead><tr><th>항목(가중치)</th><th>보는 것</th><th>주의점</th><th>근거</th></tr></thead><tbody>
      ${RUBRIC.map(r => `<tr><td><b>${r.label}</b><br>${r.weight}%</td><td>${esc(r.looks)}${r.anchors ? `<br><span class="muted">5점: ${esc(r.anchors[5])}<br>3점: ${esc(r.anchors[3])}<br>1점: ${esc(r.anchors[1])}</span>` : ''}</td><td>${esc(r.caution)}</td><td>${r.basis}</td></tr>`).join('')}
    </tbody></table>
    <h3 class="guide-h">점수를 매기는 방법</h3>
    <ul class="plain small">
      <li><b>답변 내용 3항목</b>: ${ai ? 'AI(Gemini)가 위 5점·3점·1점 기준을 보고 매기고 이유를 적습니다.' : '답변에 나온 표현을 정해진 규칙으로 세어 계산합니다(AI 미연결). 내용의 깊이까지는 판단하지 못하므로 방향을 잡는 참고로 봐 주세요. Gemini 키를 연결하면 기준표에 따라 평가합니다.'}</li>
      <li><b>음성 전달력</b>: 5점에서 깎습니다. 말 속도가 분당 200음절보다 느리거나 420음절보다 빠르면 1~2점, 2.5초 넘는 침묵이 잦으면 1~2점, "음, 어"가 1분에 8번을 넘으면 1점, 억양 변화가 거의 없어 강조가 안 되면 1점. 목소리 높낮이, 답변 길이는 보지 않습니다.</li>
      <li><b>비언어적 전달력</b>(영상 녹화 시): 좌우로 벗어난 시선의 비율로 매깁니다(10% 미만 5점, 20% 미만 4점, 35% 미만 3점, 50% 미만 2점). 위아래 시선은 감점하지 않습니다. 반복적인 큰 움직임이나 화면 이탈이 잦으면 1점. 표정은 측정하지 않습니다.</li>
      <li><b>영상 환경</b>(영상 녹화 시): 5점에서 깎습니다. 얼굴이 화면에 안 보인 시간, 어두운 화면, 작게 녹음된 목소리, 큰 주변 소음.</li>
    </ul>
    <h3 class="guide-h">하지 않는 판단</h3>
    <ul class="plain small">
      <li>시선 이탈을 거짓말이나 부정행위로 해석하지 않습니다.</li>
      <li>낮은 목소리, 억양, 방언, 말더듬을 역량 부족으로 보지 않습니다.</li>
      <li>웃는 횟수나 움직임으로 성격, 태도, 불안을 판단하지 않습니다.</li>
      <li>"AI면접 점수가 떨어진다"고 단정하지 않습니다. AI면접 시스템마다 평가방식이 다르고, 표정·몸짓·목소리 톤을 채점하지 않는다고 밝힌 운영사도 있습니다.</li>
    </ul>
    <h3 class="guide-h">근거 자료</h3>
    <p class="muted small">근거 등급 A: ${BASIS.A} / B: ${BASIS.B} / C: ${BASIS.C}</p>
    <ul class="refs small">${Object.keys(REFS).map(refRow).join('')}</ul>
    <p class="muted small">${NOTICE}</p>
  </details>`;
}

function videoBlock(a, qi, ai) {
  if (!a.video) return '';
  return `<div class="vid no-print">
    <video src="${a.video.url}" controls playsinline preload="metadata"></video>
    <button class="btn ghost wide no-print" data-act="save-video" data-q="${qi}" data-a="${ai}">이 영상 내 휴대폰에 저장</button>
  </div>`;
}

// 전달력 코칭: 관찰한 내용과 고칠 점. 점수는 항목별 점수표에 들어 있다.
function nvSection(a) {
  if (!a.nv && !a.video) return '';
  const qi = state.log.findIndex(x => x.attempts.includes(a));
  const ai = qi >= 0 ? state.log[qi].attempts.indexOf(a) : -1;
  const nv = a.nv || { observed: [], tips: [] };
  return `<section class="card nv">
    <h3>전달력 코칭 <small class="muted">목소리·시선·움직임</small></h3>
    ${nv.observed.length ? `<ul class="plain small">${nv.observed.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${nv.tips.length ? `<ul class="tips">${nv.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="small">전달을 방해하는 요소는 보이지 않았어요.</p>'}
    ${videoBlock(a, qi, ai)}
    <p class="muted small">전달력 지표는 영상에서 내용이 잘 전달되는지를 보는 코칭용 관찰입니다. 성격이나 역량을 뜻하지 않습니다.${a.video ? ' 영상과 분석은 이 휴대폰 안에서만 처리됐어요.' : ''}</p>
  </section>`;
}

// ---------- 저장 ----------
function savePanel() {
  const n = state.log.length;
  return `<section class="card save no-print">
    <h3>피드백 리포트 받기</h3>
    <p class="muted small">화면을 닫으면 기록이 사라져요. 오늘 연습한 질문 ${n}개의 종합 평가, 항목별 점수, 질문별 피드백, 평가 기준과 근거가 담깁니다.</p>
    <div class="savebtns">
      <button class="btn primary" data-act="save-mail">이메일로 리포트 받기</button>
      <button class="btn ghost" data-act="save-html">리포트 파일로 내려받기</button>
      <button class="btn ghost" data-act="save-pdf">PDF로 저장(인쇄)</button>
      <button class="btn ghost" data-act="save-image">이미지로 저장</button>
      <button class="btn ghost" data-act="save-text">글로 복사</button>
    </div>
    <p class="muted small">리포트 파일은 인터넷 없이도 열리는 한 장짜리 문서(HTML)예요. 휴대폰의 다운로드 폴더에 저장되고, 열어서 인쇄하거나 강사에게 보낼 수 있습니다.</p>
    <label class="field">받을 이메일<input id="mailTo" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" value="${esc(email)}"></label>
    ${state.screen !== 'records' ? '<button class="linkbtn" data-act="records">피드백 리포트 미리 보기</button>' : ''}
  </section>`;
}

// 질문별 마지막 답변을 모아 항목별 평균과 가중 총점을 낸다.
function overall(log) {
  const avg = {};
  for (const r of RUBRIC) {
    const vals = log.map(x => x.attempts[x.attempts.length - 1].result.scores[r.key]).filter(v => v != null);
    avg[r.key] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  }
  const measured = RUBRIC.filter(r => avg[r.key] != null);
  const content = measured.filter(r => r.group === '내용');
  const pick = (list, fn) => (list.length ? list.reduce((a, b) => (fn(avg[b.key], avg[a.key]) ? b : a)) : null);
  return {
    avg,
    total: totalScore(avg),
    best: pick(measured, (x, y) => x > y),
    worst: pick(content.length ? content : measured, (x, y) => x < y),
    tasks: [...new Set(log.map(x => x.attempts[x.attempts.length - 1].result.next_fix).filter(Boolean))].slice(0, 5),
    ai: log.some(x => x.attempts[x.attempts.length - 1].result.source === 'ai'),
  };
}

function reportBody() {
  const d = new Date();
  const o = overall(state.log);
  const avgReasons = Object.fromEntries(RUBRIC.map(r => [r.key, o.avg[r.key] == null ? '측정하지 않음' : `질문 ${state.log.length}개 평균 · ${r.looks}`]));
  return `<section class="hero small">
      <p class="eyebrow">커리어캐쳐 면접 리허설</p>
      <h1>면접 피드백 리포트 <small class="muted">${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}</small></h1>
      <p>연습한 질문 ${state.log.length}개 · ${o.ai ? 'AI(Gemini) 평가' : '자동 평가(AI 미연결, 표현 규칙 기반)'}${qset ? ` · 지원 직무: ${esc(qset.job)}` : ''}</p>
    </section>
    ${totalCard(o.total)}
    <section class="card">
      <h3>항목별 평균 <small class="muted">각 5점</small></h3>
      ${scoreBars(o.avg, avgReasons)}
      ${o.best ? `<p class="small"><b>가장 잘한 항목</b> ${o.best.label}(${o.avg[o.best.key]}점)</p>` : ''}
      ${o.worst ? `<p class="small"><b>먼저 보완할 항목</b> ${o.worst.label}(${o.avg[o.worst.key]}점): ${esc(o.worst.looks)}</p>` : ''}
    </section>
    ${o.tasks.length ? `<section class="card"><h3>다음 연습 과제</h3><ol class="tasks">${o.tasks.map(t => `<li>${esc(t)}</li>`).join('')}</ol></section>` : ''}
    ${state.log.map((item, i) => {
      const first = item.attempts[0];
      const last = item.attempts[item.attempts.length - 1];
      const r = last.result;
      return `<article class="card rec">
        <p class="eyebrow">질문 ${i + 1} · 답변 ${item.attempts.length}번${r.total && r.total.total != null ? ` · ${r.total.total.toFixed(1)}점` : ''}</p>
        <h2>${esc(item.question.text)}</h2>
        <div class="nextfix"><p class="eyebrow">다음에 고칠 한 가지</p><p class="big">${esc(r.next_fix)}</p></div>
        ${scoreBars(r.scores, r.reasons, item.attempts.length > 1 ? first.result.scores : null)}
        <div class="fb">
          <h3>잘한 점</h3><p>${esc(r.strength)}</p>
          <h3>고칠 점</h3><p>${esc(r.improvement)}</p>
          <h3>이렇게 바꿔 말해 보세요</h3><blockquote>${esc(r.rewrite_example)}</blockquote>
          ${r.probe ? `<h3>추천 꼬리질문</h3><p>${esc(r.probe)}</p>` : ''}
          ${r.numbers_to_add && r.numbers_to_add.length ? `<h3>숫자로 보완하기</h3><ul class="critlist">${r.numbers_to_add.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
          <h3>마지막 답변</h3><p class="answer">${esc(last.answer)}</p>
        </div>
        ${r.criteria_results && r.criteria_results.length ? `<div class="nv-rec"><h3>이 질문의 핵심</h3><ul class="critlist">${r.criteria_results.map(c => `<li><b>${esc(c.level)}</b> ${esc(c.criterion)} <span class="muted">${esc(c.comment)}</span></li>`).join('')}</ul></div>` : ''}
        ${last.follow ? `<div class="nv-rec"><h3>꼬리질문</h3><p><b>${esc(last.follow.text)}</b></p><p class="answer">${esc(last.follow.answer)}</p></div>` : ''}
        ${last.nv && (last.nv.tips.length || last.nv.observed.length) ? `<div class="nv-rec"><h3>전달력 코칭</h3><ul class="critlist">${[...last.nv.observed, ...last.nv.tips].map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
        ${item.attempts.some(x => x.video) ? `<div class="vids no-print"><h3>녹화한 영상</h3>${item.attempts.map((x, ai) => x.video ? `<p class="muted small">${ai + 1}번째 답변</p>${videoBlock(x, i, ai)}` : '').join('')}</div>` : ''}
      </article>`;
    }).join('')}
    ${scoreGuide(state.log[0].attempts[0])}
    <p class="disclaimer">[ ] 표시는 본인의 실제 경험으로 채워 주세요. 점수는 연습용 참고치이며 합격을 예측하지 않습니다. eunkyoungan.github.io/-/interview</p>`;
}

function recordsView() {
  if (!state.log.length) return `${header('피드백 리포트')}<main class="wrap"><p class="muted">아직 연습한 질문이 없어요.</p><button class="btn primary big" data-act="pick">질문 고르기</button></main>`;
  return `${header('피드백 리포트')}
  <main class="wrap records">
    ${savePanel()}
    <div id="report">${reportBody()}</div>
    <button class="btn primary big no-print" data-act="pick">다른 질문 연습하기</button>
  </main>`;
}

// 리포트를 혼자서도 열리는 HTML 파일 하나로 만든다(스타일 포함, 영상·버튼 제외).
async function downloadReport() {
  let css = '';
  try { css = await (await fetch('style.css')).text(); } catch { /* 스타일 없이도 읽을 수 있다 */ }
  const holder = document.createElement('div');
  holder.innerHTML = reportBody();
  holder.querySelectorAll('.no-print, video, button').forEach(n => n.remove());
  holder.querySelectorAll('details').forEach(n => { n.open = true; });
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>면접 피드백 리포트</title><style>${css}\nbody{padding:8px 0 40px}.wrap{max-width:820px}</style></head><body><main class="wrap records">${holder.innerHTML}</main></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName('html').replace('interview-', 'interview-report-');
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function doSave(act) {
  if (!state.log.length) { toast('먼저 질문 하나를 연습해 주세요.'); return; }
  if (act === 'save-mail') {
    await sendReportMail();
  } else if (act === 'save-html') {
    await downloadReport();
    state.saved = true;
    toast('리포트 파일을 내려받았어요. 다운로드 폴더에서 열어 보세요.');
  } else if (act === 'save-text') {
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

// ---------- 이메일로 리포트 보내기 ----------
function saveEmailField(silent) {
  const el = document.getElementById('email');
  if (!el) return true;
  const v = el.value.trim();
  if (v && !EMAIL_RE.test(v)) { if (!silent) { toast('이메일 주소를 확인해 주세요. 비워 두고 시작해도 됩니다.'); el.focus(); } return false; }
  email = v;
  store.set('email', email);
  return true;
}

// 메일 발송 주소: 저장소 루트의 mail-config.json (기존 커리어캐쳐 메일 발송 웹앱과 같이 쓴다)
async function mailEndpoint() {
  try {
    const res = await fetch('../mail-config.json', { cache: 'no-store' });
    if (!res.ok) return '';
    const url = String((await res.json()).mailEndpoint || '').trim();
    return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url) ? url : '';
  } catch { return ''; }
}

async function sendReportMail() {
  const el = document.getElementById('mailTo');
  const to = (el ? el.value : email).trim();
  if (!EMAIL_RE.test(to)) { toast('받을 이메일 주소를 써 주세요.'); if (el) el.focus(); return; }
  email = to;
  store.set('email', email);
  const subject = `면접 피드백 리포트 ${new Date().toLocaleDateString('ko-KR')}`;
  const body = buildText(state.log);
  const endpoint = await mailEndpoint();
  if (endpoint) {
    if (!confirm(`${to} 주소로 피드백 리포트를 보낼까요?\n리포트 글(질문, 내 답변, 피드백)이 커리어캐쳐 메일 발송 서비스(Google)를 거쳐 전송됩니다. 영상은 보내지 않아요.`)) return;
    toast('리포트를 보내는 중이에요...');
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ to, subject, body: body.slice(0, 58000) }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || '메일 발송에 실패했어요.');
      state.saved = true;
      toast(`${to}(으)로 리포트를 보냈어요. 안 보이면 스팸함도 확인해 주세요.`);
      return;
    } catch (err) {
      toast(`${err.message || '메일 서버에 연결하지 못했어요.'} 대신 내 메일 앱으로 보낼 수 있게 열어 드려요.`);
    }
  }
  // 발송 서비스가 설정되지 않았거나 실패하면, 참여자 휴대폰의 메일 앱을 리포트가 채워진 상태로 연다.
  // 메일 앱 주소 길이 제한 때문에 길면 요약만 넣고 전체는 복사해 둔다.
  const short = body.length > 1500 ? body.slice(0, 1500) + '\n\n(내용이 길어 일부만 넣었어요. 전체 리포트는 복사되어 있으니 여기에 붙여 넣어 주세요.)' : body;
  try { await navigator.clipboard.writeText(body); } catch { /* 복사 실패는 무시 */ }
  state.saved = true;
  location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent('[커리어캐쳐] ' + subject)}&body=${encodeURIComponent(short)}`;
  toast('메일 앱이 열리면 "보내기"를 눌러 주세요. 전체 리포트는 복사해 두었어요.');
}

// ---------- 화면: 이용 방법(설명서) ----------
function guideView() {
  return `${header('이용 방법')}
  <main class="wrap guidepage">
    <section class="hero small">
      <h1>면접 리허설 이용 방법</h1>
      <p>질문을 듣고 답한 뒤, 평가 기준에 따른 피드백을 받고 다시 답해 보는 연습 도구예요. 회원가입 없이 무료로 씁니다.</p>
    </section>
    <section class="card">
      <h2>한눈에 보는 순서</h2>
      <ol class="steps">
        <li><b>준비</b>: 이메일(선택)을 쓰고, 답변 시간(60초·90초)과 답변 방식(목소리만·영상 녹화)을 고릅니다.</li>
        <li><b>질문 고르기</b>: 공통 질문 20개, 내가 추가한 질문, 내 자료로 만든 예상 질문 중에서 고릅니다.</li>
        <li><b>답하기</b>: 질문을 소리로 듣고 30초 준비한 뒤 말로 답합니다. 말한 내용이 글자로 나타나요.</li>
        <li><b>답변 확인</b>: 잘못 받아 적힌 낱말만 고칩니다.</li>
        <li><b>꼬리질문</b>(AI 키 연결 시): 부족한 근거를 묻는 질문에 한 번 더 답합니다.</li>
        <li><b>피드백</b>: 총점, 항목별 점수, 다음에 고칠 한 가지, 바꿔 말하기 예시를 봅니다.</li>
        <li><b>다시 답하기</b>: 한 가지를 고쳐 같은 질문에 다시 답하고 전후를 비교합니다.</li>
        <li><b>리포트 받기</b>: 이메일, 파일, PDF, 이미지로 피드백 리포트를 받습니다.</li>
      </ol>
    </section>
    <section class="card">
      <h2>시작 전 준비</h2>
      <ul class="plain">
        <li><b>브라우저</b>: 아이폰은 Safari, 안드로이드와 PC는 Chrome에서 열어 주세요. 카카오톡 안에서는 마이크가 막힐 수 있어요.</li>
        <li><b>마이크·카메라</b>: 처음 답할 때 "허용"을 눌러 주세요. 막혔다면 주소창 옆 자물쇠 아이콘에서 다시 허용할 수 있어요.</li>
        <li><b>장소</b>: 조용한 곳에서, 영상 녹화를 켠다면 휴대폰을 눈높이에 세워 주세요.</li>
        <li>말하기가 어려우면 <b>글로 답하기</b>를 켜고 연습할 수 있어요.</li>
      </ul>
    </section>
    <section class="card">
      <h2>세 가지 연습 방법</h2>
      <table class="errtable"><thead><tr><th>방법</th><th>필요한 것</th><th>되는 것</th></tr></thead><tbody>
        <tr><td>기본 연습</td><td>없음</td><td>공통 질문·내 질문으로 연습, 자동 피드백(답변 속 표현을 규칙으로 확인), 리포트</td></tr>
        <tr><td>AI 연습</td><td>내 Gemini API 키</td><td>답변을 읽고 하는 꼬리질문, 평가 기준표에 따른 AI 피드백</td></tr>
        <tr><td>내 자료 연습</td><td>내 Gemini API 키 + 자기소개서 등</td><td>내 자료로 예상 질문과 핵심 답변 스크립트 만들기</td></tr>
      </tbody></table>
      <p class="small">Gemini API 키는 무료로 3분이면 받을 수 있어요.</p>
      <a class="btn ghost wide" href="${KEY_URL}" target="_blank" rel="noopener noreferrer">Gemini API 키 받으러 가기</a>
      <p class="muted small">받는 순서는 첫 화면의 "AI 피드백·꼬리질문 (내 Gemini 키)" → "키 받는 방법"에 있어요.</p>
    </section>
    <section class="card">
      <h2>내 자료로 예상 질문 만들기</h2>
      <ol class="steps">
        <li>질문 고르기 화면 맨 위 <b>자료 넣고 질문 만들기</b>를 누릅니다.</li>
        <li>지원 직무를 쓰고, 자기소개서·경력기술서·포트폴리오·경험노트 파일을 첨부하거나 붙여 넣습니다. 한글(HWP·HWPX), 워드, PDF, 사진을 읽어요.</li>
        <li><b>예상 질문 바로 만들기</b>를 누르면 1분 안팎에 "나의 예상 질문집"이 만들어집니다.</li>
        <li>질문마다 의도, 평가 기준, 준비할 숫자, 키워드, 핵심 답변 스크립트가 있어요. 스크립트는 외우지 말고 키워드만 떠올리며 내 말로 답해 보세요.</li>
      </ol>
    </section>
    <section class="card">
      <h2>피드백 읽는 법</h2>
      <ul class="plain">
        <li><b>다음에 고칠 한 가지</b>가 가장 중요합니다. 점수보다 이것 하나를 다음 답변에 반영해 보세요.</li>
        <li><b>총점</b>은 6개 항목을 가중치로 합친 100점 만점 점수예요. 답변 내용(구체성, 직무역량 근거, 논리성)이 70%, 전달력(목소리, 시선·움직임, 영상 환경)이 30%입니다.</li>
        <li>영상 녹화를 켜지 않으면 시선·움직임과 영상 환경은 측정하지 않고, 나머지 항목으로 환산합니다.</li>
        <li><b>전달력</b>은 내용이 잘 전달되는지를 보는 코칭 지표예요. 낮은 목소리, 방언, 말더듬, 위아래 시선은 감점하지 않고, 성격이나 능력으로 해석하지 않습니다.</li>
        <li>점수는 연습용 참고치이며 합격을 예측하지 않습니다. 자세한 기준과 근거 자료는 피드백 화면의 "평가 기준과 근거"에 있어요.</li>
      </ul>
    </section>
    <section class="card">
      <h2>피드백 리포트 받기</h2>
      <ul class="plain">
        <li><b>이메일로 리포트 받기</b>: 처음에 쓴 주소로 리포트 글을 보냅니다. 바로 발송되지 않고 메일 앱이 열리면, 내용이 채워진 메일의 "보내기"를 눌러 주세요.</li>
        <li><b>리포트 파일로 내려받기</b>: 인터넷 없이도 열리는 문서 파일로 저장됩니다.</li>
        <li><b>PDF·이미지·글 복사</b>도 됩니다. 영상은 피드백 화면의 "이 영상 내 휴대폰에 저장"으로 따로 저장해요.</li>
        <li>화면을 닫으면 기록이 사라지니, 끝내기 전에 꼭 받아 두세요.</li>
      </ul>
    </section>
    <section class="card">
      <h2>자주 묻는 질문</h2>
      <dl class="rules">
        <dt>내 답변과 영상은 어디에 저장되나요?</dt><dd>어디에도 저장되지 않아요. 영상과 분석은 휴대폰 안에서만 처리되고, 화면을 닫으면 사라집니다. AI 키를 연결한 경우에만 질문과 답변 글이 Google Gemini로 전송됩니다.</dd>
        <dt>말했는데 글자가 안 나와요.</dt><dd>마이크 권한을 확인하고 Chrome이나 Safari에서 다시 열어 주세요. 그래도 안 되면 글로 답하기로 연습할 수 있어요.</dd>
        <dt>AI 오류가 나요.</dt><dd>첫 화면의 Gemini 키 카드에서 "연결 점검"을 누르면 원인과 해결 방법이 나옵니다.</dd>
        <dt>점수가 실제 AI면접 점수와 같나요?</dt><dd>아니요. 연습을 위한 자체 평가도구이고, AI면접 시스템마다 평가방식이 다릅니다.</dd>
      </dl>
    </section>
    <button class="btn primary big" data-act="home">연습 시작하러 가기</button>
  </main>`;
}

// ---------- Gemini 키 ----------
function keyPanel() {
  if (hasGemini()) {
    return `<div class="keybox">
      <p>Gemini에 연결되어 있어요. ${gem.keyRemembered() ? '키가 이 휴대폰에 저장되어 있습니다.' : '키는 이 화면을 닫으면 지워집니다.'}</p>
      <label class="field">모델 이름<input id="gemModel2" type="text" value="${esc(gem.getModel())}"></label>
      <button class="btn primary wide" data-act="diag">연결 점검: 오류 원인 확인하기</button>
      <button class="btn ghost wide" data-act="model-save">모델 이름 저장</button>
      <button class="btn ghost wide" data-act="key-clear">키 연결 해제</button>
    </div>`;
  }
  return `<div class="keybox">
    <p class="muted small">Gemini API 키를 넣으면 AI가 답변을 읽고 꼬리질문을 하고, 질문별 기준으로 피드백합니다. 내 자료로 예상 질문을 만들 때도 필요해요. 키가 없어도 기본 연습과 자동 피드백은 됩니다.</p>
    <a class="btn ghost wide" href="${KEY_URL}" target="_blank" rel="noopener noreferrer">Gemini API 키 받으러 가기 (Google AI Studio)</a>
    <details class="filehelp keyhelp">
      <summary>키 받는 방법 (3분, 무료)</summary>
      <ol class="steps">
        <li>위 버튼을 눌러 <b>Google AI Studio</b>를 엽니다. 새 창으로 열려요.</li>
        <li><b>Google 계정으로 로그인</b>합니다. 처음이면 이용 약관에 동의합니다.</li>
        <li><b>"API 키 만들기"(Create API key)</b>를 누릅니다. 프로젝트를 고르라고 하면 기본으로 제안되는 것을 그대로 선택하세요.</li>
        <li>만들어진 키(<b>AIza</b>로 시작하는 긴 글자) 옆의 <b>복사</b> 버튼을 누릅니다.</li>
        <li>이 화면으로 돌아와 아래 <b>Gemini API 키</b> 칸에 붙여 넣고 <b>키 연결</b>을 누릅니다.</li>
        <li>연결한 뒤 <b>연결 점검</b>을 누르면 키가 잘 되는지 확인할 수 있어요.</li>
      </ol>
      <ul class="plain small">
        <li>무료 등급으로 충분합니다. 카드 등록 없이 만들 수 있고, 하루·분당 사용량 한도가 있어요.</li>
        <li>키는 비밀번호처럼 다뤄 주세요. 다른 사람에게 보내거나 단톡방에 올리지 마세요.</li>
        <li>키는 이 휴대폰 안에서만 쓰이고 커리어캐쳐 서버로 보내지 않습니다. "이 휴대폰에 키 기억하기"를 켜지 않으면 화면을 닫을 때 지워져요.</li>
        <li>무료 키로 보낸 내용은 Google 서비스 개선에 쓰일 수 있어요. 실명·연락처는 빼고 넣어 주세요(전화번호·이메일은 자동으로 가립니다).</li>
        <li>키의 "애플리케이션 제한"은 "없음"으로 두세요. 웹사이트 제한을 걸면 이 앱에서 쓸 수 없습니다.</li>
      </ul>
    </details>
    <label class="field">Gemini API 키<input id="gemKey" type="password" autocomplete="off" placeholder="AIza로 시작하는 키"></label>
    <label class="check"><input type="checkbox" id="gemRemember"> 이 휴대폰에 키 기억하기</label>
    <details><summary class="muted small">모델 바꾸기</summary><label class="field">모델 이름<input id="gemModel" type="text" value="${esc(gem.getModel())}"></label></details>
    <button class="btn primary wide" data-act="key-save">키 연결</button>
    <p class="muted small">결제를 연결하지 않은 무료 키는 입력한 내용이 Google 서비스 개선에 쓰이고 사람이 검토할 수 있어요. 실명, 연락처, 회사 내부 정보는 빼고 넣어 주세요. 비용은 키 주인에게 청구됩니다.</p>
  </div>`;
}

// ---------- 화면: 연결 점검 ----------
let diagSteps = null;
let diagRunning = false;
function diagView() {
  const le = gem.getLastError();
  const mark = { ok: '정상', warn: '주의', bad: '문제' };
  const bad = diagSteps && diagSteps.find(x => x.state === 'bad');
  return `${header('연결 점검')}
  <main class="wrap">
    <section class="hero small">
      <h1>${diagRunning ? '점검하는 중이에요...' : !diagSteps ? 'Gemini 연결을 점검합니다.' : bad ? `"${esc(bad.name)}" 단계에서 문제가 있어요.` : '모두 정상이에요.'}</h1>
      <p>키 확인 → 모델 확인 → 실제 요청 순서로 시험합니다. 점검에는 아주 짧은 요청 두 번만 쓰고, 자료나 답변은 보내지 않아요.</p>
    </section>
    ${diagSteps ? `<section class="card diag"><ol>${diagSteps.map(x => `<li class="d-${x.state}"><span class="lv lv-${x.state === 'ok' ? 'ok' : x.state === 'warn' ? 'mid' : 'no'}">${mark[x.state]}</span><div><b>${esc(x.name)}</b><p class="small">${esc(x.detail)}</p>${x.fix ? `<p class="small fix">해결: ${esc(x.fix)}</p>` : ''}</div></li>`).join('')}</ol></section>` : ''}
    ${le ? `<section class="card diag"><h3>마지막으로 난 오류 <small class="muted">${esc(le.at)}</small></h3>
      <p><b>${esc(le.cause)}</b></p><p class="small fix">해결: ${esc(le.fix)}</p>
      <p class="muted small">코드 ${le.status} ${esc(le.gstatus)} · 모델 ${esc(le.model)}${le.detail ? ` · 원문: ${esc(le.detail)}` : ''}</p></section>` : ''}
    <button class="btn primary big" data-act="diag-run" ${diagRunning ? 'disabled' : ''}>${diagSteps ? '다시 점검하기' : '점검 시작'}</button>
    ${diagSteps || le ? '<button class="btn ghost wide" data-act="diag-copy">점검 결과 복사(강사에게 보내기)</button>' : ''}
    <button class="btn ghost wide" data-act="home">처음으로</button>
    <details class="card"><summary>자주 나는 오류와 이유</summary>
      <table class="errtable"><thead><tr><th>코드</th><th>이유</th></tr></thead><tbody>
        <tr><td>400</td><td>키가 틀렸거나 만료됨, 또는 요청 형식·모델 이름 문제</td></tr>
        <tr><td>403</td><td>키에 사용처 제한이 걸림, 프로젝트에서 Gemini API가 꺼짐, 유출 신고로 차단됨</td></tr>
        <tr><td>404</td><td>모델 이름이 없거나 이 키에서 쓸 수 없음</td></tr>
        <tr><td>429</td><td>분당 또는 하루 무료 사용량 초과(여러 명이 한 키를 쓰면 자주 발생)</td></tr>
        <tr><td>500·503</td><td>Google 서버 오류 또는 과부하, 잠시 후 재시도</td></tr>
        <tr><td>연결 실패</td><td>인터넷 끊김, 기관 와이파이·광고 차단 앱이 Google AI 주소를 막음</td></tr>
        <tr><td>시간 초과</td><td>자료가 길거나 서버가 느림</td></tr>
        <tr><td>차단·잘림</td><td>안전 필터가 내용을 막음, 답이 너무 길어 잘림</td></tr>
      </tbody></table>
    </details>
  </main>`;
}

async function runDiag() {
  if (diagRunning) return;
  diagRunning = true;
  diagSteps = [];
  render();
  try { diagSteps = await gem.diagnose(steps => { diagSteps = [...steps]; if (state.screen === 'diag') render(); }); }
  finally { diagRunning = false; if (state.screen === 'diag') render(); }
}

function diagText() {
  const le = gem.getLastError();
  const lines = ['[면접 리허설] Gemini 연결 점검', `모델 설정: ${gem.getModel()}`, `브라우저: ${navigator.userAgent.slice(0, 120)}`];
  (diagSteps || []).forEach(x => lines.push(`- ${x.name}: ${x.state === 'ok' ? '정상' : x.state === 'warn' ? '주의' : '문제'} / ${x.detail}${x.fix ? ' / 해결: ' + x.fix : ''}`));
  if (le) lines.push(`마지막 오류(${le.at}): ${le.cause} / 코드 ${le.status} ${le.gstatus} / 모델 ${le.model} / 원문: ${le.detail}`);
  return lines.join('\n');
}

// ---------- 화면: 내 자료 넣기 ----------
const DOC_HINTS = {
  자기소개서: '지원동기, 성장과정, 직무 역량 문항 등',
  경력기술서: '회사·기간·담당 업무·성과',
  포트폴리오: '프로젝트 이름, 맡은 역할, 결과를 글로 요약',
  경험노트: '상황-과제-행동-결과로 정리한 경험',
};
function materialView() {
  const m = state.material;
  return `${header('내 자료 넣기')}
  <main class="wrap">
    ${hasGemini() ? '' : `<section class="card"><h2>1. Gemini 키 연결</h2>${keyPanel()}</section>`}
    <section class="card form">
      <h2>${hasGemini() ? '1' : '2'}. 지원 정보</h2>
      <label class="field">지원 직무 (필수)<input id="mJob" type="text" maxlength="60" placeholder="예: 사무행정, 콘텐츠 마케터, 요양보호사" value="${esc(m.job)}"></label>
      <label class="field">지원 회사 (선택)<input id="mCompany" type="text" maxlength="60" value="${esc(m.company)}"></label>
    </section>
    <section class="card form">
      <h2>${hasGemini() ? '2' : '3'}. 자료 넣기 <small class="muted">파일 첨부 또는 붙여넣기</small></h2>
      <label class="dropzone" id="dropzone">
        <input type="file" id="fileTop" multiple accept="${files.ACCEPT}">
        <b>파일 첨부해서 자동으로 읽기</b>
        <span class="muted small">자기소개서·경력기술서·포트폴리오·경험노트·채용공고 파일을 한 번에 골라도 돼요. 한글(HWP·HWPX), 워드(DOC·DOCX), PDF, TXT, 사진을 읽습니다.</span>
      </label>
      <details class="filehelp">
        <summary>어떤 파일을 올릴 수 있나요?</summary>
        <table>
          <thead><tr><th>파일</th><th>읽는 방법</th></tr></thead>
          <tbody>
            <tr><td>한글 HWP·HWPX</td><td>휴대폰 안에서 바로 읽어요. 표 안의 글, 각주도 읽습니다.</td></tr>
            <tr><td>워드 DOC·DOCX</td><td>휴대폰 안에서 바로 읽어요. 옛 워드(97~2003) 파일도 됩니다.</td></tr>
            <tr><td>PDF</td><td>글자가 들어 있는 PDF는 휴대폰 안에서 읽어요. 스캔해서 만든 PDF는 사진처럼 처리해요.</td></tr>
            <tr><td>TXT·메모</td><td>휴대폰 안에서 바로 읽어요.</td></tr>
            <tr><td>사진(JPG·PNG)·스캔 PDF</td><td>휴대폰에서 글자를 직접 읽을 수 없어, 동의하면 내 Gemini로 보내 글자를 읽어요.</td></tr>
          </tbody>
        </table>
        <ul class="plain small">
          <li>휴대폰 안에서 읽는 파일은 어디에도 전송되지 않고, 읽은 글만 아래 칸에 들어갑니다.</li>
          <li>암호가 걸린 파일은 읽을 수 없어요. 암호를 풀고 다시 저장해 주세요.</li>
          <li>한글 "배포용 문서"는 앞부분 미리보기 글만 읽혀요. 전체가 필요하면 PDF로 저장해 올려 주세요.</li>
          <li>파일 이름에 "공고", "경력", "포트폴리오", "경험"이 들어 있으면 알맞은 칸에 자동으로 넣고, 아니면 자기소개서 칸에 넣어요. 칸마다 있는 "파일 첨부"로 직접 고를 수도 있어요.</li>
          <li>한 칸에 15,000자까지 들어가요. 한 파일은 15MB까지 올릴 수 있어요.</li>
        </ul>
      </details>
      ${m.files.length ? `<ul class="filelist">${m.files.map(f => `<li class="${f.error ? 'err' : ''}"><b>${esc(f.name)}</b><span>${f.error ? esc(f.error) : `${esc(f.slot)}에 ${f.chars.toLocaleString()}자 · ${f.ai ? 'Gemini로 읽음' : '휴대폰에서 읽음'}${f.cut ? ' · 길어서 일부만' : ''}`}</span></li>`).join('')}</ul><p class="muted small">읽어 온 내용은 아래 칸에 들어갔어요. 잘못 읽힌 부분이 있으면 고쳐 주세요.</p>` : ''}
      ${SLOTS.map(([k, label, hint]) => {
        const v = k === '채용공고' ? m.posting : m.docs[k];
        return `<details class="doc" ${v ? 'open' : ''}><summary>${label} <small class="muted">${v ? `${v.length.toLocaleString()}자` : hint}</small></summary>
          <textarea ${k === '채용공고' ? 'id="mPosting"' : `data-doc="${k}"`} rows="7" maxlength="${SLOT_MAX}" placeholder="${hint}">${esc(v)}</textarea>
          <label class="btn ghost sm attach">파일 첨부<input type="file" data-slot="${k}" multiple accept="${files.ACCEPT}"></label>
        </details>`;
      }).join('')}
      <p class="muted small">한글·워드·PDF·TXT 파일은 이 휴대폰 안에서 읽고 파일을 보내지 않아요. 사진·스캔본만 동의를 받은 뒤 Gemini로 보내 글자를 읽습니다. 질문을 만들 때는 칸에 들어간 글만 보내며, 보내기 전에 전화번호·이메일·주민번호를 자동으로 가립니다. 이 앱은 자료를 저장하지 않습니다.</p>
    </section>
    <button class="btn primary big" data-act="auto-set">예상 질문 바로 만들기</button>
    <button class="btn ghost wide" data-act="extract">검증할 역량 먼저 확인하고 만들기</button>
    <p class="muted small center">바로 만들기는 자료에서 뽑은 핵심 역량으로 질문까지 한 번에 만들어요. 1분 안팎 걸립니다.</p>
  </main>`;
}

const SLOT_MAX = 15000;
const SLOTS = [
  ['자기소개서', '자기소개서', DOC_HINTS.자기소개서],
  ['경력기술서', '경력기술서', DOC_HINTS.경력기술서],
  ['포트폴리오', '포트폴리오', DOC_HINTS.포트폴리오],
  ['경험노트', '경험노트', DOC_HINTS.경험노트],
  ['채용공고', '채용공고 (선택)', '있으면 직무 역량을 더 정확히 뽑아요'],
];

// 파일 이름으로 어느 칸에 넣을지 짐작한다. 모르면 자기소개서.
function guessSlot(name) {
  const n = name.replace(/\s/g, '');
  if (/공고|채용|모집|JD/i.test(n)) return '채용공고';
  if (/경력기술|경력|career/i.test(n)) return '경력기술서';
  if (/포트폴리오|portfolio/i.test(n)) return '포트폴리오';
  if (/경험|STAR/i.test(n)) return '경험노트';
  return '자기소개서';
}

function putText(slot, text) {
  const m = state.material;
  const cur = slot === '채용공고' ? m.posting : m.docs[slot];
  let next = cur ? `${cur}\n\n${text}` : text;
  const cut = next.length > SLOT_MAX;
  if (cut) next = next.slice(0, SLOT_MAX);
  if (slot === '채용공고') m.posting = next; else m.docs[slot] = next;
  return cut;
}

async function handleFiles(list, fixedSlot) {
  readMaterial();
  const m = state.material;
  const picked = [...list];
  if (!picked.length) return;
  for (const file of picked) {
    const slot = fixedSlot || guessSlot(file.name);
    const rec = { name: file.name, slot, chars: 0, ai: false, cut: false, error: '' };
    m.files.push(rec);
    toast(`"${file.name}" 읽는 중...`);
    try {
      let { text, needsAI } = await files.readLocal(file);
      if (needsAI) {
        if (!hasGemini()) throw new Error('사진이나 스캔한 PDF는 Gemini 키를 연결하면 읽을 수 있어요. 글자를 복사해 붙여 넣어도 됩니다.');
        const ok = confirm(`"${file.name}"은(는) 휴대폰에서 글자를 바로 읽을 수 없는 파일(사진·스캔본)이에요.\n본인 Gemini로 파일을 보내 글자를 읽을까요?\n파일이 그대로 전송되므로 연락처 자동 가림이 적용되지 않아요.`);
        if (!ok) throw new Error('Gemini로 보내지 않아 읽지 않았어요.');
        showLoading('파일 읽는 중', `"${file.name}"의 글자를 Gemini로 읽고 있어요.`);
        text = await gem.transcribeFile(await files.toBase64(file), files.mimeOf(file));
        rec.ai = true;
      }
      text = text.trim();
      if (!text) throw new Error('파일에 읽을 글자가 없어요.');
      rec.cut = putText(slot, text);
      rec.chars = text.length;
    } catch (err) {
      rec.error = err.message || '읽지 못했어요.';
    }
  }
  go('material');
  const okCount = m.files.slice(-picked.length).filter(f => !f.error).length;
  toast(okCount ? `파일 ${okCount}개를 읽었어요. 내용을 확인해 주세요.` : '파일을 읽지 못했어요. 아래 안내를 확인해 주세요.');
}

function readMaterial() {
  const m = state.material;
  const job = document.getElementById('mJob');
  if (!job) return m;
  m.job = job.value.trim();
  m.company = document.getElementById('mCompany').value.trim();
  document.querySelectorAll('[data-doc]').forEach(t => { m.docs[t.dataset.doc] = t.value.trim(); });
  m.posting = document.getElementById('mPosting').value.trim();
  return m;
}

function maskedMaterial() {
  const m = state.material;
  let masked = 0;
  const docs = Object.entries(m.docs).filter(([, v]) => v).map(([k, v]) => { const r = gem.maskPersonal(v); masked += r.count; return [k, r.text]; });
  const posting = gem.maskPersonal(m.posting);
  masked += posting.count;
  return { material: { job: m.job, company: m.company, docs, posting: posting.text }, masked };
}

// auto=true면 역량 확인 화면 없이 질문집까지 한 번에 만든다.
async function doExtract(auto) {
  readMaterial();
  const m = state.material;
  if (!hasGemini()) { toast('먼저 Gemini API 키를 연결해 주세요.'); return; }
  if (!m.job) { toast('지원 직무를 써 주세요.'); document.getElementById('mJob').focus(); return; }
  const total = Object.values(m.docs).join('').length;
  if (total < 100) { toast('자료를 100자 이상 넣어 주세요. 경험이 담긴 글일수록 질문이 정확해져요.'); return; }
  const { material, masked } = maskedMaterial();
  showLoading('역량 뽑는 중', `"${m.job}" 면접에서 검증할 핵심 역량을 자료에서 찾고 있어요.${masked ? ` (개인정보 ${masked}건을 가리고 보냈어요)` : ''}`);
  try {
    const comps = await gem.extractCompetencies(material);
    state.comps = comps.map(c => ({ ...c, on: true }));
    if (auto) return doMakeSet();
    go('comps');
  } catch (err) {
    toast(err.message);
    go('material');
  }
}

function compsView() {
  return `${header('핵심 역량 확인')}
  <main class="wrap">
    <section class="hero small">
      <h1>이 역량들을 검증하는 질문을 만들게요.</h1>
      <p>질문을 만들기 전에 "무엇을 확인할지"부터 정합니다. 빼고 싶은 역량은 체크를 풀고, 꼭 넣고 싶은 역량은 아래에 추가하세요.</p>
    </section>
    ${state.comps.map((c, i) => `<label class="card comp ${c.on ? '' : 'off'}">
      <input type="checkbox" data-comp="${i}" ${c.on ? 'checked' : ''}>
      <div><h3>${esc(c.name)}</h3><p class="small">${esc(c.why)}</p><p class="muted small">내 경험: ${esc(c.evidence)}</p>${c.source_quote ? `<p class="quote small">"${esc(c.source_quote)}"</p>` : ''}</div>
    </label>`).join('')}
    <section class="card form">
      <label class="field">역량 직접 추가<input id="compAdd" type="text" maxlength="30" placeholder="예: 고객 응대"></label>
      <button class="btn ghost wide" data-act="comp-add">추가</button>
    </section>
    <button class="btn primary big" data-act="make-set">예상 질문과 답변 스크립트 만들기</button>
    <button class="btn ghost wide" data-act="material">자료 고치기</button>
  </main>`;
}

async function doMakeSet() {
  const comps = state.comps.filter(c => c.on);
  if (!comps.length) { toast('역량을 하나 이상 골라 주세요.'); return; }
  const { material } = maskedMaterial();
  showLoading('질문 만드는 중', `${comps.map(c => c.name).join(', ')} 역량을 검증하는 예상 질문과 핵심 답변 스크립트를 만들고 있어요. 30초~1분 정도 걸려요.`);
  try {
    const qs = await gem.generateQuestionSet(material, comps);
    const stamp = Date.now().toString(36);
    qset = {
      job: state.material.job,
      company: state.material.company,
      createdAt: new Date().toISOString().slice(0, 10),
      competencies: comps.map(({ name, why, evidence }) => ({ name, why, evidence })),
      questions: qs.map((q, i) => ({
        id: `g${stamp}-${i}`,
        cat: q.type === '공통' ? '공통' : `${q.competency} · ${q.type}`,
        text: q.question,
        tip: q.must_evidence,
        type: q.type, competency: q.competency, intent: q.intent, must_evidence: q.must_evidence,
        criteria: (q.criteria || []).slice(0, 3), source_quote: q.source_quote, followups: (q.followups || []).slice(0, 2),
        keywords: (q.keywords || []).slice(0, 5), script: q.script,
        numbers: (q.numbers_to_prepare || []).slice(0, 4),
      })),
    };
    saveQset();
    state.comps = null;
    go('qset');
  } catch (err) {
    toast(err.message);
    go('comps');
  }
}

// ---------- 화면: 나의 예상 질문집 ----------
function qsetView() {
  if (!qset) return materialView();
  return `${header('나의 예상 질문집')}
  <main class="wrap qset">
    <section class="hero small">
      <p class="eyebrow print-only">커리어캐쳐 면접 리허설</p>
      <h1>나의 예상 질문집 <small class="muted">${esc(qset.job)}${qset.company ? ' · ' + esc(qset.company) : ''}</small></h1>
      <p>${qset.createdAt} · 질문 ${qset.questions.length}개. 스크립트는 외우지 말고, 키워드만 떠올리며 내 말로 답해 보세요.</p>
      ${qset.competencies && qset.competencies.length ? `<p class="kw">${qset.competencies.map(c => `<span>${esc(c.name)}</span>`).join('')}</p><p class="muted small no-print">자료에서 뽑은 검증 역량이에요. 바꾸고 싶으면 "새로 만들기"에서 "역량 먼저 확인하고 만들기"를 눌러 주세요.</p>` : ''}
    </section>
    <section class="card no-print">
      <div class="savebtns">
        <button class="btn primary" data-act="qset-pdf">질문집 PDF로 저장</button>
        <button class="btn ghost" data-act="qset-text">글로 복사</button>
        <button class="btn ghost" data-act="material">새로 만들기</button>
      </div>
      <p class="muted small">질문집은 이 휴대폰 브라우저에만 저장돼요. <button class="linkbtn" data-act="qset-del">질문집 지우기</button></p>
    </section>
    ${qset.questions.map((q, i) => `<article class="card qcard">
      <p class="eyebrow">질문 ${i + 1} · ${esc(q.type === '공통' ? '공통' : q.competency)} · ${esc(q.type)}</p>
      <h2>${esc(q.text)}</h2>
      <dl class="qmeta">
        ${q.intent ? `<dt>질문 의도</dt><dd>${esc(q.intent)}</dd>` : ''}
        ${q.must_evidence ? `<dt>꼭 보여 줄 근거</dt><dd>${esc(q.must_evidence)}</dd>` : ''}
        ${q.criteria.length ? `<dt>평가 기준</dt><dd><ul>${q.criteria.map(c => `<li>${esc(c)}</li>`).join('')}</ul></dd>` : ''}
        ${q.source_quote ? `<dt>내 자료 속 근거</dt><dd class="quote">"${esc(q.source_quote)}"</dd>` : ''}
      </dl>
      ${q.numbers && q.numbers.length ? `<div class="nums"><p class="eyebrow">준비할 숫자 <small class="muted">성과는 숫자로 말해요</small></p><ul>${q.numbers.map(n => `<li class="${/자료에 없음|확인 필요/.test(n) ? 'need' : ''}">${esc(n)}</li>`).join('')}</ul></div>` : ''}
      <div class="script">
        <p class="eyebrow">핵심 답변 키워드</p>
        <p class="kw">${q.keywords.map(k => `<span>${esc(k)}</span>`).join('')}</p>
        <details class="print-open"><summary>핵심 답변 스크립트 보기</summary><blockquote>${esc(q.script)}</blockquote><p class="muted small">[ ] 표시는 자료에 없던 내용이에요. 본인의 실제 경험으로 채워 주세요.</p></details>
      </div>
      ${q.followups.length ? `<p class="eyebrow">예상 꼬리질문</p><ul class="fu">${q.followups.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      <button class="btn ghost wide no-print" data-act="choose" data-id="${q.id}">이 질문으로 연습하기</button>
    </article>`).join('')}
    <p class="disclaimer">AI가 넣어 주신 자료를 바탕으로 만든 예상 질문과 예시 답변입니다. 실제 면접 질문과 다를 수 있고, 스크립트의 사실 여부는 본인이 확인해 주세요.</p>
  </main>`;
}

// ---------- 렌더링 ----------
const views = { guide: guideView, diag: diagView, material: materialView, comps: compsView, qset: qsetView, home: homeView, pick: pickView, ask: askView, review: reviewView, report: reportView, compare: compareView, records: recordsView };
function render() {
  app.innerHTML = views[state.screen]();
  if (state.screen === 'ask') bindAsk();
}

// PC에서는 파일을 끌어다 놓아도 읽는다.
app.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('#dropzone'); if (z) { e.preventDefault(); z.classList.add('over'); } });
app.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('#dropzone'); if (z) z.classList.remove('over'); });
app.addEventListener('drop', e => { const z = e.target.closest && e.target.closest('#dropzone'); if (z) { e.preventDefault(); handleFiles(e.dataTransfer.files, null); } });

app.addEventListener('change', e => {
  if (e.target.id === 'consent') state.consent = e.target.checked;
  if (e.target.id === 'email') saveEmailField(true);
  if (e.target.id === 'mailTo' && EMAIL_RE.test(e.target.value.trim())) { email = e.target.value.trim(); store.set('email', email); }
  if (e.target.id === 'textmode') settings.textMode = e.target.checked;
  if (e.target.type === 'file' && e.target.files && e.target.files.length) { const fl = [...e.target.files]; e.target.value = ''; handleFiles(fl, e.target.dataset.slot || null); return; }
  if (e.target.dataset && e.target.dataset.comp != null && state.comps) { state.comps[Number(e.target.dataset.comp)].on = e.target.checked; e.target.closest('.comp').classList.toggle('off', !e.target.checked); }
});

app.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'home') { if (state.screen !== 'loading') go('home'); }
  else if (act === 'limit') { settings.limit = Number(el.dataset.v); store.set('limit', String(settings.limit)); render(); }
  else if (act === 'start') {
    if (!saveEmailField()) return;
    if (!state.consent) { toast('시작 전 확인 항목에 체크해 주세요.'); document.getElementById('consent').focus(); return; }
    go('pick');
  }
  else if (act === 'choose' || act === 'random') {
    const pool = assigned.length ? assigned : QUESTIONS;
    state.question = act === 'random' ? pool[Math.floor(Math.random() * pool.length)] : getQuestion(el.dataset.id);
    state.attempts = [];
    go('ask');
  }
  else if (act === 'listen') speak(state.question.text);
  else if (act === 'redo' || act === 'retry') go('ask');
  else if (act === 'evaluate') evaluate();
  else if (act === 'pick') go('pick');
  else if (act === 'records') go('records');
  else if (act === 'evaluate-skip') evaluate(true);
  else if (act === 'material') { readMaterial(); go('material'); }
  else if (act === 'qset') go('qset');
  else if (act === 'extract') doExtract(false);
  else if (act === 'auto-set') doExtract(true);
  else if (act === 'make-set') doMakeSet();
  else if (act === 'comp-add') {
    const inp = document.getElementById('compAdd');
    const name = inp.value.trim();
    if (!name) return;
    state.comps.push({ name, why: '직접 추가한 역량', evidence: '자료에서 관련 경험을 찾아 질문을 만듭니다', source_quote: '', on: true });
    render();
  }
  else if (act === 'key-save') {
    const k = document.getElementById('gemKey').value.trim();
    if (k.length < 20) { toast('API 키를 확인해 주세요.'); return; }
    readMaterial();
    gem.setKey(k, document.getElementById('gemRemember').checked);
    const md = document.getElementById('gemModel');
    if (md) gem.setModel(md.value);
    toast('Gemini 키를 연결했어요. 실제 사용 가능 여부는 첫 요청 때 확인됩니다.');
    render();
  }
  else if (act === 'diag') { readMaterial(); const md = document.getElementById('gemModel2'); if (md) gem.setModel(md.value); go('diag'); runDiag(); }
  else if (act === 'diag-run') runDiag();
  else if (act === 'diag-copy') copy(diagText(), '점검 결과를 복사했어요. 키는 들어 있지 않아요.');
  else if (act === 'model-save') { readMaterial(); gem.setModel(document.getElementById('gemModel2').value); toast('모델 이름을 저장했어요.'); render(); }
  else if (act === 'key-clear') { readMaterial(); gem.setKey('', false); toast('키 연결을 해제했어요.'); render(); }
  else if (act === 'qset-text') copy(buildSetText(qset), '질문집을 글로 복사했어요.');
  else if (act === 'qset-pdf') { document.querySelectorAll('details.print-open').forEach(d => { d.open = true; }); toast('인쇄 창에서 "PDF로 저장"을 골라 주세요.'); setTimeout(() => window.print(), 300); }
  else if (act === 'qset-del') { if (confirm('나의 예상 질문집을 지울까요?')) { qset = null; saveQset(); go('pick'); } }
  else if (act === 'video-mode') { settings.video = el.dataset.v === '1'; store.set('video', settings.video ? '1' : ''); render(); }
  else if (act === 'save-video') {
    const a = state.log[Number(el.dataset.q)]?.attempts[Number(el.dataset.a)];
    const v = a && (el.dataset.f ? a.follow && a.follow.video : a.video);
    if (!v) return;
    const how = await saveVideo(v, fileName('x').replace(/\.x$/, '') + `-q${Number(el.dataset.q) + 1}-${Number(el.dataset.a) + 1}${el.dataset.f ? '-follow' : ''}`);
    if (how === 'downloaded') toast('영상을 내려받았어요. 다운로드 폴더나 갤러리에서 확인해 주세요.');
    else if (how === 'shared') toast('"비디오 저장"을 누르면 사진첩에 저장돼요.');
  }
  else if (act === 'add-custom') {
    const box = document.getElementById('customText');
    const text = box.value.replace(/\s+/g, ' ').trim();
    if (text.length < 5) { toast('질문을 조금 더 자세히 써 주세요.'); box.focus(); return; }
    const q = { id: 'c' + Date.now().toString(36), cat: '내 질문', text, tip: CUSTOM_TIP };
    custom.unshift(q);
    custom = custom.slice(0, 20);
    saveCustom();
    state.question = q;
    state.attempts = [];
    go('ask');
  }
  else if (act === 'del-custom') {
    custom = custom.filter(q => q.id !== el.dataset.id);
    saveCustom();
    render();
  }
  else if (['save-image', 'save-pdf', 'save-text', 'save-html', 'save-mail'].includes(act)) doSave(act);
  else if (act === 'guide') { saveEmailField(true); go('guide'); }
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
