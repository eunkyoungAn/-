const CE_CONFIG = Object.freeze({
  APP_NAME: 'Career Escape',
  DB_PROPERTY: 'CAREER_ESCAPE_SPREADSHEET_ID',
  GEMINI_KEY_PROPERTY: 'GEMINI_API_KEY',
  GEMINI_MODEL_PROPERTY: 'GEMINI_MODEL',
  DART_KEY_PROPERTY: 'DART_API_KEY',
  SCHEMA_VERSION_PROPERTY: 'CAREER_ESCAPE_SCHEMA_VERSION',
  SCHEMA_VERSION: '2',
  DART_CACHE_SECONDS: 21600,
  DART_YEARS_BACK: 2,
  MAX_QUESTIONS: 5,
  MIN_QUESTIONS: 4,
  MAX_INPUT: 6000,
  TIME_ZONE: 'Asia/Seoul'
});

const CE_SHEETS = Object.freeze({
  '세션': [
    '세션ID', '시작일시', '이름', '이메일', '희망직무', '희망기업',
    '채용공고 URL', '채용공고 본문', '개인정보·AI처리 동의', '진행상태',
    '현재질문', '현재필드', '완료일시', '이메일상태'
  ],
  '직무분석': [
    '세션ID', '희망직무', '희망기업', '요구역량 근거', '요구역량 JSON',
    '공식 사실', 'AI 분석', '출처 제목', '출처 URL', '기준일', '한계',
    '기업 요약 JSON', '직무 연관부문 JSON'
  ],
  '답변': [
    '응답일시', '세션ID', '질문번호', '질문', '답변', '경험 필드', '근거 상태'
  ],
  '경험카드': [
    '세션ID', '경험명', '상황', '역할', '문제', '행동', '성과·학습',
    '증빙자료', '연결 역량', '근거 상태', '추가 확인 필요', '생성일시'
  ],
  '결과물': [
    '세션ID', '추천 문항', '자기소개서 초안', '수정 포인트',
    '근거 없는 주장', '경고·한계', '결과 JSON', '생성일시'
  ],
  '면접질문': [
    '세션ID', '번호', '질문 유형', '질문', '연결 경험', '답변 근거', '꼬리질문'
  ],
  '오류로그': ['발생일시', '세션ID', '단계', '오류 내용']
});

let CE_DB_CACHE = null;

/* -------------------------------------------------------------------------
   Gemini 키 정책 (BYOK: 사용자가 자기 키를 씀)
   - 웹앱 사용자는 첫 화면에서 본인 Gemini API 키를 입력한다.
   - 키는 요청마다 함께 전달되어 그 요청 안에서만 사용되고, 시트·캐시·로그에 저장하지 않는다.
   - 관리자 키(Script Properties)는 시트 메뉴의 연결 테스트용이며, 사용자 키가 없을 때
     ALLOW_ADMIN_GEMINI_FALLBACK 가 true일 때만 대신 쓴다.
   ------------------------------------------------------------------------- */
const CE_GEMINI_POLICY = Object.freeze({
  ALLOW_ADMIN_GEMINI_FALLBACK: false
});
let CE_REQUEST_GEMINI_KEY = '';

// 키는 접두사·길이를 가정하지 않고 앞뒤 공백만 제거한다. 유효성은 Google 응답으로 확인한다.
function normalizeGeminiKey_(key) {
  return String(key === undefined || key === null ? '' : key).trim();
}

function setRequestGeminiKey_(key) {
  CE_REQUEST_GEMINI_KEY = normalizeGeminiKey_(key);
}

function resolveGeminiKey_() {
  if (CE_REQUEST_GEMINI_KEY) return CE_REQUEST_GEMINI_KEY;
  if (CE_GEMINI_POLICY.ALLOW_ADMIN_GEMINI_FALLBACK) {
    const adminKey = PropertiesService.getScriptProperties().getProperty(CE_CONFIG.GEMINI_KEY_PROPERTY);
    if (adminKey) return normalizeGeminiKey_(adminKey);
  }
  return '';
}

/** 사용자 키가 실제로 동작하는지 가볍게 확인한다 (모델 목록 조회). */
function validateGeminiKey_(apiKey) {
  const key = normalizeGeminiKey_(apiKey);
  if (!key) return {ok: false, message: 'Gemini API 키를 입력해 주세요.'};
  try {
    const response = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=5', {
      headers: {'x-goog-api-key': key},
      muteHttpExceptions: true
    });
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) return {ok: true, message: '정상'};
    if (code === 400 || code === 401) return {ok: false, message: 'Gemini API 키를 인증하지 못했습니다. Google AI Studio에서 발급한 키 전체를 다시 붙여넣어 주세요.'};
    if (code === 403) return {ok: false, message: '이 키로 Gemini API에 접근할 권한이 없습니다. 키의 API 제한과 프로젝트의 Gemini API 사용 설정을 확인해 주세요.'};
    if (code === 429) return {ok: false, message: '이 Gemini API 키의 사용 한도를 잠시 초과했습니다. 잠시 후 다시 시도해 주세요.'};
    return {ok: false, message: 'Gemini 서버 응답 오류(' + code + '). 잠시 후 다시 시도해 주세요.'};
  } catch (error) {
    return {ok: false, message: 'Gemini 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'};
  }
}

/** 웹앱에서 호출: 키 입력 직후 "키 확인" 버튼용. 키는 저장하지 않는다. */
function checkGeminiKey(apiKey) {
  return validateGeminiKey_(apiKey);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Career Escape')
    .addItem('1. 초기 설정', 'setupCareerEscape')
    .addSeparator()
    .addItem('관리자 테스트용 Gemini 키 설정 (선택)', 'setGeminiApiKey')
    .addItem('DART API 키 설정', 'setDartApiKey')
    .addItem('API 설정 상태 확인', 'showApiStatus')
    .addItem('Gemini 연결 테스트', 'testGeminiConnection')
    .addItem('DART 연결 테스트', 'testDartConnection')
    .addSeparator()
    .addItem('자체 점검 실행', 'runCareerEscapeSelfTest')
    .addToUi();
}

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CE_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function setupCareerEscape() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Google Sheets에 연결된 Apps Script에서 실행해 주세요.');
  PropertiesService.getScriptProperties().setProperty(CE_CONFIG.DB_PROPERTY, spreadsheet.getId());
  ensureSheets_(spreadsheet);
  PropertiesService.getScriptProperties().setProperty(CE_CONFIG.SCHEMA_VERSION_PROPERTY, CE_CONFIG.SCHEMA_VERSION);
  SpreadsheetApp.getUi().alert(
    'Career Escape 초기 설정 완료',
    '필요한 시트를 확인했습니다. 다음으로 Gemini API 키를 설정하고 웹앱으로 배포해 주세요.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  return getAdminStatus_();
}

function setGeminiApiKey() {
  setSecretFromPrompt_(
    CE_CONFIG.GEMINI_KEY_PROPERTY,
    'Gemini API 키 설정',
    '관리자 연결 테스트에만 쓰는 키입니다. 서비스 사용자는 화면에서 본인 키를 입력합니다. 키는 Script Properties에만 저장됩니다.'
  );
}

function setDartApiKey() {
  setSecretFromPrompt_(
    CE_CONFIG.DART_KEY_PROPERTY,
    'DART API 키 설정',
    'OpenDART에서 발급받은 새 키를 입력하세요. 채팅에 노출했던 키는 폐기 후 재발급한 키를 사용하세요.'
  );
}

function setSecretFromPrompt_(propertyName, title, message) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const value = response.getResponseText().trim();
  if (value.length < 20) {
    ui.alert('입력값이 너무 짧습니다. 발급 페이지에서 키 전체를 다시 확인해 주세요.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty(propertyName, value);
  ui.alert('설정되었습니다. API 키 값은 시트와 소스코드에 기록되지 않습니다.');
}

function showApiStatus() {
  const status = getAdminStatus_();
  SpreadsheetApp.getUi().alert(
    'Career Escape 설정 상태',
    [
      'DB 연결: ' + (status.databaseReady ? '완료' : '필요'),
      'Gemini: 사용자 본인 키 입력 방식 (관리자 테스트용 키 ' + (status.geminiReady ? '설정됨' : '미설정') + ')',
      'DART: ' + (status.dartReady ? '설정됨' : '미설정(선택)'),
      '남은 메일 수신자 한도: ' + status.remainingEmailQuota
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function testGeminiConnection() {
  try {
    const adminKey = PropertiesService.getScriptProperties().getProperty(CE_CONFIG.GEMINI_KEY_PROPERTY);
    if (!adminKey) throw new Error('관리자 테스트용 Gemini 키가 없습니다. (서비스 사용자는 본인 키를 화면에서 입력합니다)');
    setRequestGeminiKey_(adminKey);
    const result = callGeminiJson_(
      '연결 점검이다. ok는 true, message는 "정상 연결"로만 반환하라.',
      {type: 'OBJECT', required: ['ok', 'message'], properties: {ok: {type: 'BOOLEAN'}, message: {type: 'STRING'}}}
    );
    SpreadsheetApp.getUi().alert('Gemini 연결 테스트', result.ok ? '정상 연결되었습니다.' : '응답은 받았지만 점검 결과를 확인해 주세요.', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Gemini 연결 실패', safeError_(error).message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function testDartConnection() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('DART 연결 테스트', '정확한 법인명을 입력하세요. 예: 삼성전자', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const company = clean_(response.getResponseText(), 120);
  if (!company) return;
  const result = fetchDartCompanyBrief_(company);
  const lines = result.matched
    ? ['정상 연결: ' + result.company_name + ' (' + result.as_of + ')'].concat(result.facts.slice(0, 6))
    : result.limitations;
  ui.alert('DART 연결 테스트', lines.join('\n'), ui.ButtonSet.OK);
}

function getAdminStatus_() {
  const props = PropertiesService.getScriptProperties();
  return {
    databaseReady: Boolean(props.getProperty(CE_CONFIG.DB_PROPERTY)),
    geminiReady: Boolean(props.getProperty(CE_CONFIG.GEMINI_KEY_PROPERTY)),
    dartReady: Boolean(props.getProperty(CE_CONFIG.DART_KEY_PROPERTY)),
    remainingEmailQuota: MailApp.getRemainingDailyQuota()
  };
}

function getPublicConfig() {
  const status = getAdminStatus_();
  return {
    appName: CE_CONFIG.APP_NAME,
    ready: status.databaseReady,
    geminiMode: 'user',
    dartReady: status.dartReady,
    message: status.databaseReady ? '' : '관리자가 아직 데이터 저장 설정을 완료하지 않았습니다.'
  };
}

function startSession(form) {
  try {
    const input = validateStartForm_(form);
    const status = getAdminStatus_();
    if (!status.databaseReady) throw new Error('관리자가 데이터베이스 초기 설정을 완료하지 않았습니다.');

    setRequestGeminiKey_(input.geminiKey);
    if (!resolveGeminiKey_()) throw new Error('Gemini API 키를 입력해 주세요. (Google AI Studio에서 무료로 발급)');
    const keyCheck = validateGeminiKey_(resolveGeminiKey_());
    if (!keyCheck.ok) throw new Error(keyCheck.message);

    enforceStartRateLimit_(input.email);
    const sessionId = Utilities.getUuid();
    const startedAt = now_();
    const dart = input.company ? fetchDartCompanyBrief_(input.company) : emptyDartBrief_('희망기업 미입력');
    const targetAnalysis = analyzeTarget_(input, dart);
    const firstQuestion = '희망직무와 연결해 보여주고 싶은 경험 중 가장 먼저 떠오르는 장면은 무엇인가요?';

    withDocumentLock_(function () {
      appendObject_('세션', {
        '세션ID': sessionId,
        '시작일시': startedAt,
        '이름': input.name,
        '이메일': input.email,
        '희망직무': input.role,
        '희망기업': input.company,
        '채용공고 URL': input.postingUrl,
        '채용공고 본문': input.postingText,
        '개인정보·AI처리 동의': '동의',
        '진행상태': '진행중',
        '현재질문': firstQuestion,
        '현재필드': 'context',
        '완료일시': '',
        '이메일상태': '미발송'
      });
      appendObject_('직무분석', {
        '세션ID': sessionId,
        '희망직무': input.role,
        '희망기업': input.company,
        '요구역량 근거': targetAnalysis.requirements_basis,
        '요구역량 JSON': JSON.stringify(targetAnalysis.requirements),
        '공식 사실': targetAnalysis.official_facts.join('\n'),
        'AI 분석': targetAnalysis.analysis,
        '출처 제목': targetAnalysis.source_title,
        '출처 URL': targetAnalysis.source_url,
        '기준일': today_(),
        '한계': targetAnalysis.limitations.join('\n'),
        '기업 요약 JSON': JSON.stringify(dart),
        '직무 연관부문 JSON': JSON.stringify(targetAnalysis.company_fit || null)
      });
    });

    return {
      sessionId: sessionId,
      question: firstQuestion,
      questionNumber: 1,
      totalQuestions: CE_CONFIG.MAX_QUESTIONS,
      requirements: targetAnalysis.requirements.map(function (item) { return item.keyword; }),
      requirementsBasis: targetAnalysis.requirements_basis,
      warning: targetAnalysis.limitations.join(' '),
      company: buildCompanyView_(input.company, dart, targetAnalysis.company_fit)
    };
  } catch (error) {
    logError_('', 'startSession', error);
    throw safeError_(error);
  }
}

function submitAnswer(sessionId, answer, geminiKey) {
  try {
    const id = clean_(sessionId, 80);
    const response = clean_(answer, CE_CONFIG.MAX_INPUT);
    if (!id) throw new Error('세션 정보가 없습니다. 처음부터 다시 시작해 주세요.');
    if (response.length < 10) throw new Error('경험을 구체적으로 10자 이상 적어주세요.');
    setRequestGeminiKey_(geminiKey);
    if (!resolveGeminiKey_()) throw new Error('Gemini API 키가 없습니다. 첫 화면에서 키를 다시 입력해 주세요.');

    const session = getObjectById_('세션', id);
    if (!session) throw new Error('세션을 찾을 수 없습니다. 처음부터 다시 시작해 주세요.');
    if (session['진행상태'] === '완료') return resumeSession(id);

    const previousAnswers = getAnswers_(id);
    const lastAnswer = previousAnswers.length ? previousAnswers[previousAnswers.length - 1] : null;
    const alreadySaved = lastAnswer && normalizeText_(lastAnswer.question) === normalizeText_(session['현재질문']);
    let answers = previousAnswers;
    if (!alreadySaved) {
      const questionNumber = previousAnswers.length + 1;
      withDocumentLock_(function () {
        appendObject_('답변', {
          '응답일시': now_(),
          '세션ID': id,
          '질문번호': questionNumber,
          '질문': session['현재질문'],
          '답변': response,
          '경험 필드': session['현재필드'],
          '근거 상태': 'user_stated'
        });
      });
      answers = previousAnswers.concat([{
        question: session['현재질문'],
        answer: response,
        field: session['현재필드']
      }]);
    }

    if (answers.length >= CE_CONFIG.MAX_QUESTIONS) {
      return completeSession_(session, answers);
    }

    let next;
    try {
      next = planNextQuestion_(session, answers);
    } catch (questionError) {
      logError_(id, 'planNextQuestion', questionError);
      next = {complete: false, question: '', field: '', reason: 'AI 연결이 지연되어 기본 질문으로 이어갑니다.'};
    }
    if (next.complete && answers.length >= CE_CONFIG.MIN_QUESTIONS && hasCoreEvidence_(answers)) {
      return completeSession_(session, answers);
    }

    const safeNext = ensureFreshQuestion_(next, answers, session['현재질문']);
    updateObjectById_('세션', id, {
      '현재질문': safeNext.question,
      '현재필드': safeNext.field
    });
    return {
      complete: false,
      sessionId: id,
      question: safeNext.question,
      questionNumber: answers.length + 1,
      totalQuestions: CE_CONFIG.MAX_QUESTIONS,
      clue: safeNext.reason || '다음 단서를 확인합니다.'
    };
  } catch (error) {
    logError_(sessionId, 'submitAnswer', error);
    throw safeError_(error);
  }
}

function finishSession(sessionId, geminiKey) {
  try {
    const id = clean_(sessionId, 80);
    const session = getObjectById_('세션', id);
    const answers = getAnswers_(id);
    if (!session) throw new Error('세션을 찾을 수 없습니다.');
    if (answers.length < 3) throw new Error('결과를 만들려면 최소 3개의 질문에 답해주세요.');
    setRequestGeminiKey_(geminiKey);
    if (!resolveGeminiKey_()) throw new Error('Gemini API 키가 없습니다. 첫 화면에서 키를 다시 입력해 주세요.');
    return completeSession_(session, answers);
  } catch (error) {
    logError_(sessionId, 'finishSession', error);
    throw safeError_(error);
  }
}

function resumeSession(sessionId) {
  try {
    const id = clean_(sessionId, 80);
    const session = getObjectById_('세션', id);
    if (!session) return {found: false};
    if (session['진행상태'] === '완료') {
      const output = getObjectById_('결과물', id);
      if (!output || !output['결과 JSON']) return {found: false};
      return {
        found: true,
        complete: true,
        sessionId: id,
        result: JSON.parse(output['결과 JSON']),
        emailSent: session['이메일상태'] === '발송완료'
      };
    }
    const answers = getAnswers_(id);
    const analysis = getObjectById_('직무분석', id);
    let requirements = [];
    try { requirements = JSON.parse(analysis['요구역량 JSON'] || '[]').map(function (x) { return x.keyword; }); } catch (ignore) {}
    const stored = readStoredCompany_(analysis);
    return {
      found: true,
      complete: false,
      sessionId: id,
      question: session['현재질문'],
      questionNumber: answers.length + 1,
      totalQuestions: CE_CONFIG.MAX_QUESTIONS,
      requirements: requirements,
      requirementsBasis: analysis ? analysis['요구역량 근거'] : 'provisional',
      company: buildCompanyView_(session['희망기업'], stored.brief, stored.fit)
    };
  } catch (error) {
    logError_(sessionId, 'resumeSession', error);
    throw safeError_(error);
  }
}

function resendResultEmail(sessionId) {
  try {
    const id = clean_(sessionId, 80);
    const session = getObjectById_('세션', id);
    const output = getObjectById_('결과물', id);
    if (!session || !output) throw new Error('완료된 결과를 찾을 수 없습니다.');
    const result = JSON.parse(output['결과 JSON']);
    sendResultEmail_(session, result);
    updateObjectById_('세션', id, {'이메일상태': '발송완료'});
    return {ok: true};
  } catch (error) {
    logError_(sessionId, 'resendResultEmail', error);
    throw safeError_(error);
  }
}

function completeSession_(session, answers) {
  const sessionId = session['세션ID'];
  const analysis = getObjectById_('직무분석', sessionId);
  const result = generateFinalPacket_(session, analysis, answers);
  validateFinalPacket_(result);
  const createdAt = now_();

  withDocumentLock_(function () {
    appendObject_('경험카드', {
      '세션ID': sessionId,
      '경험명': result.experience_card.title,
      '상황': result.experience_card.context,
      '역할': result.experience_card.role,
      '문제': result.experience_card.problem,
      '행동': result.experience_card.actions.join('\n'),
      '성과·학습': result.experience_card.results.join('\n'),
      '증빙자료': result.experience_card.artifacts.join('\n'),
      '연결 역량': result.experience_card.competencies.join(', '),
      '근거 상태': result.experience_card.evidence_status,
      '추가 확인 필요': result.experience_card.missing_fields.join('\n'),
      '생성일시': createdAt
    });
    appendObject_('결과물', {
      '세션ID': sessionId,
      '추천 문항': result.cover_letter.recommended_question,
      '자기소개서 초안': result.cover_letter.draft,
      '수정 포인트': result.cover_letter.revision_points.join('\n'),
      '근거 없는 주장': result.cover_letter.unsupported_claims.join('\n'),
      '경고·한계': result.warnings.join('\n'),
      '결과 JSON': JSON.stringify(result),
      '생성일시': createdAt
    });
    result.interview.questions.forEach(function (item, index) {
      appendObject_('면접질문', {
        '세션ID': sessionId,
        '번호': index + 1,
        '질문 유형': item.type,
        '질문': item.question,
        '연결 경험': item.linked_experience,
        '답변 근거': item.answer_evidence,
        '꼬리질문': item.follow_ups.join('\n')
      });
    });
  });

  let emailSent = false;
  let emailMessage = '';
  try {
    sendResultEmail_(session, result);
    emailSent = true;
    emailMessage = '입력한 이메일로 결과를 발송했습니다.';
  } catch (mailError) {
    emailMessage = '결과는 저장되었지만 이메일 발송에 실패했습니다. 화면의 재발송 버튼을 이용해 주세요.';
    logError_(sessionId, 'email', mailError);
  }
  updateObjectById_('세션', sessionId, {
    '진행상태': '완료',
    '완료일시': createdAt,
    '이메일상태': emailSent ? '발송완료' : '발송실패'
  });
  return {
    complete: true,
    found: true,
    sessionId: sessionId,
    result: result,
    emailSent: emailSent,
    emailMessage: emailMessage
  };
}

function analyzeTarget_(input, dart) {
  const sourceBacked = Boolean(input.postingText);
  const unitNames = dart.matched && dart.employees ? dart.employees.units.map(function (u) { return u.name; }) : [];
  const prompt = [
    '당신은 Career Escape의 직무분석 엔진이다.',
    '사용자 입력과 제공된 공식정보만 사용한다. 사실과 해석을 분리한다.',
    '채용공고 본문이 없으면 요구역량은 provisional로 표시하고 공고 근거처럼 말하지 않는다.',
    '채용공고 URL만 있고 본문이 없으면 URL을 읽었다고 주장하지 않는다.',
    '',
    '희망직무: ' + input.role,
    '희망기업: ' + (input.company || '미정'),
    '채용공고 URL: ' + (input.postingUrl || '없음'),
    '채용공고 본문:\n' + (input.postingText || '없음'),
    '',
    '[DART 공식 사실] (사업보고서 기반, 아래 항목만 사실로 인정한다)',
    dart.matched ? dart.facts.join('\n') : '해당 기업의 DART 공시 정보 없음 (' + dart.limitations.join(' / ') + ')',
    '',
    '[DART 직원현황 사업부문 목록] ' + (unitNames.length ? unitNames.join(', ') : '없음'),
    '',
    '작업 1. 3~7개의 핵심 요구역량을 추출하라. 공고 본문이 없으면 일반적 예시라는 한계를 명시하라.',
    'requirements_basis는 반드시 ' + (sourceBacked ? 'source_backed' : 'provisional') + '로 반환하라.',
    '',
    '작업 2. company_fit: 희망직무와 연관성이 높은 사업부문을 추정하라. 이것은 해석이며 사실이 아니다.',
    '- related_units.unit 값은 반드시 위 [DART 직원현황 사업부문 목록]에 있는 이름 그대로만 사용한다. 목록이 없으면 related_units는 빈 배열로 둔다.',
    '- reason에는 어떤 공식 사실(직원 규모, 근속, 급여, 매출·이익 추이)을 근거로 그렇게 판단했는지 적는다.',
    '- characteristics에는 인력 규모·근속·급여·재무 추이로 본 조직 특징을 2~3문장으로 쓰되, 공식 사실에 없는 수치나 조직문화를 지어내지 않는다.',
    '- how_to_use에는 이 정보를 자기소개서 지원동기와 면접 답변에 쓰는 구체적 방법을 2~3개 적는다.',
    '- confidence: DART 사실이 있고 부문 목록에서 골랐으면 dart_backed, DART 사실이 없거나 부문 목록이 없으면 none.'
  ].join('\n');
  const schema = {
    type: 'OBJECT',
    required: ['requirements_basis', 'requirements', 'analysis', 'limitations', 'company_fit'],
    properties: {
      requirements_basis: {type: 'STRING', enum: ['source_backed', 'provisional']},
      requirements: {type: 'ARRAY', items: {type: 'OBJECT', required: ['keyword', 'category', 'evidence', 'source_url'], properties: {
        keyword: {type: 'STRING'}, category: {type: 'STRING'}, evidence: {type: 'STRING'}, source_url: {type: 'STRING'}
      }}},
      analysis: {type: 'STRING'},
      limitations: {type: 'ARRAY', items: {type: 'STRING'}},
      company_fit: {type: 'OBJECT', required: ['related_units', 'characteristics', 'how_to_use', 'confidence'], properties: {
        related_units: {type: 'ARRAY', items: {type: 'OBJECT', required: ['unit', 'reason'], properties: {unit: {type: 'STRING'}, reason: {type: 'STRING'}}}},
        characteristics: {type: 'STRING'},
        how_to_use: {type: 'ARRAY', items: {type: 'STRING'}},
        confidence: {type: 'STRING', enum: ['dart_backed', 'none']}
      }}
    }
  };
  const result = callGeminiJson_(prompt, schema);
  result.requirements_basis = sourceBacked ? 'source_backed' : 'provisional';
  result.official_facts = dart.matched ? dart.facts.slice() : [];
  result.company_fit = sanitizeCompanyFit_(result.company_fit, unitNames, dart.matched);
  if (sourceBacked) {
    result.source_title = '사용자가 입력한 채용공고';
    result.source_url = input.postingUrl || '';
  } else if (dart.matched && dart.source_url) {
    result.source_title = 'OpenDART ' + dart.as_of;
    result.source_url = dart.source_url;
  } else {
    result.source_title = '';
    result.source_url = '';
  }
  if (!sourceBacked) {
    result.limitations = uniqueStrings_((result.limitations || []).concat(['채용공고 본문이 없어 요구역량은 잠정 분석이며 적합도 개수를 계산하지 않습니다.']));
  }
  if (input.postingUrl && !input.postingText) {
    result.limitations = uniqueStrings_((result.limitations || []).concat(['채용공고 URL의 본문은 자동 수집하지 않았습니다. 공고 내용을 붙여넣으면 정확도가 높아집니다.']));
  }
  if (dart.limitations && dart.limitations.length) {
    result.limitations = uniqueStrings_((result.limitations || []).concat(dart.limitations));
  }
  return result;
}

function planNextQuestion_(session, answers) {
  const prompt = [
    'Career Escape 경험 발굴 코치로서 다음 질문 딱 하나만 정한다.',
    '이미 물은 질문을 반복하지 않는다. 사용자가 말하지 않은 사실을 가정하지 않는다.',
    '다음 필드 중 아직 부족한 것을 우선한다: context, role, problem, actions, method, results, artifacts, competencies.',
    '구체적인 개인 행동과 결과 또는 학습이 모두 확인되어야 complete=true다.',
    '',
    '희망직무: ' + session['희망직무'],
    '희망기업: ' + (session['희망기업'] || '미정'),
    '지금까지 문답:\n' + JSON.stringify(answers),
    '',
    '질문은 한국어 한 문장으로, 여러 질문을 한꺼번에 묻지 마라.'
  ].join('\n');
  const schema = {
    type: 'OBJECT',
    required: ['complete', 'question', 'field', 'reason'],
    properties: {
      complete: {type: 'BOOLEAN'},
      question: {type: 'STRING'},
      field: {type: 'STRING', enum: ['context', 'role', 'problem', 'actions', 'method', 'results', 'artifacts', 'competencies']},
      reason: {type: 'STRING'}
    }
  };
  return callGeminiJson_(prompt, schema);
}

function generateFinalPacket_(session, analysis, answers) {
  analysis = analysis || {};
  let requirements = [];
  try { requirements = JSON.parse(analysis['요구역량 JSON'] || '[]'); } catch (ignore) {}
  const basis = analysis['요구역량 근거'] || 'provisional';
  const stored = readStoredCompany_(analysis);
  const companyFacts = stored.brief && stored.brief.matched ? stored.brief.facts : [];
  const companyFit = stored.fit && stored.fit.confidence === 'dart_backed' ? stored.fit : null;
  const prompt = [
    '당신은 Career Escape의 최종 결과 생성 엔진이다.',
    '아래 사용자 문답에 존재하는 사실만 사용한다. 경험, 수치, 도구, 성과를 절대 만들어내지 않는다.',
    '불명확한 정보는 missing_fields, unsupported_claims, warnings에 넣는다.',
    '자기소개서 초안은 500~700자 내외의 자연스러운 한국어로 작성한다.',
    '면접질문은 정확히 10개를 만들고, 확인되지 않은 수치를 사실로 전제하지 않는다.',
    '요구역량 근거가 provisional이면 requirements_supported와 requirements_total을 모두 0으로 두고 적합도 개수를 계산하지 않는다.',
    '공고 근거가 source_backed일 때만 실제 요구역량 목록을 분모로 사용한다.',
    companyFacts.length
      ? '희망기업 공식 사실이 있으면: company 유형 면접질문 2개 이상은 이 사실을 근거로 만들고, 자기소개서 지원동기에는 아래 공식 사실에 있는 수치만 인용한다. 그 외 기업 수치는 쓰지 않는다.'
      : '희망기업 공식 사실이 없으므로 기업 수치·규모·실적을 언급하지 않는다.',
    '',
    '세션 정보:\n' + JSON.stringify({
      targetRole: session['희망직무'],
      company: session['희망기업'],
      postingUrl: session['채용공고 URL'],
      postingText: session['채용공고 본문']
    }),
    '직무 요구역량:\n' + JSON.stringify(requirements),
    '요구역량 근거: ' + basis,
    '희망기업 공식 사실 (DART):\n' + (companyFacts.length ? companyFacts.join('\n') : '없음'),
    '희망기업 직무 연관부문 해석 (AI 추정, 사실 아님):\n' + (companyFit ? JSON.stringify(companyFit) : '없음'),
    '사용자 문답:\n' + JSON.stringify(answers)
  ].join('\n');
  const schema = finalPacketSchema_();
  const result = callGeminiJson_(prompt, schema);
  result.target = {
    role: session['희망직무'],
    company: session['희망기업'] || '',
    posting_url: session['채용공고 URL'] || ''
  };
  result.requirements_basis = basis;
  result.role_requirements = requirements;
  result.company_analysis = buildCompanyView_(session['희망기업'], stored.brief, stored.fit);
  if (basis !== 'source_backed') {
    result.match.requirements_supported = 0;
    result.match.requirements_total = 0;
    result.warnings = uniqueStrings_((result.warnings || []).concat(['채용공고 본문이 없어 직무 연결은 잠정 분석이며 적합도 개수는 계산하지 않았습니다.']));
  } else {
    result.match.requirements_total = requirements.length;
    result.match.requirements_supported = Math.max(0, Math.min(Number(result.match.requirements_supported) || 0, requirements.length));
  }
  if (result.experience_card.evidence_status === 'verified') result.experience_card.evidence_status = 'user_stated';
  result.interview.questions = normalizeInterviewQuestions_(result.interview.questions, result.experience_card);
  flagUnsupportedNumbers_(result, answers, (session['채용공고 본문'] || '') + '\n' + companyFacts.join('\n'));
  return result;
}

function normalizeInterviewQuestions_(questions, card) {
  const defaults = [
    '이 경험의 상황과 목표를 간단히 설명해 주세요.',
    '당시 본인이 직접 맡은 역할은 무엇이었나요?',
    '가장 해결하기 어려웠던 문제는 무엇이었나요?',
    '문제를 해결하기 위해 가장 먼저 한 행동은 무엇이었나요?',
    '행동 방법이나 우선순위를 정한 기준은 무엇이었나요?',
    '다른 사람과 협업했다면 본인이 담당한 부분은 무엇이었나요?',
    '결과가 개선되었다는 것을 어떻게 확인했나요?',
    '이 경험에서 부족했다고 느낀 점은 무엇인가요?',
    '이 경험이 희망직무 수행에 어떻게 도움이 된다고 생각하나요?',
    '같은 상황을 다시 맡는다면 무엇을 다르게 하겠나요?'
  ];
  const normalized = (Array.isArray(questions) ? questions : []).map(function (item) {
    return {
      type: ['experience', 'evidence_check', 'role', 'company', 'gap'].indexOf(item.type) >= 0 ? item.type : 'experience',
      question: clean_(item.question, 500),
      linked_experience: clean_(item.linked_experience || card.title, 300),
      answer_evidence: clean_(item.answer_evidence, 1000),
      follow_ups: Array.isArray(item.follow_ups) ? item.follow_ups.map(function (x) { return clean_(x, 500); }).filter(Boolean) : []
    };
  }).filter(function (item) { return item.question; });
  const seen = normalized.map(function (item) { return normalizeText_(item.question); });
  defaults.forEach(function (question) {
    if (normalized.length >= 10) return;
    if (seen.indexOf(normalizeText_(question)) >= 0) return;
    normalized.push({
      type: 'evidence_check',
      question: question,
      linked_experience: card.title,
      answer_evidence: '사용자 경험카드 확인',
      follow_ups: []
    });
  });
  return normalized.slice(0, 10);
}

function validateFinalPacket_(result) {
  if (!result || !result.experience_card || !result.cover_letter || !result.interview || !result.match) {
    throw new Error('AI 결과에 필수 항목이 빠졌습니다. 다시 시도해 주세요.');
  }
  const card = result.experience_card;
  ['title', 'context', 'role', 'problem'].forEach(function (key) {
    if (typeof card[key] !== 'string') throw new Error('경험카드 형식이 올바르지 않습니다.');
  });
  ['actions', 'results', 'artifacts', 'competencies', 'missing_fields'].forEach(function (key) {
    if (!Array.isArray(card[key])) throw new Error('경험카드 목록 형식이 올바르지 않습니다.');
  });
  if (!Array.isArray(result.interview.questions) || result.interview.questions.length !== 10) {
    throw new Error('면접질문 10개가 생성되지 않았습니다. 다시 시도해 주세요.');
  }
  if (!Array.isArray(result.cover_letter.revision_points)) result.cover_letter.revision_points = [];
  if (!Array.isArray(result.cover_letter.unsupported_claims)) result.cover_letter.unsupported_claims = [];
  if (!Array.isArray(result.warnings)) result.warnings = [];
}

function flagUnsupportedNumbers_(result, answers, postingText) {
  const evidence = answers.map(function (item) { return item.answer; }).join(' ') + ' ' + String(postingText || '');
  const tokens = String(result.cover_letter.draft || '').match(/\d+(?:[.,]\d+)?(?:%|명|회|개|시간|개월|년|점)?/g) || [];
  const unsupported = uniqueStrings_(tokens.filter(function (token) { return evidence.indexOf(token) < 0; }));
  if (!unsupported.length) return;
  const message = '사용자 입력이나 공고에서 확인되지 않은 숫자 표현: ' + unsupported.join(', ');
  result.cover_letter.unsupported_claims = uniqueStrings_((result.cover_letter.unsupported_claims || []).concat([message]));
  result.warnings = uniqueStrings_((result.warnings || []).concat(['자기소개서의 숫자 표현은 제출 전 원본 경험과 대조해 주세요.']));
}

function finalPacketSchema_() {
  return {
    type: 'OBJECT',
    required: ['experience_card', 'match', 'cover_letter', 'interview', 'warnings'],
    properties: {
      experience_card: {type: 'OBJECT', required: ['title', 'context', 'role', 'problem', 'actions', 'results', 'artifacts', 'competencies', 'evidence_status', 'missing_fields'], properties: {
        title: {type: 'STRING'}, context: {type: 'STRING'}, role: {type: 'STRING'}, problem: {type: 'STRING'},
        actions: {type: 'ARRAY', items: {type: 'STRING'}}, results: {type: 'ARRAY', items: {type: 'STRING'}},
        artifacts: {type: 'ARRAY', items: {type: 'STRING'}}, competencies: {type: 'ARRAY', items: {type: 'STRING'}},
        evidence_status: {type: 'STRING', enum: ['verified', 'user_stated', 'partial', 'missing']},
        missing_fields: {type: 'ARRAY', items: {type: 'STRING'}}
      }},
      match: {type: 'OBJECT', required: ['level', 'requirements_supported', 'requirements_total', 'strengths', 'gaps', 'rationale'], properties: {
        level: {type: 'STRING', enum: ['strong', 'partial', 'weak', 'insufficient']},
        requirements_supported: {type: 'INTEGER'}, requirements_total: {type: 'INTEGER'},
        strengths: {type: 'ARRAY', items: {type: 'STRING'}}, gaps: {type: 'ARRAY', items: {type: 'STRING'}}, rationale: {type: 'STRING'}
      }},
      cover_letter: {type: 'OBJECT', required: ['recommended_question', 'draft', 'revision_points', 'unsupported_claims'], properties: {
        recommended_question: {type: 'STRING'}, draft: {type: 'STRING'},
        revision_points: {type: 'ARRAY', items: {type: 'STRING'}}, unsupported_claims: {type: 'ARRAY', items: {type: 'STRING'}}
      }},
      interview: {type: 'OBJECT', required: ['questions'], properties: {
        questions: {type: 'ARRAY', items: {type: 'OBJECT', required: ['type', 'question', 'linked_experience', 'answer_evidence', 'follow_ups'], properties: {
          type: {type: 'STRING', enum: ['experience', 'evidence_check', 'role', 'company', 'gap']},
          question: {type: 'STRING'}, linked_experience: {type: 'STRING'}, answer_evidence: {type: 'STRING'},
          follow_ups: {type: 'ARRAY', items: {type: 'STRING'}}
        }}}
      }},
      warnings: {type: 'ARRAY', items: {type: 'STRING'}}
    }
  };
}

function callGeminiJson_(prompt, responseSchema) {
  const apiKey = resolveGeminiKey_();
  if (!apiKey) throw new Error('Gemini API 키가 없습니다. 첫 화면에서 본인 키를 입력해 주세요.');
  const model = getGeminiModel_(apiKey);
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  const payload = {
    contents: [{role: 'user', parts: [{text: prompt}]}],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: responseSchema
    }
  };
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: {'x-goog-api-key': apiKey},
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      const code = response.getResponseCode();
      const body = response.getContentText();
      if (code >= 200 && code < 300) {
        const outer = JSON.parse(body);
        const text = outer.candidates && outer.candidates[0] && outer.candidates[0].content && outer.candidates[0].content.parts
          ? outer.candidates[0].content.parts.map(function (part) { return part.text || ''; }).join('')
          : '';
        if (!text) throw new Error('Gemini 응답 본문이 비어 있습니다.');
        return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
      }
      if (code === 401 || code === 403) throw new Error('Gemini 설정 또는 요청 오류(' + code + '): API 키가 유효하지 않거나 권한이 없습니다. 첫 화면에서 키를 다시 확인해 주세요.');
      if (code === 429) throw new Error('Gemini 설정 또는 요청 오류(429): 이 API 키의 사용 한도를 초과했습니다. 잠시 후 다시 시도하거나 Google AI Studio에서 한도를 확인해 주세요.');
      if (code === 400 || code === 404) throw new Error('Gemini 설정 또는 요청 오류(' + code + ')');
      lastError = new Error('Gemini 일시 오류(' + code + ')');
    } catch (error) {
      lastError = new Error(redactSecrets_(error && error.message ? error.message : 'Gemini 호출에 실패했습니다.', apiKey));
      if (/설정 또는 요청 오류/.test(lastError.message)) break;
    }
    Utilities.sleep(700 * (attempt + 1));
  }
  throw lastError || new Error('Gemini 호출에 실패했습니다.');
}

function getGeminiModel_(apiKey) {
  const props = PropertiesService.getScriptProperties();
  const configured = props.getProperty(CE_CONFIG.GEMINI_MODEL_PROPERTY);
  if (configured) return configured.replace(/^models\//, '');
  // 키마다 사용 가능한 모델이 다를 수 있어 키 해시별로 캐시한다 (키 자체는 저장하지 않음).
  const cache = CacheService.getScriptCache();
  const modelCacheKey = 'CE_GEMINI_MODEL_' + digestKey_(apiKey);
  const cached = cache.get(modelCacheKey);
  if (cached) return cached;
  const preferred = ['gemini-3.5-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  try {
    const response = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {'x-goog-api-key': normalizeGeminiKey_(apiKey)},
      muteHttpExceptions: true
    });
    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      const models = (JSON.parse(response.getContentText()).models || []).filter(function (model) {
        return (model.supportedGenerationMethods || []).indexOf('generateContent') >= 0;
      }).map(function (model) { return String(model.name || '').replace(/^models\//, ''); });
      const selected = preferred.find(function (name) { return models.indexOf(name) >= 0; }) || models.find(function (name) { return /flash/i.test(name); });
      if (selected) {
        cache.put(modelCacheKey, selected, 21600);
        return selected;
      }
    }
  } catch (ignore) {}
  return 'gemini-2.5-flash-lite';
}

/* =========================================================================
   DART 기업분석 (OpenDART 공식 API)
   - 사실(공시 수치)과 해석(AI 추정)을 분리해서 다룬다.
   - 사용 API: corpCode.xml(고유번호), empSttus.json(직원현황),
              fnlttSinglAcnt.json(주요계정), list.json(공시목록)
   ========================================================================= */

function fetchDartCompanyBrief_(companyName) {
  const key = PropertiesService.getScriptProperties().getProperty(CE_CONFIG.DART_KEY_PROPERTY);
  if (!key) return emptyDartBrief_('DART API 키 미설정');
  const inputName = clean_(companyName, 120);
  if (!inputName) return emptyDartBrief_('희망기업 미입력');
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = 'DARTV3_' + digestKey_(normalizeCompanyName_(inputName));
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const corp = resolveDartCorpCode_(key, inputName);
    if (!corp.corp_code) {
      const brief = emptyDartBrief_(corp.error || 'DART에서 일치하는 기업명을 찾지 못했습니다.');
      brief.input_name = inputName;
      brief.suggestions = corp.suggestions || [];
      if (brief.suggestions.length) brief.limitations.push('비슷한 이름: ' + brief.suggestions.join(', '));
      return brief;
    }

    const brief = {
      matched: true,
      input_name: inputName,
      company_name: corp.corp_name,
      corp_code: corp.corp_code,
      stock_code: corp.stock_code,
      listed: Boolean(corp.stock_code),
      bsns_year: '',
      as_of: '',
      source_url: '',
      employees: null,
      financials: null,
      filings: [],
      facts: [],
      limitations: []
    };

    const thisYear = Number(Utilities.formatDate(new Date(), CE_CONFIG.TIME_ZONE, 'yyyy'));
    for (let back = 1; back <= CE_CONFIG.DART_YEARS_BACK && !brief.financials && !brief.employees; back++) {
      const year = String(thisYear - back);
      const financials = fetchDartFinancials_(key, corp.corp_code, year);
      const employees = fetchDartEmployees_(key, corp.corp_code, year);
      if (financials || employees) {
        brief.bsns_year = year;
        brief.financials = financials;
        brief.employees = employees;
      }
    }
    if (!brief.bsns_year) {
      brief.limitations.push('최근 ' + CE_CONFIG.DART_YEARS_BACK + '년 사업보고서의 직원현황·재무 데이터를 찾지 못했습니다. (비상장·소규모 법인은 공시 대상이 아닐 수 있습니다)');
    } else {
      brief.as_of = brief.bsns_year + '년 사업보고서 기준';
      if (!brief.employees) brief.limitations.push('직원현황 데이터가 없어 인력 정보는 표시하지 않습니다.');
      if (!brief.financials) brief.limitations.push('주요계정 데이터가 없어 재무 정보는 표시하지 않습니다.');
    }

    brief.filings = fetchDartFilings_(key, corp.corp_code);
    const rcept = (brief.employees && brief.employees.rcept_no) || (brief.financials && brief.financials.rcept_no) || (brief.filings[0] && brief.filings[0].receipt_no) || '';
    brief.source_url = rcept ? 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=' + rcept : 'https://dart.fss.or.kr/';
    brief.facts = buildDartFacts_(brief);

    cache.put(cacheKey, JSON.stringify(brief), CE_CONFIG.DART_CACHE_SECONDS);
    return brief;
  } catch (error) {
    const brief = emptyDartBrief_('DART 조회 중 오류가 발생해 채용공고 중심으로 분석합니다. (' + clean_(error && error.message, 120) + ')');
    brief.input_name = inputName;
    return brief;
  }
}

function emptyDartBrief_(reason) {
  return {matched: false, input_name: '', company_name: '', corp_code: '', employees: null, financials: null, filings: [], facts: [], suggestions: [], limitations: [reason]};
}

/** (주), ㈜, 주식회사, 공백·기호를 제거해 이름 비교용 키를 만든다. */
function normalizeCompanyName_(name) {
  return String(name || '')
    .replace(/\(주\)|㈜|주식회사|\(유\)|유한회사|\(재\)|재단법인|\(사\)|사단법인/g, '')
    .replace(/[\s·.,\-_'"()]/g, '')
    .toLowerCase();
}

/** corpCode.xml(zip)에서 기업명을 찾아 고유번호를 돌려준다. 상장사를 우선한다. */
function resolveDartCorpCode_(key, companyName) {
  const cache = CacheService.getScriptCache();
  const normalized = normalizeCompanyName_(companyName);
  const cacheKey = 'DARTCODE_' + digestKey_(normalized);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = UrlFetchApp.fetch('https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=' + encodeURIComponent(key), {muteHttpExceptions: true});
  if (response.getResponseCode() !== 200) return {error: 'DART 기업코드 조회 실패(HTTP ' + response.getResponseCode() + ')'};

  // 인증키 오류 등은 zip이 아니라 작은 XML/JSON 오류 본문으로 온다. 먼저 그 경우를 걸러낸다.
  const headers = response.getHeaders() || {};
  const contentType = String(headers['Content-Type'] || headers['content-type'] || '');
  const bytes = response.getContent();
  const looksLikeZip = bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"
  if (!looksLikeZip) {
    const text = response.getContentText();
    const status = (text.match(/<status>([^<]+)<\/status>/) || [])[1] || (text.match(/"status"\s*:\s*"([^"]+)"/) || [])[1] || '';
    const message = (text.match(/<message>([^<]+)<\/message>/) || [])[1] || (text.match(/"message"\s*:\s*"([^"]+)"/) || [])[1] || '';
    return {error: 'DART 기업코드 파일 대신 오류 응답을 받았습니다. ' + dartStatusMessage_(status) + (message ? ' ' + message : '') + (contentType ? ' [' + contentType + ']' : '')};
  }

  // Utilities.unzip은 blob의 콘텐츠 타입이 zip이 아니면 실패할 수 있어 명시적으로 지정한다.
  let blobs;
  try {
    blobs = Utilities.unzip(Utilities.newBlob(bytes, 'application/zip', 'CORPCODE.zip'));
  } catch (unzipError) {
    return {error: 'DART 기업코드 파일 해제 실패: ' + clean_(unzipError && unzipError.message, 120)};
  }
  if (!blobs || !blobs.length) return {error: 'DART 기업코드 파일이 비어 있습니다.'};

  const xml = blobs[0].getDataAsString('UTF-8');
  const blocks = xml.match(/<list>[\s\S]*?<\/list>/g) || [];
  const exact = [];
  const similar = [];
  for (let i = 0; i < blocks.length; i++) {
    const nameMatch = blocks[i].match(/<corp_name>([^<]*)<\/corp_name>/);
    if (!nameMatch) continue;
    const corpName = nameMatch[1].trim();
    const candidateKey = normalizeCompanyName_(corpName);
    if (!candidateKey) continue;
    const stock = ((blocks[i].match(/<stock_code>([^<]*)<\/stock_code>/) || [])[1] || '').trim();
    const code = ((blocks[i].match(/<corp_code>([^<]*)<\/corp_code>/) || [])[1] || '').trim();
    if (candidateKey === normalized) {
      exact.push({corp_code: code, corp_name: corpName, stock_code: stock});
    } else if (similar.length < 8 && stock && (candidateKey.indexOf(normalized) === 0 || normalized.indexOf(candidateKey) === 0)) {
      similar.push(corpName);
    }
  }
  let picked = null;
  if (exact.length) {
    picked = exact.find(function (item) { return item.stock_code; }) || exact[0];
  }
  if (!blocks.length) return {error: 'DART 기업코드 파일을 해석하지 못했습니다. (목록 0건)'};
  const result = picked ? picked : {error: 'DART에서 "' + companyName + '"과(와) 정확히 일치하는 법인명을 찾지 못했습니다. (전체 ' + blocks.length + '개 법인 검색)', suggestions: uniqueStrings_(similar).slice(0, 5)};
  // 성공한 경우만 캐시한다. 일시 오류를 6시간 동안 굳히지 않기 위해서다.
  if (picked) cache.put(cacheKey, JSON.stringify(result), CE_CONFIG.DART_CACHE_SECONDS);
  return result;
}

function fetchDartJson_(key, endpoint, params) {
  const query = Object.keys(params).map(function (name) { return name + '=' + encodeURIComponent(params[name]); }).join('&');
  const url = 'https://opendart.fss.or.kr/api/' + endpoint + '?crtfc_key=' + encodeURIComponent(key) + '&' + query;
  const response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
  if (response.getResponseCode() !== 200) return {status: 'HTTP', message: 'HTTP ' + response.getResponseCode()};
  try {
    return JSON.parse(response.getContentText() || '{}');
  } catch (parseError) {
    return {status: 'PARSE', message: '응답 해석 실패'};
  }
}

function dartStatusMessage_(status) {
  const table = {
    '010': '등록되지 않은 인증키입니다.',
    '011': '사용할 수 없는 인증키입니다. (폐기되었거나 재발급이 필요합니다)',
    '012': '접근할 수 없는 IP입니다.',
    '013': '조회된 데이터가 없습니다.',
    '014': '파일이 존재하지 않습니다.',
    '020': '요청 제한(일 10,000건)을 초과했습니다.',
    '021': '조회 가능한 회사 개수를 초과했습니다.',
    '100': '요청 값이 올바르지 않습니다.',
    '101': '부적절한 접근입니다.',
    '800': 'DART 시스템 점검 중입니다.',
    '900': '정의되지 않은 오류입니다.',
    '901': '사용자 계정의 개인정보 보유기간이 만료되었습니다.'
  };
  return status ? '(' + status + ') ' + (table[status] || '') : '';
}

/** 직원현황: 사업부문별 직원 수·평균 근속·1인 평균 급여를 집계한다. */
function fetchDartEmployees_(key, corpCode, year) {
  const json = fetchDartJson_(key, 'empSttus.json', {corp_code: corpCode, bsns_year: year, reprt_code: '11011'});
  if (json.status !== '000' || !Array.isArray(json.list) || !json.list.length) return null;
  return summarizeDartEmployees_(json.list, year);
}

/** "성별합계", "합계", "총계", "소계", "전체" 같은 합계 줄인지 판별한다. */
function isDartTotalRow_(name) {
  const key = String(name || '').replace(/\s/g, '');
  return !key || /합계|총계|소계|전체|^계$|합산/.test(key);
}

function summarizeDartEmployees_(rows, year) {
  const units = {};
  const order = [];
  let rceptNo = '';
  const totalRows = [];
  const unitRows = [];
  rows.forEach(function (row) {
    if (!rceptNo && row.rcept_no) rceptNo = String(row.rcept_no);
    if (isDartTotalRow_(row.fo_bbm)) totalRows.push(row); else unitRows.push(row);
  });
  // 부문 구분이 아예 없는 회사는 합계 줄을 "전체" 부문 하나로 취급한다.
  const breakdownRows = unitRows.length ? unitRows : totalRows;
  breakdownRows.forEach(function (row) {
    const name = unitRows.length ? (clean_(row.fo_bbm, 60) || '전체') : '전체';
    if (!units[name]) {
      units[name] = {name: name, count: 0, regular: 0, contract: 0, tenureWeighted: 0, tenureCount: 0, salaryWeighted: 0, salaryCount: 0, payTotal: 0};
      order.push(name);
    }
    const unit = units[name];
    const count = dartNumber_(row.sm);
    const tenure = dartNumber_(row.avrg_cnwk_sdytrn);
    const salary = dartNumber_(row.jan_salary_am);
    unit.count += count;
    unit.regular += dartNumber_(row.rgllbr_co);
    unit.contract += dartNumber_(row.cnttk_co);
    unit.payTotal += dartNumber_(row.fyer_salary_totamt);
    if (tenure > 0 && count > 0) { unit.tenureWeighted += tenure * count; unit.tenureCount += count; }
    if (salary > 0 && count > 0) { unit.salaryWeighted += salary * count; unit.salaryCount += count; }
  });
  const list = order.map(function (name) {
    const u = units[name];
    const avgSalary = u.salaryCount ? Math.round(u.salaryWeighted / u.salaryCount) : (u.count && u.payTotal ? Math.round(u.payTotal / u.count) : 0);
    return {
      name: u.name,
      count: u.count,
      regular: u.regular,
      contract: u.contract,
      avg_tenure_years: u.tenureCount ? Math.round((u.tenureWeighted / u.tenureCount) * 10) / 10 : 0,
      avg_salary_krw: avgSalary,
      salary_unit_uncertain: avgSalary > 0 && (avgSalary < 5000000 || avgSalary > 2000000000)
    };
  }).filter(function (u) { return u.count > 0; });
  list.sort(function (a, b) { return b.count - a.count; });
  const unitTotal = list.reduce(function (sum, u) { return sum + u.count; }, 0);

  // 회사 전체 값: 합계 줄이 있으면 그 줄을 우선 사용하고, 없으면 부문 값을 가중평균한다.
  const totalAgg = totalRows.reduce(function (acc, row) {
    const count = dartNumber_(row.sm);
    const tenure = dartNumber_(row.avrg_cnwk_sdytrn);
    const salary = dartNumber_(row.jan_salary_am);
    acc.count += count;
    acc.payTotal += dartNumber_(row.fyer_salary_totamt);
    if (tenure > 0 && count > 0) { acc.tenureWeighted += tenure * count; acc.tenureCount += count; }
    if (salary > 0 && count > 0) { acc.salaryWeighted += salary * count; acc.salaryCount += count; }
    return acc;
  }, {count: 0, payTotal: 0, tenureWeighted: 0, tenureCount: 0, salaryWeighted: 0, salaryCount: 0});

  const total = (unitRows.length && totalRows.length) ? (totalAgg.count || unitTotal) : unitTotal;
  const salaryPool = list.filter(function (u) { return u.avg_salary_krw > 0; });
  let overallSalary = 0;
  if (totalAgg.salaryCount) overallSalary = Math.round(totalAgg.salaryWeighted / totalAgg.salaryCount);
  else if (totalAgg.count && totalAgg.payTotal) overallSalary = Math.round(totalAgg.payTotal / totalAgg.count);
  else if (salaryPool.length) overallSalary = Math.round(salaryPool.reduce(function (s, u) { return s + u.avg_salary_krw * u.count; }, 0) / salaryPool.reduce(function (s, u) { return s + u.count; }, 0));
  const tenurePool = list.filter(function (u) { return u.avg_tenure_years > 0; });
  let overallTenure = 0;
  if (totalAgg.tenureCount) overallTenure = Math.round((totalAgg.tenureWeighted / totalAgg.tenureCount) * 10) / 10;
  else if (tenurePool.length) overallTenure = Math.round((tenurePool.reduce(function (s, u) { return s + u.avg_tenure_years * u.count; }, 0) / tenurePool.reduce(function (s, u) { return s + u.count; }, 0)) * 10) / 10;
  const overallUncertain = overallSalary > 0 && (overallSalary < 5000000 || overallSalary > 2000000000);
  return {
    year: year,
    rcept_no: rceptNo,
    total: total,
    avg_salary_krw: overallSalary,
    avg_tenure_years: overallTenure,
    salary_unit_uncertain: overallUncertain || list.some(function (u) { return u.salary_unit_uncertain; }),
    units: list.slice(0, 8)
  };
}

/** 주요계정: 매출액·영업이익·당기순이익(연결 우선)을 뽑는다. */
function fetchDartFinancials_(key, corpCode, year) {
  const json = fetchDartJson_(key, 'fnlttSinglAcnt.json', {corp_code: corpCode, bsns_year: year, reprt_code: '11011'});
  if (json.status !== '000' || !Array.isArray(json.list) || !json.list.length) return null;
  return summarizeDartFinancials_(json.list, year);
}

function summarizeDartFinancials_(rows, year) {
  const basis = rows.some(function (r) { return r.fs_div === 'CFS'; }) ? 'CFS' : 'OFS';
  const wanted = [
    {key: 'revenue', label: '매출액', test: /^(매출액|수익\(매출액\)|영업수익|매출)$/},
    {key: 'operating_profit', label: '영업이익', test: /^영업이익(\(손실\))?$/},
    {key: 'net_income', label: '당기순이익', test: /^당기순이익(\(손실\))?$/}
  ];
  let rceptNo = '';
  const items = [];
  wanted.forEach(function (w) {
    const row = rows.find(function (r) { return r.fs_div === basis && w.test.test(String(r.account_nm || '').replace(/\s/g, '')); });
    if (!row) return;
    if (!rceptNo && row.rcept_no) rceptNo = String(row.rcept_no);
    const current = dartNumber_(row.thstrm_amount);
    const previous = dartNumber_(row.frmtrm_amount);
    let changePct = null;
    if (previous !== 0 && current !== null && previous !== null) changePct = Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
    items.push({
      key: w.key,
      name: w.label,
      current: current,
      previous: previous,
      change_pct: changePct,
      current_label: clean_(row.thstrm_nm, 30),
      previous_label: clean_(row.frmtrm_nm, 30),
      currency: clean_(row.currency || 'KRW', 10)
    });
  });
  if (!items.length) return null;
  return {year: year, rcept_no: rceptNo, basis: basis === 'CFS' ? '연결' : '별도', items: items};
}

/** 최근 2년 정기공시 목록 (출처 링크용). */
function fetchDartFilings_(key, corpCode) {
  const end = Utilities.formatDate(new Date(), CE_CONFIG.TIME_ZONE, 'yyyyMMdd');
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);
  const start = Utilities.formatDate(startDate, CE_CONFIG.TIME_ZONE, 'yyyyMMdd');
  const json = fetchDartJson_(key, 'list.json', {corp_code: corpCode, bgn_de: start, end_de: end, pblntf_ty: 'A', page_count: '10'});
  if (json.status !== '000' || !Array.isArray(json.list)) return [];
  return json.list.slice(0, 5).map(function (item) {
    return {
      report_name: clean_(item.report_nm, 120),
      filing_date: clean_(item.rcept_dt, 12),
      receipt_no: clean_(item.rcept_no, 20),
      url: item.rcept_no ? 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=' + item.rcept_no : ''
    };
  });
}

/** 공시 수치를 사람이 읽는 "공식 사실" 문장으로 바꾼다 (해석 없음). */
function buildDartFacts_(brief) {
  const facts = [];
  const prefix = brief.company_name + ' · ' + brief.as_of;
  if (brief.employees) {
    const e = brief.employees;
    facts.push(prefix + ' 직원 수 합계 ' + formatCount_(e.total) + '명');
    if (e.avg_tenure_years) facts.push(prefix + ' 평균 근속연수 ' + e.avg_tenure_years + '년');
    if (e.avg_salary_krw) facts.push(prefix + ' 1인 평균 급여 ' + formatKrw_(e.avg_salary_krw) + (e.salary_unit_uncertain ? ' [확인 필요: 공시 단위]' : ''));
    e.units.slice(0, 6).forEach(function (u) {
      const parts = [formatCount_(u.count) + '명'];
      if (u.avg_tenure_years) parts.push('평균 근속 ' + u.avg_tenure_years + '년');
      if (u.avg_salary_krw) parts.push('1인 평균 급여 ' + formatKrw_(u.avg_salary_krw));
      facts.push(prefix + ' 사업부문 "' + u.name + '": ' + parts.join(', '));
    });
  }
  if (brief.financials) {
    brief.financials.items.forEach(function (item) {
      let line = prefix + ' ' + brief.financials.basis + ' ' + item.name + ' ' + formatKrw_(item.current);
      if (item.change_pct !== null) line += ' (전년 대비 ' + (item.change_pct >= 0 ? '+' : '') + item.change_pct + '%)';
      facts.push(line);
    });
  }
  return facts;
}

/** 화면·이메일·최종결과에 공통으로 쓰는 기업 카드 데이터. 사실/해석/활용을 분리한다. */
function buildCompanyView_(inputName, brief, fit) {
  const name = clean_(inputName, 120);
  if (!name) return null;
  if (!brief || !brief.matched) {
    return {
      matched: false,
      name: name,
      limitations: brief && brief.limitations ? brief.limitations : ['DART 공시 정보가 없습니다.'],
      suggestions: brief && brief.suggestions ? brief.suggestions : []
    };
  }
  const safeFit = fit && fit.confidence === 'dart_backed' ? fit : null;
  return {
    matched: true,
    name: brief.company_name,
    input_name: name,
    as_of: brief.as_of,
    listed: brief.listed,
    source_url: brief.source_url,
    facts: brief.facts,
    employees: brief.employees ? {
      total: brief.employees.total,
      avg_tenure_years: brief.employees.avg_tenure_years,
      avg_salary_krw: brief.employees.avg_salary_krw,
      salary_unit_uncertain: brief.employees.salary_unit_uncertain,
      units: brief.employees.units.map(function (u) {
        return {name: u.name, count: u.count, avg_tenure_years: u.avg_tenure_years, avg_salary_krw: u.avg_salary_krw};
      })
    } : null,
    financials: brief.financials ? {
      basis: brief.financials.basis,
      items: brief.financials.items.map(function (item) {
        return {name: item.name, current: item.current, previous: item.previous, change_pct: item.change_pct, current_label: item.current_label, previous_label: item.previous_label};
      })
    } : null,
    interpretation: safeFit ? {
      related_units: safeFit.related_units,
      characteristics: safeFit.characteristics,
      how_to_use: safeFit.how_to_use
    } : null,
    limitations: brief.limitations || []
  };
}

/** AI가 돌려준 company_fit에서 목록에 없는 부문명·빈 값을 걸러낸다. */
function sanitizeCompanyFit_(fit, unitNames, matched) {
  const empty = {related_units: [], characteristics: '', how_to_use: [], confidence: 'none'};
  if (!matched || !fit || typeof fit !== 'object') return empty;
  const allowed = unitNames.map(function (n) { return normalizeCompanyName_(n); });
  const related = (Array.isArray(fit.related_units) ? fit.related_units : []).map(function (item) {
    const unit = clean_(item && item.unit, 60);
    const index = allowed.indexOf(normalizeCompanyName_(unit));
    if (index < 0) return null;
    return {unit: unitNames[index], reason: clean_(item.reason, 300)};
  }).filter(Boolean).slice(0, 3);
  const howTo = (Array.isArray(fit.how_to_use) ? fit.how_to_use : []).map(function (x) { return clean_(x, 300); }).filter(Boolean).slice(0, 3);
  const characteristics = clean_(fit.characteristics, 600);
  if (!related.length && !characteristics) return empty;
  return {related_units: related, characteristics: characteristics, how_to_use: howTo, confidence: 'dart_backed'};
}

function readStoredCompany_(analysis) {
  const out = {brief: null, fit: null};
  if (!analysis) return out;
  try { out.brief = analysis['기업 요약 JSON'] ? JSON.parse(analysis['기업 요약 JSON']) : null; } catch (ignore) {}
  try { out.fit = analysis['직무 연관부문 JSON'] ? JSON.parse(analysis['직무 연관부문 JSON']) : null; } catch (ignore) {}
  return out;
}

function dartNumber_(value) {
  if (value === undefined || value === null) return 0;
  const text = String(value).replace(/,/g, '').trim();
  if (!text || text === '-') return 0;
  const number = Number(text);
  return isFinite(number) ? number : 0;
}

function formatCount_(n) {
  return Math.round(Number(n) || 0).toLocaleString('ko-KR');
}

function formatKrw_(n) {
  const value = Number(n) || 0;
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return sign + (Math.round(abs / 1e11) / 10).toLocaleString('ko-KR') + '조 원';
  if (abs >= 1e10) return sign + Math.round(abs / 1e8).toLocaleString('ko-KR') + '억 원';
  if (abs >= 1e8) return sign + (Math.round(abs / 1e7) / 10).toLocaleString('ko-KR') + '억 원';
  if (abs >= 1e4) return sign + Math.round(abs / 1e4).toLocaleString('ko-KR') + '만 원';
  return sign + Math.round(abs).toLocaleString('ko-KR') + '원';
}

function sendResultEmail_(session, result) {
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error('오늘의 이메일 발송 한도를 초과했습니다.');
  const subject = ('[Career Escape] ' + session['희망직무'] + ' 경험 분석 결과').replace(/[\r\n]+/g, ' ');
  const html = buildResultEmailHtml_(session, result);
  const plain = buildResultPlainText_(session, result);
  MailApp.sendEmail({
    to: session['이메일'],
    subject: subject,
    body: plain,
    htmlBody: html,
    name: CE_CONFIG.APP_NAME
  });
}

function buildResultEmailHtml_(session, result) {
  const card = result.experience_card;
  const questions = result.interview.questions.map(function (item, index) {
    return '<li style="margin:0 0 10px"><b>' + (index + 1) + '.</b> ' + html_(item.question) + '</li>';
  }).join('');
  const list = function (items) {
    return '<ul style="margin:8px 0 0;padding-left:20px">' + (items || []).map(function (item) { return '<li style="margin:0 0 6px">' + html_(item) + '</li>'; }).join('') + '</ul>';
  };
  return [
    '<div style="font-family:Arial,\'Apple SD Gothic Neo\',sans-serif;max-width:680px;margin:auto;color:#172033;line-height:1.65">',
    '<div style="background:#171029;color:#fff;padding:26px;border-radius:14px 14px 0 0">',
    '<div style="color:#ffd166;font-size:13px;font-weight:700">CAREER ESCAPE COMPLETE</div>',
    '<h1 style="margin:6px 0 4px;font-size:26px">' + html_(session['희망직무']) + ' 경험 분석 결과</h1>',
    '<div style="color:#d7d0ec">' + html_(session['이름']) + '님의 입력을 바탕으로 작성했습니다.</div></div>',
    '<div style="border:1px solid #ddd6f3;border-top:0;padding:24px;border-radius:0 0 14px 14px">',
    '<h2 style="font-size:19px;color:#5b35b5">1. 직무 경험카드</h2>',
    '<p><b>경험명</b><br>' + html_(card.title) + '</p>',
    '<p><b>상황</b><br>' + html_(card.context) + '</p>',
    '<p><b>나의 역할</b><br>' + html_(card.role) + '</p>',
    '<p><b>문제</b><br>' + html_(card.problem) + '</p>',
    '<p><b>행동</b></p>' + list(card.actions),
    '<p><b>성과·학습</b></p>' + list(card.results),
    '<p><b>연결 역량</b></p>' + list(card.competencies),
    '<h2 style="font-size:19px;color:#5b35b5;margin-top:28px">2. 자기소개서 초안</h2>',
    '<p style="white-space:pre-wrap;background:#f7f4ff;padding:16px;border-radius:10px">' + html_(result.cover_letter.draft) + '</p>',
    '<p><b>수정할 부분</b></p>' + list(result.cover_letter.revision_points),
    '<h2 style="font-size:19px;color:#5b35b5;margin-top:28px">3. 면접 예상질문</h2>',
    '<ol style="padding-left:20px">' + questions + '</ol>',
    buildCompanyEmailHtml_(result.company_analysis, list),
    '<div style="margin-top:24px;padding:14px;background:#fff7dc;border-radius:10px;font-size:13px"><b>확인 안내</b>' + list(result.warnings) + '</div>',
    '<p style="font-size:12px;color:#6f7480;margin-top:24px">이 결과는 사용자가 입력한 내용을 AI가 정리한 초안입니다. 제출 전 사실관계와 표현을 직접 확인해 주세요.</p>',
    '</div></div>'
  ].join('');
}

function buildResultPlainText_(session, result) {
  return [
    '[Career Escape] ' + session['희망직무'] + ' 경험 분석 결과',
    '',
    '경험명: ' + result.experience_card.title,
    '상황: ' + result.experience_card.context,
    '역할: ' + result.experience_card.role,
    '문제: ' + result.experience_card.problem,
    '행동: ' + result.experience_card.actions.join(' / '),
    '성과·학습: ' + result.experience_card.results.join(' / '),
    '',
    '[자기소개서 초안]',
    result.cover_letter.draft,
    '',
    '[면접 예상질문]',
    result.interview.questions.map(function (item, index) { return (index + 1) + '. ' + item.question; }).join('\n'),
    '',
    buildCompanyPlainText_(result.company_analysis),
    '제출 전 사실관계와 표현을 직접 확인해 주세요.'
  ].join('\n');
}

function buildCompanyEmailHtml_(company, list) {
  if (!company || !company.matched) return '';
  const unitRows = company.employees ? company.employees.units.slice(0, 6).map(function (u) {
    return '<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">' + html_(u.name) + '</td>'
      + '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + formatCount_(u.count) + '명</td>'
      + '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + (u.avg_tenure_years ? u.avg_tenure_years + '년' : '-') + '</td>'
      + '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + (u.avg_salary_krw ? formatKrw_(u.avg_salary_krw) : '-') + '</td></tr>';
  }).join('') : '';
  const finRows = company.financials ? company.financials.items.map(function (item) {
    const change = item.change_pct === null ? '-' : (item.change_pct >= 0 ? '+' : '') + item.change_pct + '%';
    return '<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">' + html_(item.name) + '</td>'
      + '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + formatKrw_(item.current) + '</td>'
      + '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + change + '</td></tr>';
  }).join('') : '';
  const interp = company.interpretation;
  return [
    '<h2 style="font-size:19px;color:#5b35b5;margin-top:28px">4. 희망기업 분석 · ' + html_(company.name) + '</h2>',
    '<p style="font-size:12px;color:#6f7480;margin:0 0 10px">공식 사실 (' + html_(company.as_of) + ', 출처: <a href="' + html_(company.source_url) + '">DART 사업보고서</a>)</p>',
    unitRows ? '<table style="border-collapse:collapse;width:100%;font-size:13px"><tr style="background:#f3effc"><th style="text-align:left;padding:6px 8px">사업부문</th><th style="text-align:right;padding:6px 8px">직원 수</th><th style="text-align:right;padding:6px 8px">평균 근속</th><th style="text-align:right;padding:6px 8px">1인 평균 급여</th></tr>' + unitRows + '</table>' : '',
    finRows ? '<table style="border-collapse:collapse;width:100%;font-size:13px;margin-top:10px"><tr style="background:#f3effc"><th style="text-align:left;padding:6px 8px">' + html_(company.financials.basis) + ' 재무</th><th style="text-align:right;padding:6px 8px">당기</th><th style="text-align:right;padding:6px 8px">전년 대비</th></tr>' + finRows + '</table>' : '',
    interp ? '<p style="margin-top:14px"><b>[해석] 희망직무와 연관성이 높은 부문</b> <span style="font-size:12px;color:#6f7480">AI 추정이며 공식 정보가 아닙니다.</span></p>'
      + list(interp.related_units.map(function (u) { return u.unit + ' — ' + u.reason; }))
      + (interp.characteristics ? '<p><b>[해석] 조직 특징</b><br>' + html_(interp.characteristics) + '</p>' : '')
      + (interp.how_to_use.length ? '<p><b>활용 방법</b></p>' + list(interp.how_to_use) : '') : '',
    company.limitations && company.limitations.length ? '<p style="font-size:12px;color:#6f7480">' + html_(company.limitations.join(' / ')) + '</p>' : ''
  ].join('');
}

function buildCompanyPlainText_(company) {
  if (!company || !company.matched) return '';
  const lines = ['[희망기업 분석 · ' + company.name + '] (' + company.as_of + ', 출처: ' + company.source_url + ')'];
  lines.push('공식 사실:');
  company.facts.forEach(function (fact) { lines.push('- ' + fact); });
  if (company.interpretation) {
    lines.push('[해석] 희망직무 연관 부문 (AI 추정):');
    company.interpretation.related_units.forEach(function (u) { lines.push('- ' + u.unit + ' — ' + u.reason); });
    if (company.interpretation.characteristics) lines.push('[해석] 조직 특징: ' + company.interpretation.characteristics);
    if (company.interpretation.how_to_use.length) {
      lines.push('활용 방법:');
      company.interpretation.how_to_use.forEach(function (x) { lines.push('- ' + x); });
    }
  }
  lines.push('');
  return lines.join('\n');
}

function validateStartForm_(form) {
  const input = form || {};
  const clean = {
    name: clean_(input.name, 80),
    email: clean_(input.email, 160).toLowerCase(),
    role: clean_(input.role, 120),
    company: clean_(input.company, 120),
    postingUrl: clean_(input.postingUrl, 500),
    postingText: clean_(input.postingText, CE_CONFIG.MAX_INPUT),
    consent: input.consent === true,
    geminiKey: normalizeGeminiKey_(input.geminiKey) // 요청 처리에만 쓰고 시트에는 절대 저장하지 않는다
  };
  if (!clean.name) throw new Error('이름을 입력해 주세요.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new Error('결과를 받을 이메일을 정확히 입력해 주세요.');
  if (!clean.role) throw new Error('희망직무를 입력해 주세요.');
  if (clean.postingUrl && !/^https?:\/\//i.test(clean.postingUrl)) throw new Error('채용공고 URL은 http:// 또는 https://로 시작해야 합니다.');
  if (!clean.consent) throw new Error('결과 저장·이메일 발송 및 AI 처리 동의가 필요합니다.');
  return clean;
}

function ensureFreshQuestion_(next, answers, previousQuestion) {
  const usedFields = answers.map(function (item) { return item.field; });
  const fallbacks = [
    {field: 'role', question: '그 경험에서 본인이 직접 맡고 책임진 부분은 무엇이었나요?'},
    {field: 'problem', question: '그때 가장 해결하기 어려웠던 문제나 제약은 무엇이었나요?'},
    {field: 'actions', question: '문제를 해결하기 위해 본인이 가장 먼저 실행한 행동은 무엇이었나요?'},
    {field: 'method', question: '그 행동을 할 때 사용한 기준·도구·절차는 무엇이었나요?'},
    {field: 'results', question: '그 행동 이후 확인된 결과나 변화, 배운 점은 무엇이었나요?'},
    {field: 'artifacts', question: '이 경험을 확인할 수 있는 결과물이나 피드백 기록이 있나요? 없다면 없다고 적어주세요.'}
  ];
  const repeated = !next.question || normalizeText_(next.question) === normalizeText_(previousQuestion)
    || answers.some(function (item) { return normalizeText_(item.question) === normalizeText_(next.question); });
  if (!repeated) return next;
  return fallbacks.find(function (item) { return usedFields.indexOf(item.field) < 0; }) || fallbacks[fallbacks.length - 1];
}

function hasCoreEvidence_(answers) {
  const fields = answers.map(function (item) { return item.field; });
  return fields.indexOf('context') >= 0
    && (fields.indexOf('actions') >= 0 || fields.indexOf('method') >= 0)
    && fields.indexOf('results') >= 0;
}

function runCareerEscapeSelfTest() {
  const results = [];
  results.push(assert_('이메일 검증', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('test@example.com')));
  results.push(assert_('HTML 이스케이프', html_('<script>') === '&lt;script&gt;'));
  results.push(assert_('중복 질문 정규화', normalizeText_(' 같은 질문? ') === '같은질문'));
  results.push(assert_('시트 정의', Object.keys(CE_SHEETS).length === 7));
  results.push(assert_('질문 상한', CE_CONFIG.MAX_QUESTIONS === 5));
  results.push(assert_('기업명 정규화', normalizeCompanyName_('(주) 삼성 전자') === normalizeCompanyName_('삼성전자')));
  results.push(assert_('금액 표기', formatKrw_(258935494000000) === '258.9조 원'));
  results.push(assert_('DART 숫자 파싱', dartNumber_('1,234') === 1234 && dartNumber_('-') === 0));
  const failed = results.filter(function (item) { return !item.ok; });
  const message = failed.length ? '실패: ' + failed.map(function (x) { return x.name; }).join(', ') : '자체 점검 ' + results.length + '개를 모두 통과했습니다.';
  SpreadsheetApp.getUi().alert('Career Escape 자체 점검', message, SpreadsheetApp.getUi().ButtonSet.OK);
  return results;
}

function assert_(name, condition) { return {name: name, ok: Boolean(condition)}; }

function ensureSheets_(spreadsheet) {
  Object.keys(CE_SHEETS).forEach(function (name) {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    const expected = CE_SHEETS[name];
    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const existing = sheet.getLastRow() ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String) : [];
    if (!sheet.getLastRow()) {
      sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
    } else {
      const missing = expected.filter(function (header) { return existing.indexOf(header) < 0; });
      if (missing.length) sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
    }
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setFontWeight('bold').setBackground('#171029').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  });
}

function getDb_() {
  if (CE_DB_CACHE) return CE_DB_CACHE;
  const id = PropertiesService.getScriptProperties().getProperty(CE_CONFIG.DB_PROPERTY);
  if (!id) throw new Error('Career Escape DB가 연결되지 않았습니다. 초기 설정을 실행해 주세요.');
  const spreadsheet = SpreadsheetApp.openById(id);
  const props = PropertiesService.getScriptProperties();
  const missing = Object.keys(CE_SHEETS).some(function (name) { return !spreadsheet.getSheetByName(name); });
  const schemaOutdated = props.getProperty(CE_CONFIG.SCHEMA_VERSION_PROPERTY) !== CE_CONFIG.SCHEMA_VERSION;
  if (missing || schemaOutdated) {
    ensureSheets_(spreadsheet);
    props.setProperty(CE_CONFIG.SCHEMA_VERSION_PROPERTY, CE_CONFIG.SCHEMA_VERSION);
  }
  CE_DB_CACHE = spreadsheet;
  return CE_DB_CACHE;
}

function appendObject_(sheetName, object) {
  const sheet = getDb_().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  sheet.appendRow(headers.map(function (header) { return object[header] === undefined ? '' : sheetCell_(object[header]); }));
}

function getObjectById_(sheetName, id) {
  const sheet = getDb_().getSheetByName(sheetName);
  if (sheet.getLastRow() < 2) return null;
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idColumn = headers.indexOf('세션ID');
  if (idColumn < 0) return null;
  for (let row = values.length - 1; row >= 1; row--) {
    if (String(values[row][idColumn]) === String(id)) return rowToObject_(headers, values[row]);
  }
  return null;
}

function updateObjectById_(sheetName, id, changes) {
  withDocumentLock_(function () {
    const sheet = getDb_().getSheetByName(sheetName);
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const idColumn = headers.indexOf('세션ID');
    for (let row = values.length - 1; row >= 1; row--) {
      if (String(values[row][idColumn]) === String(id)) {
        Object.keys(changes).forEach(function (key) {
          const column = headers.indexOf(key);
          if (column >= 0) sheet.getRange(row + 1, column + 1).setValue(changes[key]);
        });
        return;
      }
    }
    throw new Error(sheetName + '에서 세션을 찾지 못했습니다.');
  });
}

function getAnswers_(sessionId) {
  const sheet = getDb_().getSheetByName('답변');
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  return values.slice(1)
    .filter(function (row) { return String(row[headers.indexOf('세션ID')]) === String(sessionId); })
    .map(function (row) {
      return {
        question: String(row[headers.indexOf('질문')] || ''),
        answer: String(row[headers.indexOf('답변')] || ''),
        field: String(row[headers.indexOf('경험 필드')] || '')
      };
    });
}

function rowToObject_(headers, row) {
  return headers.reduce(function (object, header, index) {
    object[header] = row[index];
    return object;
  }, {});
}

function withDocumentLock_(work) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return work(); } finally { lock.releaseLock(); }
}

function enforceStartRateLimit_(email) {
  const cache = CacheService.getScriptCache();
  const key = 'START_' + digestKey_(email);
  if (cache.get(key)) throw new Error('잠시 후 다시 시작해 주세요. 중복 제출을 방지하고 있습니다.');
  cache.put(key, '1', 30);
}

function digestKey_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes).slice(0, 32);
}

function logError_(sessionId, stage, error) {
  try {
    appendObject_('오류로그', {
      '발생일시': now_(),
      '세션ID': clean_(sessionId, 80),
      '단계': stage,
      '오류 내용': clean_(redactSecrets_(error && error.message ? error.message : String(error)), 1000)
    });
  } catch (ignore) {}
}

/** 오류 문구에 API 키가 섞여 들어가도 시트에 남지 않도록 가린다. */
function redactSecrets_(text, apiKey) {
  let redacted = String(text || '');
  // 형식이 달라진 키도 가린 뒤 길이를 제한해야 키 일부가 로그에 남지 않는다.
  [apiKey, CE_REQUEST_GEMINI_KEY].forEach(function (value) {
    const key = normalizeGeminiKey_(value);
    if (!key) return;
    [key, encodeURIComponent(key)].forEach(function (secret) {
      redacted = redacted.split(secret).join('…(가림)');
    });
  });
  return redacted
    .replace(/AIza[0-9A-Za-z_\-]{20,}/g, 'AIza…(가림)')
    .replace(/key=[^&\s]+/gi, 'key=…(가림)')
    .replace(/crtfc_key=[^&\s]+/gi, 'crtfc_key=…(가림)');
}

function safeError_(error) {
  return new Error(clean_(redactSecrets_(error && error.message ? error.message : '처리 중 오류가 발생했습니다.'), 300));
}

function clean_(value, maxLength) {
  return String(value === undefined || value === null ? '' : value).trim().replace(/\u0000/g, '').slice(0, maxLength || 1000);
}

function html_(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizeText_(value) {
  return String(value || '').replace(/[\s?.!,~·]/g, '').toLowerCase();
}

function uniqueStrings_(items) {
  return items.filter(function (item, index, all) { return item && all.indexOf(item) === index; });
}

function sheetCell_(value) {
  if (typeof value !== 'string') return value;
  return /^[=+@]/.test(value) ? "'" + value : value;
}

function now_() { return Utilities.formatDate(new Date(), CE_CONFIG.TIME_ZONE, 'yyyy-MM-dd HH:mm:ss'); }
function today_() { return Utilities.formatDate(new Date(), CE_CONFIG.TIME_ZONE, 'yyyy-MM-dd'); }
