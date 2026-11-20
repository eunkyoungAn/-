/**
 * 커리어캐쳐 카카오톡 매일 업무 요약 (번외)
 *
 * 하는 일: 매일 정해진 시각에 작업 보드(state/BOARD.md)의 건수만 세어
 *          대표 본인의 카카오톡 '나와의 채팅'으로 보낸다.
 * 보내는 곳: 카카오 '나에게 기본 템플릿으로 메시지 발송' API (로그인한 본인에게만 간다)
 * 설치 방법: 같은 폴더의 README.md
 *
 * 키와 토큰은 코드에 적지 않는다. [프로젝트 설정] > [스크립트 속성]에만 둔다.
 * 이름이 밑줄(_)로 끝나는 함수는 내부용이라 실행 목록에 나오지 않는다.
 */

// ===== 바꿀 수 있는 설정 =====
var SEND_HOUR = 8;     // 보내는 시(한국 시간, 0~23)
var SEND_MINUTE = 30;  // 보내는 분. 실제 실행은 앞뒤 15분 안에서 이뤄진다
var TITLE = '커리어캐쳐 업무 요약';
var SECTIONS = ['응답 대기', '발행 대기', '보완 필요'];  // 보드의 '## 제목' 앞부분과 맞춘다
var BOARD_URL = 'https://raw.githubusercontent.com/eunkyoungAn/-/main/state/BOARD.md';
var LINK_URL = 'https://github.com/eunkyoungAn/-/blob/main/state/BOARD.md';  // 카카오 앱에 등록한 웹 도메인이어야 한다
var BUTTON_TITLE = '보드 열기';

// ===== 고정값 =====
var KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';
var KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
var KAKAO_SEND_URL = 'https://kapi.kakao.com/v2/api/talk/memo/default/send';
var KAKAO_SCOPE = 'talk_message';
var FORM_TYPE = 'application/x-www-form-urlencoded;charset=utf-8';
var MAX_TEXT = 200;                      // 텍스트 템플릿 본문 최대 글자 수
var TOKEN_MARGIN_MS = 5 * 60 * 1000;     // 만료 5분 전이면 미리 갱신
var STATE_TTL_MS = 10 * 60 * 1000;       // 연결 주소 유효 시간
var KST_OFFSET_MS = 9 * 60 * 60 * 1000;
var TRIGGER_HANDLER = 'sendDailySummary';

// ===== 직접 실행하는 함수 =====

/** 매일 실행되는 함수. 같은 날 이미 보냈으면 다시 보내지 않는다. */
function sendDailySummary() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var today = kstParts_(now_());
    if (props_().getProperty('LAST_SENT_DATE') === today.key) {
      console.log('오늘(' + today.key + ') 요약은 이미 보냈습니다. 다시 보내지 않습니다.');
      return;
    }
    var text;
    try {
      text = buildSummaryText_(countBoard_(fetchBoard_()), today);
    } catch (boardError) {
      // 보드를 못 읽으면 그 사실만 알리고, 실행 기록에 실패로 남긴다. 전송일은 기록하지 않는다.
      sendText_(TITLE + ' ' + today.label + '\n작업 보드를 불러오지 못했습니다. 확인 필요');
      throw boardError;
    }
    sendText_(text);
    props_().setProperty('LAST_SENT_DATE', today.key);
    console.log('전송 완료: ' + today.key);
  } finally {
    lock.releaseLock();
  }
}

/** 보내지 않고 오늘 보낼 문구만 실행 기록에 찍는다. */
function previewDailySummary() {
  var text = buildSummaryText_(countBoard_(fetchBoard_()), kstParts_(now_()));
  console.log('보낼 문구(' + text.length + '자):\n' + text);
  return text;
}

/** 연결 확인용 메시지를 한 번 보낸다. */
function sendTestMessage() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    sendText_(TITLE + '\n카카오 알림 연결 확인용 메시지입니다.');
    console.log('확인용 메시지를 보냈습니다. 카카오톡 나와의 채팅을 확인하세요.');
  } finally {
    lock.releaseLock();
  }
}

/** 매일 알림 켜기. 이미 있으면 지우고 새로 만든다. */
function installDailyTrigger() {
  removeDailyTrigger();
  ScriptApp.newTrigger(TRIGGER_HANDLER)
    .timeBased()
    .atHour(SEND_HOUR)
    .nearMinute(SEND_MINUTE)
    .everyDays(1)
    .inTimezone('Asia/Seoul')
    .create();
  console.log('매일 ' + SEND_HOUR + '시 ' + SEND_MINUTE + '분 무렵(한국 시간) 알림을 켰습니다.');
}

/** 매일 알림 끄기. */
function removeDailyTrigger() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === TRIGGER_HANDLER) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });
  console.log('지운 알림 예약: ' + removed + '개');
}

/** 저장된 카카오 토큰을 지운다. 다시 쓰려면 웹 앱 주소에서 새로 연결한다. */
function clearKakaoTokens() {
  var p = props_();
  ['KAKAO_ACCESS_TOKEN', 'KAKAO_ACCESS_EXPIRES_AT', 'KAKAO_REFRESH_TOKEN',
    'KAKAO_REFRESH_EXPIRES_AT', 'OAUTH_STATE'].forEach(function (key) {
    p.deleteProperty(key);
  });
  console.log('저장된 카카오 토큰을 지웠습니다.');
}

// ===== 웹 앱: 카카오 연결 화면 =====

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.error) {
    return page_('카카오 연결이 취소되었습니다',
      '<p>동의 화면에서 취소했거나 오류가 났습니다. 이 주소를 다시 열어 처음부터 진행하세요.</p>' +
      '<p class="note">오류 코드: ' + escapeHtml_(p.error) + '</p>');
  }
  if (p.code) return handleCallback_(p);
  return statusPage_();
}

function handleCallback_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var saved = String(props_().getProperty('OAUTH_STATE') || '').split('|');
    props_().deleteProperty('OAUTH_STATE');
    var fresh = now_() - Number(saved[1]) <= STATE_TTL_MS;
    if (!p.state || saved[0] !== p.state || !fresh) {
      return page_('연결을 확인하지 못했습니다',
        '<p>연결 주소가 오래됐거나 이 화면에서 시작한 요청이 아닙니다. 웹 앱 주소를 다시 열어 처음부터 진행하세요.</p>');
    }
    var cfg = config_();
    var data = requestToken_({
      grant_type: 'authorization_code',
      client_id: cfg.restKey,
      redirect_uri: cfg.redirectUri,
      code: p.code,
      client_secret: cfg.secret
    });
    if (!data.refresh_token) throw new Error('카카오 응답에 리프레시 토큰이 없습니다.');
    saveTokens_(data, now_());
    var scopeWarning = '';
    if (data.scope && String(data.scope).split(/\s+/).indexOf(KAKAO_SCOPE) === -1) {
      scopeWarning = '<p class="warn">카카오톡 메시지 전송 동의가 빠져 있습니다. ' +
        '카카오 디벨로퍼스에서 동의항목을 설정한 뒤 다시 연결하세요.</p>';
    }
    return page_('카카오 연결 완료',
      scopeWarning +
      '<p>이 창은 닫아도 됩니다. Apps Script 편집기에서 <b>sendTestMessage</b>를 실행해 ' +
      '나와의 채팅에 메시지가 오는지 확인하세요.</p>');
  } catch (err) {
    return page_('카카오 연결 실패', '<p>' + escapeHtml_(err.message) + '</p>');
  } finally {
    lock.releaseLock();
  }
}

function statusPage_() {
  var p = props_();
  var rows = [];
  var missing = ['KAKAO_REST_API_KEY', 'KAKAO_REDIRECT_URI'].filter(function (key) {
    return !p.getProperty(key);
  });
  rows.push(['스크립트 속성', missing.length ? '비어 있음: ' + missing.join(', ') : '입력됨']);
  rows.push(['리다이렉트 URI', p.getProperty('KAKAO_REDIRECT_URI') || '-']);
  var refreshUntil = Number(p.getProperty('KAKAO_REFRESH_EXPIRES_AT') || 0);
  rows.push(['카카오 연결', p.getProperty('KAKAO_REFRESH_TOKEN')
    ? '연결됨 (리프레시 토큰 만료 예정일 ' + kstParts_(refreshUntil).key + ')'
    : '연결 안 됨']);
  rows.push(['마지막 요약 전송일', p.getProperty('LAST_SENT_DATE') || '-']);

  var html = '<table>' + rows.map(function (row) {
    return '<tr><th>' + escapeHtml_(row[0]) + '</th><td>' + escapeHtml_(row[1]) + '</td></tr>';
  }).join('') + '</table>';

  if (missing.length) {
    html += '<p>먼저 [프로젝트 설정] &gt; [스크립트 속성]에 값을 넣은 뒤 이 주소를 다시 여세요.</p>';
  } else {
    var state = Utilities.getUuid();
    p.setProperty('OAUTH_STATE', state + '|' + now_());
    html += '<p><a class="button" target="_top" href="' + escapeHtml_(buildAuthorizeUrl_(state)) +
      '">카카오 계정 연결하기</a></p>' +
      '<p class="note">누르면 카카오 로그인과 동의 화면으로 이동합니다. 10분 안에 마치세요.</p>';
  }
  return page_('카카오 알림 연결', html);
}

function page_(title, bodyHtml) {
  var html = '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>body{font-family:sans-serif;max-width:560px;margin:32px auto;padding:0 16px;line-height:1.6;color:#222}' +
    'h1{font-size:20px}table{border-collapse:collapse;width:100%;margin:16px 0}' +
    'th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:14px;word-break:break-all}' +
    'th{background:#f6f6f6;width:38%}.button{display:inline-block;background:#fee500;color:#191919;' +
    'padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold}' +
    '.note{color:#666;font-size:13px}.warn{color:#b00020}</style></head><body>' +
    '<h1>' + escapeHtml_(title) + '</h1>' + bodyHtml + '</body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(title);
}

// ===== 카카오 로그인·토큰 =====

function buildAuthorizeUrl_(state) {
  var cfg = config_();
  return KAKAO_AUTHORIZE_URL + '?' + formEncode_({
    response_type: 'code',
    client_id: cfg.restKey,
    redirect_uri: cfg.redirectUri,
    scope: KAKAO_SCOPE,
    state: state
  });
}

/** 쓸 수 있는 액세스 토큰을 돌려준다. 만료됐으면 갱신한다. */
function getAccessToken_() {
  var p = props_();
  var token = p.getProperty('KAKAO_ACCESS_TOKEN');
  var expiresAt = Number(p.getProperty('KAKAO_ACCESS_EXPIRES_AT') || 0);
  if (token && expiresAt - now_() > TOKEN_MARGIN_MS) return token;
  return refreshTokens_();
}

/** 리프레시 토큰으로 액세스 토큰을 갱신한다. 새 리프레시 토큰이 오면 바꿔 저장한다. */
function refreshTokens_() {
  var refreshToken = props_().getProperty('KAKAO_REFRESH_TOKEN');
  if (!refreshToken) {
    throw new Error('카카오 연결이 필요합니다. 웹 앱 주소를 열어 [카카오 계정 연결하기]를 누르세요.');
  }
  var cfg = config_();
  var data = requestToken_({
    grant_type: 'refresh_token',
    client_id: cfg.restKey,
    refresh_token: refreshToken,
    client_secret: cfg.secret
  });
  saveTokens_(data, now_());
  return data.access_token;
}

function requestToken_(params) {
  if (!params.client_secret) delete params.client_secret;  // 클라이언트 시크릿을 끈 앱
  var res = UrlFetchApp.fetch(KAKAO_TOKEN_URL, {
    method: 'post',
    contentType: FORM_TYPE,
    payload: formEncode_(params),
    muteHttpExceptions: true
  });
  var status = res.getResponseCode();
  var body = parseJson_(res.getContentText());
  if (status !== 200 || !body.access_token) {
    throw new Error('카카오 토큰 요청 실패: HTTP ' + status + ' ' + errorSummary_(body) +
      ' (KOE322 등 리프레시 토큰 오류면 웹 앱 주소에서 다시 연결하세요)');
  }
  return body;
}

function saveTokens_(data, nowMs) {
  var values = {
    KAKAO_ACCESS_TOKEN: data.access_token,
    KAKAO_ACCESS_EXPIRES_AT: String(nowMs + Number(data.expires_in || 0) * 1000)
  };
  if (data.refresh_token) {  // 만료가 1개월 미만으로 남았을 때만 새로 온다
    values.KAKAO_REFRESH_TOKEN = data.refresh_token;
    values.KAKAO_REFRESH_EXPIRES_AT = String(nowMs + Number(data.refresh_token_expires_in || 0) * 1000);
  }
  props_().setProperties(values);
}

// ===== 카카오 전송 =====

/**
 * 나와의 채팅으로 텍스트를 보낸다.
 * 토큰이 거절(401)된 경우에만 한 번 갱신해 다시 보낸다. 그때는 보내진 것이 없기 때문이다.
 * 응답을 받지 못한 경우에는 다시 보내지 않는다(중복 알림 방지).
 */
function sendText_(text) {
  var res = postToKakao_(text, getAccessToken_());
  if (res.status === 401) res = postToKakao_(text, refreshTokens_());
  if (res.status === 200 && res.body.result_code === 0) return true;
  var hint = res.body.code === -402
    ? ' (카카오톡 메시지 전송 동의가 없습니다. 웹 앱 주소에서 다시 연결하세요)'
    : '';
  throw new Error('카카오 전송 실패: HTTP ' + res.status + ' ' + errorSummary_(res.body) + hint);
}

function postToKakao_(text, accessToken) {
  var template = {
    object_type: 'text',
    text: String(text).slice(0, MAX_TEXT),
    link: { web_url: LINK_URL, mobile_web_url: LINK_URL },
    button_title: BUTTON_TITLE
  };
  var res;
  try {
    res = UrlFetchApp.fetch(KAKAO_SEND_URL, {
      method: 'post',
      contentType: FORM_TYPE,
      headers: { Authorization: 'Bearer ' + accessToken },
      payload: formEncode_({ template_object: JSON.stringify(template) }),
      muteHttpExceptions: true
    });
  } catch (err) {
    throw new Error('카카오 응답을 받지 못했습니다. 나와의 채팅을 먼저 확인하세요. ' +
      '와 있으면 그대로 두고, 안 왔을 때만 직접 다시 실행합니다.');
  }
  return { status: res.getResponseCode(), body: parseJson_(res.getContentText()) };
}

// ===== 작업 보드 읽기 =====

function fetchBoard_() {
  var res = UrlFetchApp.fetch(BOARD_URL, { muteHttpExceptions: true });
  var status = res.getResponseCode();
  if (status !== 200) throw new Error('작업 보드를 불러오지 못했습니다: HTTP ' + status);
  return res.getContentText();
}

/**
 * 보드 마크다운에서 구역별 건수를 센다.
 * 표가 있는 구역은 표의 내용 줄 수, 표가 없는 구역은 글머리표 줄 수.
 * 구역을 찾지 못하면 null (0건으로 꾸미지 않는다).
 */
function countBoard_(markdown) {
  var found = {};
  var current = null;
  String(markdown).split(/\r?\n/).forEach(function (line) {
    var heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = { table: false, rows: 0, bullets: 0 };
      found[heading[1]] = current;
      return;
    }
    if (!current) return;
    if (/^\s*\|/.test(line)) {
      if (/^\s*\|\s*:?-{3,}/.test(line)) current.table = true;  // 구분선 아래부터 내용
      else if (current.table) current.rows++;
    } else if (/^[-*]\s+\S/.test(line)) {
      current.bullets++;
    }
  });
  var counts = {};
  SECTIONS.forEach(function (name) {
    var title = Object.keys(found).filter(function (key) { return key.indexOf(name) === 0; })[0];
    var section = title ? found[title] : null;
    counts[name] = section ? (section.table ? section.rows : section.bullets) : null;
  });
  return counts;
}

/** 건수만 담은 문구를 만든다. 업무 이름·제목·원문은 넣지 않는다. */
function buildSummaryText_(counts, today) {
  var lines = [TITLE + ' ' + today.label];
  SECTIONS.forEach(function (name) {
    lines.push(name + ' ' + (counts[name] === null ? '확인 필요' : counts[name] + '건'));
  });
  return lines.join('\n').slice(0, MAX_TEXT);
}

// ===== 공통 도구 =====

function now_() {
  return Date.now();
}

function props_() {
  return PropertiesService.getScriptProperties();
}

function config_() {
  var p = props_();
  var cfg = {
    restKey: p.getProperty('KAKAO_REST_API_KEY'),
    redirectUri: p.getProperty('KAKAO_REDIRECT_URI'),
    secret: p.getProperty('KAKAO_CLIENT_SECRET') || ''
  };
  if (!cfg.restKey || !cfg.redirectUri) {
    throw new Error('스크립트 속성 KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI를 먼저 넣으세요.');
  }
  return cfg;
}

/** 한국 시간 기준 날짜. key는 2026-11-21, label은 11/21(토) 형식. */
function kstParts_(ms) {
  var d = new Date(ms + KST_OFFSET_MS);
  var month = d.getUTCMonth() + 1;
  var day = d.getUTCDate();
  return {
    key: d.getUTCFullYear() + '-' + pad2_(month) + '-' + pad2_(day),
    label: month + '/' + day + '(' + '일월화수목금토'.charAt(d.getUTCDay()) + ')'
  };
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n;
}

function formEncode_(params) {
  return Object.keys(params).map(function (key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
}

function parseJson_(text) {
  try {
    var value = JSON.parse(text);
    return value && typeof value === 'object' ? value : {};
  } catch (err) {
    return {};
  }
}

/** 오류 응답에서 원인만 뽑는다. 토큰이나 키는 담기지 않는다. */
function errorSummary_(body) {
  var parts = [body.error_code, body.error, body.code, body.error_description || body.msg]
    .filter(function (v) { return v !== undefined && v !== null && v !== ''; });
  return parts.join(' ').slice(0, 200);
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}
