// 운영자(강사)가 자기 Claude API 키를 넣어 쓰는 연결. 공식 Anthropic SDK(vendor/anthropic/sdk.js)를 브라우저에서 바로 쓴다(서버 없음).
// 하는 일은 Gemini와 같다: 정해진 JSON 형식으로 답을 받는다. 소리(녹음) 받아쓰기는 Claude가 지원하지 않아 Gemini만 쓴다.
// 키는 기본적으로 메모리에만 두고, 고르면 이 기기 브라우저에 저장한다. 브라우저에 키를 두는 방식이므로 본인 기기에서만 쓰는 것을 전제로 한다.

export const DEFAULT_MODEL = 'claude-opus-5-5';
const KEY_STORE = 'cc-interview-claude-key';
const MODEL_STORE = 'cc-interview-claude-model';
let memoryKey = '';

export function getKey() {
  if (memoryKey) return memoryKey;
  try { return localStorage.getItem(KEY_STORE) || ''; } catch { return ''; }
}
export function setKey(key, remember) {
  memoryKey = String(key || '').trim();
  try { remember && memoryKey ? localStorage.setItem(KEY_STORE, memoryKey) : localStorage.removeItem(KEY_STORE); } catch { /* 저장 불가 */ }
}
export function keyRemembered() {
  try { return Boolean(localStorage.getItem(KEY_STORE)); } catch { return false; }
}
export function getModel() {
  try { return localStorage.getItem(MODEL_STORE) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; }
}
export function setModel(m) {
  const v = String(m || '').trim();
  try { v && v !== DEFAULT_MODEL ? localStorage.setItem(MODEL_STORE, v) : localStorage.removeItem(MODEL_STORE); } catch { /* 무시 */ }
}

export class ClaudeError extends Error {
  constructor(message, status = 0, info = {}) { super(message); this.status = status; Object.assign(this, info); }
}

let lastError = null;
export const getLastError = () => lastError;
function fail(status, kind, detail, model) {
  const { cause, fix } = explain(status, kind, detail);
  lastError = { t: Date.now(), at: new Date().toLocaleString('ko-KR'), status, gstatus: kind, detail: String(detail || '').slice(0, 300), model, cause, fix, provider: 'Claude' };
  return new ClaudeError(`${cause} ${fix}`, status, { gstatus: kind, detail, cause, fix });
}

export function explain(status, kind = '', detail = '') {
  const d = String(detail || '');
  if (kind === 'TIMEOUT') return { cause: '응답 시간 초과: Claude가 정해진 시간 안에 답하지 못했어요.', fix: '잠시 후 다시 시도하거나 넣은 자료 양을 줄여 보세요.' };
  if (kind === 'NETWORK') return { cause: '연결 실패: Claude 서버(api.anthropic.com)에 닿지 못했어요.', fix: '인터넷 연결을 확인해 주세요. 기관 와이파이나 광고 차단 앱이 막는 경우도 있어요.' };
  if (kind === 'REFUSAL') return { cause: 'Claude가 이 요청에 답하지 않았어요(안전 정책).', fix: '자료에 민감한 표현이 있는지 확인하고 그 부분을 빼고 다시 시도해 주세요.' };
  if (kind === 'MAX_TOKENS') return { cause: '답이 너무 길어 중간에 잘렸어요.', fix: '넣은 자료를 줄이거나 역량 수를 줄여 다시 만들어 주세요.' };
  if (kind === 'BAD_JSON') return { cause: 'Claude가 정해진 형식으로 답하지 않았어요.', fix: '다시 시도해 주세요.' };
  if (kind === 'UNSUPPORTED') return { cause: 'Claude는 이 파일 형식을 읽지 못해요.', fix: '사진(JPG, PNG)이나 PDF로 올리거나, Gemini 키를 연결해 주세요.' };
  if (status === 401) return { cause: 'Claude API 키가 올바르지 않아요.', fix: 'Claude Console에서 sk-ant-로 시작하는 키를 다시 복사해 넣어 주세요. 삭제한 키도 이 오류가 납니다.' };
  if (status === 400 && /credit balance|billing|purchase credits/i.test(d)) return { cause: 'Claude 계정의 크레딧(잔액)이 부족해요.', fix: 'Claude Console의 결제(Billing)에서 크레딧을 충전해 주세요.' };
  if (status === 400) return { cause: '요청 형식 문제: Claude가 요청을 받아들이지 않았어요.', fix: '모델 이름이 맞는지 확인해 주세요(기본값 claude-opus-5-5).' };
  if (status === 403) return { cause: '권한 없음: 이 키로는 이 모델이나 기능을 쓸 수 없어요.', fix: 'Claude Console에서 키의 워크스페이스와 권한을 확인해 주세요.' };
  if (status === 404) return { cause: '모델을 찾을 수 없어요.', fix: '모델 이름을 확인해 주세요(기본값 claude-opus-5-5).' };
  if (status === 413) return { cause: '보낸 내용이 너무 커요.', fix: '자료나 파일 크기를 줄여 주세요.' };
  if (status === 429) return { cause: '요청이 너무 잦아요: 사용량 한도에 걸렸어요.', fix: '1~2분 기다렸다가 다시 시도해 주세요. 계속되면 Claude Console에서 한도(Limits)를 확인해 주세요.' };
  if (status === 529) return { cause: 'Claude 서버가 지금 붐벼요(과부하).', fix: '잠시 후 다시 시도해 주세요.' };
  if (status >= 500) return { cause: 'Claude 서버 오류예요.', fix: '잠시 후 다시 시도해 주세요.' };
  return { cause: `알 수 없는 오류(${status} ${kind})`, fix: '연결 점검 결과를 복사해 전달해 주세요.' };
}

let sdkPromise = null;
const loadSdk = () => (sdkPromise ||= import('./vendor/anthropic/sdk.js?v=202611151').then(m => m.default).catch(e => { sdkPromise = null; throw e; }));

// 공식 SDK의 오류 종류를 위 설명으로 바꾼다.
function mapError(Anthropic, e, model) {
  if (e instanceof ClaudeError) return e;
  if (e instanceof Anthropic.APIConnectionTimeoutError) return fail(0, 'TIMEOUT', e.message, model);
  if (e instanceof Anthropic.APIConnectionError) return fail(0, 'NETWORK', e.message, model);
  if (e instanceof Anthropic.APIError) return fail(e.status || 0, e.error && e.error.error && e.error.error.type || '', e.message, model);
  return fail(0, 'NETWORK', e && e.message, model);
}

// 이 모델들만 서버 쪽 대체 모델(refusal fallback)을 받는다.
const takesFallback = model => /^claude-(opus-5-5|sonnet-5-5|fable-5-2|fable-5-1|opus-5)$/.test(model);

function contentFor(prompt, attach) {
  if (!attach) return prompt;
  let block;
  if (/^image\/(jpeg|png|gif|webp)$/.test(attach.mime)) block = { type: 'image', source: { type: 'base64', media_type: attach.mime, data: attach.data } };
  else if (attach.mime === 'application/pdf') block = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: attach.data } };
  else throw fail(0, 'UNSUPPORTED', attach.mime, getModel());
  return [block, { type: 'text', text: prompt }];
}

// 정해진 JSON 형식(output_config.format)으로 답을 받는다. 긴 답에도 시간 초과가 나지 않게 스트리밍으로 받아 마지막 메시지만 쓴다.
export async function generateJSON(system, prompt, schema, { timeoutMs = 120000, attach = null, effort = 'medium' } = {}) {
  const key = getKey();
  if (!key) throw new ClaudeError('먼저 Claude API 키를 넣어 주세요.');
  const model = getModel();
  const Anthropic = await loadSdk();
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: timeoutMs });
  const params = {
    model,
    max_tokens: 32000,
    system,
    messages: [{ role: 'user', content: contentFor(prompt, attach) }],
    output_config: { effort, format: { type: 'json_schema', schema } },
  };
  if (takesFallback(model)) Object.assign(params, { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
  let msg;
  try {
    msg = await client.beta.messages.stream(params).finalMessage();
  } catch (e) {
    throw mapError(Anthropic, e, model);
  }
  if (msg.stop_reason === 'refusal') throw fail(200, 'REFUSAL', msg.stop_details && msg.stop_details.category || '', model);
  if (msg.stop_reason === 'max_tokens') throw fail(200, 'MAX_TOKENS', '', model);
  const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  try { return JSON.parse(text); } catch { throw fail(200, 'BAD_JSON', text.slice(0, 120), model); }
}

// 연결 점검: 키 모양 → 짧은 요청 → 형식 지정 요청
export async function diagnose(onStep = () => {}) {
  const steps = [];
  const add = (name, state, detail = '', fix = '') => { steps.push({ name, state, detail, fix }); onStep(steps); };
  const key = getKey();
  if (!key) { add('키 입력', 'bad', 'Claude 키가 입력되지 않았어요.', 'Claude API 키를 넣고 연결해 주세요.'); return steps; }
  add('키 모양', /^sk-ant-/.test(key) ? 'ok' : 'warn', /^sk-ant-/.test(key) ? `sk-ant-로 시작하는 ${key.length}자 키` : '보통 Claude 키는 sk-ant-로 시작해요.', /^sk-ant-/.test(key) ? '' : '다른 서비스의 키를 넣지 않았는지 확인해 주세요.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { add('인터넷 연결', 'bad', '기기가 오프라인이에요.', '와이파이나 데이터를 켜 주세요.'); return steps; }
  const model = getModel();
  let Anthropic;
  try { Anthropic = await loadSdk(); } catch (e) { add('Claude 연결 도구', 'bad', `불러오지 못했어요: ${e.message}`, '새로고침해 주세요.'); return steps; }
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 0, timeout: 60000 });
  const t0 = Date.now();
  try {
    await client.messages.create({ model, max_tokens: 1024, output_config: { effort: 'low' }, messages: [{ role: 'user', content: '"확인"이라고만 답하세요.' }] });
    add('글 생성 시험', 'ok', `모델 ${model}, 응답 ${((Date.now() - t0) / 1000).toFixed(1)}초`);
  } catch (e) {
    const err = mapError(Anthropic, e, model);
    add('글 생성 시험', 'bad', `${err.cause} [${err.status} ${err.gstatus || ''}] ${String(err.detail || '').slice(0, 200)}`, err.fix);
    return steps;
  }
  try {
    const r = await generateJSON('한국어로 답합니다.', '면접 질문 1개를 만들어 주세요.', { type: 'object', properties: { question: { type: 'string' } }, required: ['question'], additionalProperties: false }, { timeoutMs: 60000, effort: 'low' });
    if (!r.question) throw new Error('빈 값');
    add('형식 지정 응답 시험', 'ok', `질문 만들기 준비 완료. 예: ${String(r.question).slice(0, 40)}`);
  } catch (e) {
    add('형식 지정 응답 시험', 'bad', e.cause ? `${e.cause} [${e.status} ${e.gstatus || ''}]` : '정해진 형식으로 답하지 못했어요.', e.fix || '다시 시도해 주세요.');
  }
  return steps;
}
