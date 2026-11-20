// Code.gs를 가짜 Apps Script 환경에서 돌려 보는 테스트.
// 실행: node --test ai-assistant/번외/kakao-daily-summary/
// 실제 카카오·구글 서버에는 접속하지 않는다.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const CODE = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');
const REAL_BOARD = path.join(__dirname, '..', '..', '..', 'state', 'BOARD.md');

const NOW = Date.parse('2026-11-20T23:30:00Z'); // 한국 시간 2026-11-21(토) 08:30
const REDIRECT = 'https://script.google.com/macros/s/TEST_ID/exec';

const BOARD = [
  '# 작업 보드',
  '',
  '## 응답 대기 (사용자 답이 필요)',
  '| 업무 | 일 | 상태 |',
  '|---|---|---|',
  '| 블로그 | 비밀제목하나 | asked |',
  '| 보고서 | 비밀제목둘 | received |',
  '| 코칭 | 비밀제목셋 | 배포됨 |',
  '',
  '## 발행 대기 (발행완료 링크 필요)',
  '| 업무 | 일 |',
  '|---|---|',
  '| 블로그 | 비밀제목넷 |',
  '',
  '## 보완 필요',
  '- 비밀메모하나',
  '- 비밀메모둘',
  '',
  '## 지시판',
  '- 페이지: https://example.com',
  '',
].join('\n');

function response(status, body) {
  return {
    getResponseCode: () => status,
    getContentText: () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

function decodeForm(payload) {
  const out = {};
  for (const pair of String(payload).split('&')) {
    const [k, v] = pair.split('=');
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}

/** 가짜 환경을 만든다. routes: URL 앞부분 → 응답(또는 응답을 차례로 꺼낼 배열, 함수). */
function setup(initialProps = {}, routes = {}) {
  const store = { ...initialProps };
  const calls = [];
  const logs = [];
  const triggers = [];
  const created = [];
  const env = {
    console: { log: (...a) => logs.push(a.join(' ')) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k in store ? store[k] : null),
        setProperty: (k, v) => { store[k] = String(v); },
        setProperties: (obj) => { Object.assign(store, obj); },
        deleteProperty: (k) => { delete store[k]; },
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { getUuid: () => 'uuid-1234' },
    HtmlService: {
      createHtmlOutput: (html) => ({ html, title: '', setTitle(t) { this.title = t; return this; } }),
    },
    UrlFetchApp: {
      fetch(url, options = {}) {
        calls.push({ url, options });
        const key = Object.keys(routes).find((prefix) => url.startsWith(prefix));
        if (!key) throw new Error('예상하지 못한 주소: ' + url);
        let r = routes[key];
        if (Array.isArray(r)) r = r.shift();
        if (typeof r === 'function') r = r(url, options);
        if (r instanceof Error) throw r;
        return r;
      },
    },
    ScriptApp: {
      getProjectTriggers: () => triggers.slice(),
      deleteTrigger: (t) => { triggers.splice(triggers.indexOf(t), 1); },
      newTrigger: (handler) => {
        const spec = { handler };
        const builder = {
          timeBased: () => builder,
          atHour: (h) => { spec.hour = h; return builder; },
          nearMinute: (m) => { spec.minute = m; return builder; },
          everyDays: (n) => { spec.days = n; return builder; },
          inTimezone: (tz) => { spec.tz = tz; return builder; },
          create: () => {
            created.push(spec);
            triggers.push({ getHandlerFunction: () => handler });
          },
        };
        return builder;
      },
    },
  };
  const ctx = vm.createContext(env);
  vm.runInContext(CODE, ctx, { filename: 'Code.gs' });
  ctx.now_ = () => NOW;
  const sends = () => calls.filter((c) => c.url.startsWith('https://kapi.kakao.com'));
  const tokens = () => calls.filter((c) => c.url.startsWith('https://kauth.kakao.com'));
  return { ctx, store, calls, logs, triggers, created, sends, tokens };
}

const CONFIG = {
  KAKAO_REST_API_KEY: 'REST_KEY_VALUE',
  KAKAO_CLIENT_SECRET: 'CLIENT_SECRET_VALUE',
  KAKAO_REDIRECT_URI: REDIRECT,
};
const CONNECTED = {
  ...CONFIG,
  KAKAO_ACCESS_TOKEN: 'ACCESS_OLD',
  KAKAO_ACCESS_EXPIRES_AT: String(NOW + 60 * 60 * 1000),
  KAKAO_REFRESH_TOKEN: 'REFRESH_OLD',
  KAKAO_REFRESH_EXPIRES_AT: String(NOW + 50 * 24 * 60 * 60 * 1000),
};
const OK_SEND = response(200, { result_code: 0 });
const ROUTES = {
  board: 'https://raw.githubusercontent.com/',
  send: 'https://kapi.kakao.com/v2/api/talk/memo/default/send',
  token: 'https://kauth.kakao.com/oauth/token',
};

test('보드 건수: 표는 내용 줄만, 목록은 글머리표만 센다', () => {
  const { ctx } = setup();
  const counts = ctx.countBoard_(BOARD);
  assert.strictEqual(counts['응답 대기'], 3);
  assert.strictEqual(counts['발행 대기'], 1);
  assert.strictEqual(counts['보완 필요'], 2);
});

test('보드 건수: 없는 구역은 0이 아니라 null', () => {
  const { ctx } = setup();
  const counts = ctx.countBoard_('# 작업 보드\n\n## 응답 대기\n| a |\n|---|\n');
  assert.strictEqual(counts['응답 대기'], 0);
  assert.strictEqual(counts['발행 대기'], null);
  assert.strictEqual(counts['보완 필요'], null);
});

test('보드 건수: 실제 state/BOARD.md에서 세 구역을 모두 찾는다', () => {
  const { ctx } = setup();
  const counts = ctx.countBoard_(fs.readFileSync(REAL_BOARD, 'utf8'));
  for (const name of ['응답 대기', '발행 대기', '보완 필요']) {
    assert.ok(Number.isInteger(counts[name]) && counts[name] >= 0, name + ' = ' + counts[name]);
  }
});

test('문구: 건수만 담고 업무 제목은 담지 않는다', () => {
  const { ctx } = setup();
  const text = ctx.buildSummaryText_(ctx.countBoard_(BOARD), ctx.kstParts_(NOW));
  assert.strictEqual(text, '커리어캐쳐 업무 요약 11/21(토)\n응답 대기 3건\n발행 대기 1건\n보완 필요 2건');
  assert.ok(text.length <= 200);
  assert.ok(!/비밀/.test(text));
});

test('문구: 구역을 못 찾으면 "확인 필요"로 적는다', () => {
  const { ctx } = setup();
  const text = ctx.buildSummaryText_({ '응답 대기': 2, '발행 대기': null, '보완 필요': 0 }, ctx.kstParts_(NOW));
  assert.match(text, /응답 대기 2건/);
  assert.match(text, /발행 대기 확인 필요/);
  assert.match(text, /보완 필요 0건/);
});

test('날짜: 한국 시간 기준으로 바뀐다', () => {
  const { ctx } = setup();
  assert.deepStrictEqual({ ...ctx.kstParts_(Date.parse('2026-11-20T14:59:00Z')) }, { key: '2026-11-20', label: '11/20(금)' });
  assert.deepStrictEqual({ ...ctx.kstParts_(Date.parse('2026-11-20T15:00:00Z')) }, { key: '2026-11-21', label: '11/21(토)' });
  assert.deepStrictEqual({ ...ctx.kstParts_(Date.parse('2026-12-31T15:00:00Z')) }, { key: '2027-01-01', label: '1/1(금)' });
});

test('연결 주소: 필요한 값이 모두 들어간다', () => {
  const { ctx } = setup(CONFIG);
  const url = new URL(ctx.buildAuthorizeUrl_('STATE1'));
  assert.strictEqual(url.origin + url.pathname, 'https://kauth.kakao.com/oauth/authorize');
  assert.strictEqual(url.searchParams.get('response_type'), 'code');
  assert.strictEqual(url.searchParams.get('client_id'), 'REST_KEY_VALUE');
  assert.strictEqual(url.searchParams.get('redirect_uri'), REDIRECT);
  assert.strictEqual(url.searchParams.get('scope'), 'talk_message');
  assert.strictEqual(url.searchParams.get('state'), 'STATE1');
  assert.ok(!url.href.includes('CLIENT_SECRET_VALUE'));
});

test('연결 화면: 속성이 비면 연결 단추를 보여 주지 않는다', () => {
  const { ctx, store } = setup({});
  const page = ctx.doGet({ parameter: {} });
  assert.match(page.html, /KAKAO_REST_API_KEY/);
  assert.ok(!page.html.includes('kauth.kakao.com'));
  assert.ok(!('OAUTH_STATE' in store));
});

test('연결 화면: 속성이 있으면 state를 저장하고 연결 단추를 보여 준다', () => {
  const { ctx, store } = setup(CONFIG);
  const page = ctx.doGet({ parameter: {} });
  assert.strictEqual(store.OAUTH_STATE, 'uuid-1234|' + NOW);
  assert.match(page.html, /state=uuid-1234/);
  assert.match(page.html, /target="_top"/);
  assert.ok(!page.html.includes('CLIENT_SECRET_VALUE'));
});

test('연결 완료: state가 맞으면 토큰을 받아 저장한다', () => {
  const { ctx, store, tokens } = setup({ ...CONFIG, OAUTH_STATE: 'S1|' + (NOW - 1000) }, {
    [ROUTES.token]: response(200, {
      token_type: 'bearer', access_token: 'ACCESS_NEW', expires_in: 21599,
      refresh_token: 'REFRESH_NEW', refresh_token_expires_in: 5183999, scope: 'talk_message',
    }),
  });
  const page = ctx.doGet({ parameter: { code: 'CODE1', state: 'S1' } });
  assert.match(page.html, /카카오 연결 완료/);
  assert.strictEqual(tokens().length, 1);
  assert.deepStrictEqual(decodeForm(tokens()[0].options.payload), {
    grant_type: 'authorization_code', client_id: 'REST_KEY_VALUE', redirect_uri: REDIRECT,
    code: 'CODE1', client_secret: 'CLIENT_SECRET_VALUE',
  });
  assert.strictEqual(store.KAKAO_ACCESS_TOKEN, 'ACCESS_NEW');
  assert.strictEqual(store.KAKAO_ACCESS_EXPIRES_AT, String(NOW + 21599 * 1000));
  assert.strictEqual(store.KAKAO_REFRESH_TOKEN, 'REFRESH_NEW');
  assert.strictEqual(store.KAKAO_REFRESH_EXPIRES_AT, String(NOW + 5183999 * 1000));
  assert.ok(!('OAUTH_STATE' in store));
  assert.ok(!page.html.includes('ACCESS_NEW') && !page.html.includes('REFRESH_NEW'));
});

test('연결 완료: 동의항목이 빠졌으면 알려 준다', () => {
  const { ctx } = setup({ ...CONFIG, OAUTH_STATE: 'S1|' + NOW }, {
    [ROUTES.token]: response(200, {
      access_token: 'A', expires_in: 21599, refresh_token: 'R', refresh_token_expires_in: 5183999, scope: 'profile_nickname',
    }),
  });
  const page = ctx.doGet({ parameter: { code: 'CODE1', state: 'S1' } });
  assert.match(page.html, /동의가 빠져/);
});

test('연결 거부: state가 다르거나 오래되면 토큰을 요청하지 않는다', () => {
  for (const saved of ['OTHER|' + NOW, 'S1|' + (NOW - 11 * 60 * 1000), undefined]) {
    const init = saved ? { ...CONFIG, OAUTH_STATE: saved } : { ...CONFIG };
    const { ctx, store, calls } = setup(init);
    const page = ctx.doGet({ parameter: { code: 'CODE1', state: 'S1' } });
    assert.match(page.html, /확인하지 못했습니다/);
    assert.strictEqual(calls.length, 0);
    assert.ok(!('KAKAO_REFRESH_TOKEN' in store));
  }
});

test('연결 취소: 카카오가 error를 돌려주면 안내만 하고, 내용은 이스케이프한다', () => {
  const { ctx, calls } = setup(CONFIG);
  const page = ctx.doGet({ parameter: { error: '<script>x</script>' } });
  assert.match(page.html, /취소되었습니다/);
  assert.ok(!page.html.includes('<script>x'));
  assert.strictEqual(calls.length, 0);
});

test('토큰: 유효하면 그대로 쓰고 서버에 묻지 않는다', () => {
  const { ctx, calls } = setup(CONNECTED);
  assert.strictEqual(ctx.getAccessToken_(), 'ACCESS_OLD');
  assert.strictEqual(calls.length, 0);
});

test('토큰: 만료되면 갱신하고, 새 리프레시 토큰이 없으면 기존 것을 유지한다', () => {
  const { ctx, store, tokens } = setup({ ...CONNECTED, KAKAO_ACCESS_EXPIRES_AT: String(NOW - 1) }, {
    [ROUTES.token]: response(200, { token_type: 'bearer', access_token: 'ACCESS_2', expires_in: 21599 }),
  });
  assert.strictEqual(ctx.getAccessToken_(), 'ACCESS_2');
  assert.deepStrictEqual(decodeForm(tokens()[0].options.payload), {
    grant_type: 'refresh_token', client_id: 'REST_KEY_VALUE', refresh_token: 'REFRESH_OLD',
    client_secret: 'CLIENT_SECRET_VALUE',
  });
  assert.strictEqual(store.KAKAO_ACCESS_TOKEN, 'ACCESS_2');
  assert.strictEqual(store.KAKAO_REFRESH_TOKEN, 'REFRESH_OLD');
  assert.strictEqual(store.KAKAO_REFRESH_EXPIRES_AT, CONNECTED.KAKAO_REFRESH_EXPIRES_AT);
});

test('토큰: 새 리프레시 토큰이 오면 바꿔 저장한다', () => {
  const { ctx, store } = setup({ ...CONNECTED, KAKAO_ACCESS_EXPIRES_AT: String(NOW - 1) }, {
    [ROUTES.token]: response(200, {
      access_token: 'ACCESS_2', expires_in: 21599, refresh_token: 'REFRESH_2', refresh_token_expires_in: 5183999,
    }),
  });
  ctx.getAccessToken_();
  assert.strictEqual(store.KAKAO_REFRESH_TOKEN, 'REFRESH_2');
  assert.strictEqual(store.KAKAO_REFRESH_EXPIRES_AT, String(NOW + 5183999 * 1000));
});

test('토큰: 클라이언트 시크릿을 끈 앱은 client_secret을 보내지 않는다', () => {
  const init = { ...CONNECTED, KAKAO_ACCESS_EXPIRES_AT: String(NOW - 1) };
  delete init.KAKAO_CLIENT_SECRET;
  const { ctx, tokens } = setup(init, {
    [ROUTES.token]: response(200, { access_token: 'ACCESS_2', expires_in: 21599 }),
  });
  ctx.getAccessToken_();
  assert.ok(!('client_secret' in decodeForm(tokens()[0].options.payload)));
});

test('토큰: 연결한 적이 없으면 연결하라고 알려 준다', () => {
  const { ctx, calls } = setup(CONFIG);
  assert.throws(() => ctx.getAccessToken_(), /카카오 연결이 필요/);
  assert.strictEqual(calls.length, 0);
});

test('토큰: 갱신이 거절되면 오류 코드만 담아 알린다', () => {
  const { ctx } = setup({ ...CONNECTED, KAKAO_ACCESS_EXPIRES_AT: String(NOW - 1) }, {
    [ROUTES.token]: response(400, { error: 'invalid_grant', error_description: 'expired', error_code: 'KOE322' }),
  });
  assert.throws(() => ctx.getAccessToken_(), (err) => {
    assert.match(err.message, /HTTP 400 KOE322 invalid_grant/);
    assert.ok(!err.message.includes('REFRESH_OLD') && !err.message.includes('CLIENT_SECRET_VALUE'));
    return true;
  });
});

test('매일 요약: 한 번 보내고, 같은 날 다시 실행하면 보내지 않는다', () => {
  const { ctx, store, sends, logs } = setup(CONNECTED, {
    [ROUTES.board]: () => response(200, BOARD),
    [ROUTES.send]: () => OK_SEND,
  });
  ctx.sendDailySummary({ triggerUid: 'x' });
  assert.strictEqual(sends().length, 1);
  const call = sends()[0];
  assert.strictEqual(call.options.method, 'post');
  assert.strictEqual(call.options.headers.Authorization, 'Bearer ACCESS_OLD');
  assert.strictEqual(call.options.contentType, 'application/x-www-form-urlencoded;charset=utf-8');
  const template = JSON.parse(decodeForm(call.options.payload).template_object);
  assert.deepStrictEqual(template, {
    object_type: 'text',
    text: '커리어캐쳐 업무 요약 11/21(토)\n응답 대기 3건\n발행 대기 1건\n보완 필요 2건',
    link: {
      web_url: 'https://github.com/eunkyoungAn/-/blob/main/state/BOARD.md',
      mobile_web_url: 'https://github.com/eunkyoungAn/-/blob/main/state/BOARD.md',
    },
    button_title: '보드 열기',
  });
  assert.strictEqual(store.LAST_SENT_DATE, '2026-11-21');

  ctx.sendDailySummary();
  assert.strictEqual(sends().length, 1);
  assert.ok(logs.every((line) => !/ACCESS_OLD|REFRESH_OLD|REST_KEY_VALUE|CLIENT_SECRET_VALUE/.test(line)));
});

test('매일 요약: 다음 날에는 다시 보낸다', () => {
  const { ctx, sends } = setup({ ...CONNECTED, LAST_SENT_DATE: '2026-11-20' }, {
    [ROUTES.board]: response(200, BOARD),
    [ROUTES.send]: OK_SEND,
  });
  ctx.sendDailySummary();
  assert.strictEqual(sends().length, 1);
});

test('전송: 토큰이 거절(401)되면 한 번만 갱신해 다시 보낸다', () => {
  const { ctx, store, sends, tokens } = setup(CONNECTED, {
    [ROUTES.board]: response(200, BOARD),
    [ROUTES.send]: [response(401, { msg: 'this access token does not exist', code: -401 }), OK_SEND],
    [ROUTES.token]: response(200, { access_token: 'ACCESS_2', expires_in: 21599 }),
  });
  ctx.sendDailySummary();
  assert.strictEqual(sends().length, 2);
  assert.strictEqual(tokens().length, 1);
  assert.strictEqual(sends()[1].options.headers.Authorization, 'Bearer ACCESS_2');
  assert.strictEqual(store.LAST_SENT_DATE, '2026-11-21');
});

test('전송: 401이 반복되면 더 시도하지 않고 실패로 끝낸다', () => {
  const unauthorized = () => response(401, { msg: 'no', code: -401 });
  const { ctx, store, sends } = setup(CONNECTED, {
    [ROUTES.board]: response(200, BOARD),
    [ROUTES.send]: unauthorized,
    [ROUTES.token]: response(200, { access_token: 'ACCESS_2', expires_in: 21599 }),
  });
  assert.throws(() => ctx.sendDailySummary(), /카카오 전송 실패: HTTP 401/);
  assert.strictEqual(sends().length, 2);
  assert.ok(!('LAST_SENT_DATE' in store));
});

test('전송: 동의가 없으면(-402) 다시 보내지 않고 이유를 알린다', () => {
  const { ctx, store, sends } = setup(CONNECTED, {
    [ROUTES.board]: response(200, BOARD),
    [ROUTES.send]: () => response(403, { msg: 'insufficient scopes.', code: -402 }),
  });
  assert.throws(() => ctx.sendDailySummary(), /HTTP 403 -402 insufficient scopes.*동의가 없습니다/);
  assert.strictEqual(sends().length, 1);
  assert.ok(!('LAST_SENT_DATE' in store));
});

test('전송: 응답을 못 받으면 자동으로 다시 보내지 않는다', () => {
  const { ctx, store, sends } = setup(CONNECTED, {
    [ROUTES.board]: response(200, BOARD),
    [ROUTES.send]: () => new Error('Timeout'),
  });
  assert.throws(() => ctx.sendDailySummary(), /응답을 받지 못했습니다/);
  assert.strictEqual(sends().length, 1);
  assert.ok(!('LAST_SENT_DATE' in store));
});

test('전송: 200이어도 result_code가 0이 아니면 실패로 본다', () => {
  const { ctx, store } = setup(CONNECTED, {
    [ROUTES.board]: response(200, BOARD),
    [ROUTES.send]: () => response(200, 'not json'),
  });
  assert.throws(() => ctx.sendDailySummary(), /카카오 전송 실패: HTTP 200/);
  assert.ok(!('LAST_SENT_DATE' in store));
});

test('매일 요약: 보드를 못 읽으면 그 사실만 알리고 실패로 남긴다', () => {
  const { ctx, store, sends } = setup(CONNECTED, {
    [ROUTES.board]: response(404, 'Not Found'),
    [ROUTES.send]: () => OK_SEND,
  });
  assert.throws(() => ctx.sendDailySummary(), /작업 보드를 불러오지 못했습니다: HTTP 404/);
  assert.strictEqual(sends().length, 1);
  const template = JSON.parse(decodeForm(sends()[0].options.payload).template_object);
  assert.strictEqual(template.text, '커리어캐쳐 업무 요약 11/21(토)\n작업 보드를 불러오지 못했습니다. 확인 필요');
  assert.ok(!('LAST_SENT_DATE' in store));
});

test('미리 보기: 문구만 만들고 카카오에는 보내지 않는다', () => {
  const { ctx, sends, tokens } = setup(CONFIG, { [ROUTES.board]: response(200, BOARD) });
  assert.match(ctx.previewDailySummary(), /응답 대기 3건/);
  assert.strictEqual(sends().length + tokens().length, 0);
});

test('확인용 메시지: 한 번 보내고 전송일은 기록하지 않는다', () => {
  const { ctx, store, sends } = setup(CONNECTED, { [ROUTES.send]: () => OK_SEND });
  ctx.sendTestMessage();
  assert.strictEqual(sends().length, 1);
  assert.ok(!('LAST_SENT_DATE' in store));
});

test('본문이 200자를 넘으면 잘라 보낸다', () => {
  const { ctx, sends } = setup(CONNECTED, { [ROUTES.send]: () => OK_SEND });
  ctx.sendText_('가'.repeat(250));
  const template = JSON.parse(decodeForm(sends()[0].options.payload).template_object);
  assert.strictEqual(template.text.length, 200);
});

test('알림 예약: 기존 예약을 지우고 한국 시간 8시 30분 무렵으로 하나만 만든다', () => {
  const { ctx, triggers, created } = setup(CONFIG);
  triggers.push({ getHandlerFunction: () => 'sendDailySummary' }, { getHandlerFunction: () => 'otherJob' });
  ctx.installDailyTrigger();
  assert.deepStrictEqual(created, [{ handler: 'sendDailySummary', hour: 8, minute: 30, days: 1, tz: 'Asia/Seoul' }]);
  assert.deepStrictEqual(triggers.map((t) => t.getHandlerFunction()).sort(), ['otherJob', 'sendDailySummary']);

  ctx.removeDailyTrigger();
  assert.deepStrictEqual(triggers.map((t) => t.getHandlerFunction()), ['otherJob']);
});

test('토큰 지우기: 키 설정은 남기고 토큰만 지운다', () => {
  const { ctx, store } = setup({ ...CONNECTED, OAUTH_STATE: 'S|1' });
  ctx.clearKakaoTokens();
  assert.deepStrictEqual(Object.keys(store).sort(), ['KAKAO_CLIENT_SECRET', 'KAKAO_REDIRECT_URI', 'KAKAO_REST_API_KEY']);
});
