/**
 * 커리어캐쳐 메일 발송용 Google Apps Script 웹앱.
 * 웹앱 소유자 Gmail 계정에서 메일이 발송되며 Google 일일 발송 한도가 적용됩니다.
 * 설치 방법은 README.md의 "메일 발송 설정"을 참고하세요.
 */
var SUBJECT_PREFIX = '[커리어캐쳐] ';
var MAX_BODY = 60000;
var DAILY_TOTAL_LIMIT = 80;      // 하루 전체 발송 상한
var DAILY_PER_RECIPIENT = 5;     // 같은 주소로 하루 발송 상한

function doGet() {
  return json_({ ok: true, service: 'career-catcher-mail' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var to = String(data.to || '').trim();
    var title = String(data.subject || '결과').replace(/[\r\n]+/g, ' ').slice(0, 100);
    var body = String(data.body || '');

    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to) || to.length > 254) return json_({ ok: false, error: '이메일 주소가 올바르지 않습니다.' });
    if (!body.trim()) return json_({ ok: false, error: '보낼 내용이 없습니다.' });
    if (body.length > MAX_BODY) return json_({ ok: false, error: '내용이 너무 깁니다.' });
    if (!reserve_(to)) return json_({ ok: false, error: '오늘 발송 한도를 넘었습니다. 내일 다시 시도해 주세요.' });

    MailApp.sendEmail({
      to: to,
      subject: SUBJECT_PREFIX + title,
      body: body + '\n\n— 커리어캐쳐에서 발송된 메일입니다. AI 생성 내용은 사실 여부를 확인해 주세요.',
      name: '커리어캐쳐'
    });
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: '메일 발송에 실패했습니다.' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function reserve_(to) {
  var props = PropertiesService.getScriptProperties();
  var day = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd');
  var totalKey = 'total_' + day;
  var rcptKey = 'rcpt_' + day + '_' + to.toLowerCase();
  var total = Number(props.getProperty(totalKey) || 0);
  var rcpt = Number(props.getProperty(rcptKey) || 0);
  if (total >= DAILY_TOTAL_LIMIT || rcpt >= DAILY_PER_RECIPIENT) return false;
  props.setProperty(totalKey, String(total + 1));
  props.setProperty(rcptKey, String(rcpt + 1));
  return true;
}

/** 편집기에서 한 번 실행해 메일 발송 권한을 승인하세요. */
function authorize() {
  MailApp.getRemainingDailyQuota();
}

/** 선택: 하루 지난 카운터 정리 (시간 기반 트리거에 연결). */
function cleanup() {
  var props = PropertiesService.getScriptProperties();
  var day = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd');
  var all = props.getProperties();
  Object.keys(all).forEach(function (k) {
    var m = /^(?:total|rcpt)_(\d{8})/.exec(k);
    if (m && m[1] !== day) props.deleteProperty(k);
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
