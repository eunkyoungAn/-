/**
 * 구직자용 사전 질문지(구글 폼) 만들기 — 내 사본 시트용
 *
 * 쓰는 법
 * 1. 상담자용 시트의 내 사본에서 확장 프로그램 → Apps Script 를 연다.
 * 2. 파일 옆 + → 스크립트 로 새 파일을 만들고 이 코드를 붙여 넣은 뒤 저장한다.
 * 3. 함수 createMyJobseekerForm 을 골라 한 번 실행하고 권한을 승인한다.
 *
 * 하는 일
 * - 질문 12개가 들어간 구글 폼을 만든다(이미 만들었으면 빠진 질문만 채운다).
 * - 폼을 제출하면 이 시트의 '구직자 정보' 탭에 ID-1, ID-2 … 순번으로 등록한다.
 * - 질문지 주소를 '자동화 버튼' 탭의 "구직자 작성 링크" 칸에 적는다.
 */
const MY_FORM_FIELDS = [
  // [질문 제목(= '구직자 정보' 열 제목), 도움말, 필수 여부, 장문 여부]
  ['성명·별칭', '상담에서 불리고 싶은 이름이나 별칭을 적어 주세요.', true, false],
  ['희망 직무', '어떤 일을 하고 싶으세요? 아직 정하지 않았다면 관심 분야를 적어 주세요.', true, false],
  ['경력 요약', '어디에서 어떤 일을 얼마나 하셨나요? 첫 구직이면 활동·실습 경험을 적어도 됩니다.', false, true],
  ['핵심 역량', '혼자 해낼 수 있는 업무나 익숙한 도구는 무엇인가요?', false, true],
  ['자격·훈련', '취득한 자격이나 수료한 과정 중 희망 직무와 관련된 것을 적어 주세요.', false, true],
  ['경험 근거', '직접 맡은 일 하나를 골라 무엇을 했고 결과가 어땠는지 알려 주세요.', false, true],
  ['필수 근무조건', '꼭 맞아야 하는 근무지역·시간·통근 조건이 있나요?', false, true],
  ['희망 소득', '예: 세전 월 250만 원, 또는 상담 후 협의', false, false],
  ['취업 희망시점', '예: 즉시, 한 달 이내, 또는 특정 월', false, false],
  ['필요한 지원', '어떤 도움을 먼저 받고 싶으세요? 예: 희망 직무 좁히기, 면접 연습', false, true],
  ['취업 후 정착 지원', '취업 후에도 어떤 도움이 있으면 좋을까요?', false, true],
  ['메모', '상담자에게 미리 전하고 싶은 내용이 있다면 적어 주세요.', false, true]
];
const MY_FORM_TITLE = '취업상담 사전 질문지';
const MY_FORM_INTRO = '취업상담 전에 희망하는 일과 경험을 알려 주세요. 답변은 담당 상담자가 직무 적합도를 함께 살펴보고 지원계획을 준비하는 데 사용합니다. 이름 또는 별칭과 희망 직무만 필수입니다. 연락처·주민등록번호·건강정보는 적지 마세요.';
const MY_INTAKE_SHEET = '구직자 정보';
const MY_GUIDE_SHEET = '자동화 버튼';
const MY_PROP_FORM = 'MY_JOBSEEKER_FORM_ID';
const MY_PROP_BOOK = 'MY_JOBSEEKER_BOOK_ID';

function createMyJobseekerForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || !ss.getSheetByName(MY_INTAKE_SHEET)) {
    throw new Error("'구직자 정보' 탭이 있는 상담자용 시트(내 사본)의 Apps Script에서 실행하세요.");
  }
  myCheckIntakeHeaders_(ss.getSheetByName(MY_INTAKE_SHEET));

  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let form = null;
  try {
    const savedId = props.getProperty(MY_PROP_FORM);
    if (savedId && props.getProperty(MY_PROP_BOOK) === ss.getId()) {
      try { form = FormApp.openById(savedId); } catch (error) { form = null; }
    }
    if (!form) {
      form = FormApp.create(MY_FORM_TITLE);
      props.setProperty(MY_PROP_FORM, form.getId());
    }
    props.setProperty(MY_PROP_BOOK, ss.getId());

    form.setDescription(MY_FORM_INTRO)
      .setCollectEmail(false)
      .setLimitOneResponsePerUser(false)
      .setAllowResponseEdits(false)
      .setConfirmationMessage('답변을 접수했습니다. 다음 상담에서 함께 확인하겠습니다.');

    const existing = form.getItems().map(item => item.getTitle());
    MY_FORM_FIELDS.forEach(([title, help, required, long]) => {
      if (existing.indexOf(title) >= 0) return;
      const item = long ? form.addParagraphTextItem() : form.addTextItem();
      item.setTitle(title).setHelpText(help).setRequired(required);
    });

    const hasTrigger = ScriptApp.getProjectTriggers().some(trigger =>
      trigger.getHandlerFunction() === 'onMyJobseekerFormSubmit' && trigger.getTriggerSourceId() === form.getId());
    if (!hasTrigger) {
      ScriptApp.newTrigger('onMyJobseekerFormSubmit').forForm(form).onFormSubmit().create();
    }

    try {
      if (form.supportsAdvancedResponderPermissions && form.supportsAdvancedResponderPermissions()) form.setPublished(true);
    } catch (error) { /* 예전 방식의 폼은 만들면 바로 공개된다 */ }
    form.setAcceptingResponses(true);
  } finally {
    lock.releaseLock();
  }

  const url = form.getPublishedUrl();
  myWriteGuideLink_(ss, url);
  SpreadsheetApp.getUi().alert(
    '사전 질문지를 만들었습니다',
    '구직자에게 보낼 주소\n' + url + '\n\n질문을 고치는 주소\n' + form.getEditUrl() +
      "\n\n제출된 답변은 '구직자 정보' 탭에 ID 순번으로 등록됩니다.",
    SpreadsheetApp.getUi().ButtonSet.OK);
}

/** 폼이 제출될 때 자동으로 실행된다. */
function onMyJobseekerFormSubmit(e) {
  if (!e || !e.response) return;
  myRegisterResponse_(e.response);
}

/** 자동 등록이 빠진 답변이 있을 때 한 번 실행하면 빠진 것만 등록한다. */
function registerMissingJobseekerResponses() {
  const formId = PropertiesService.getScriptProperties().getProperty(MY_PROP_FORM);
  if (!formId) throw new Error('먼저 createMyJobseekerForm 을 실행하세요.');
  FormApp.openById(formId).getResponses().forEach(response => myRegisterResponse_(response));
}

function myRegisterResponse_(response) {
  const key = String(response.getId());
  const answers = {};
  response.getItemResponses().forEach(itemResponse => {
    answers[itemResponse.getItem().getTitle()] = String(itemResponse.getResponse() || '').trim();
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const bookId = PropertiesService.getScriptProperties().getProperty(MY_PROP_BOOK);
    const ss = bookId ? SpreadsheetApp.openById(bookId) : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MY_INTAKE_SHEET);
    const cols = myCheckIntakeHeaders_(sheet);
    const width = cols.heads.length;
    const lastRow = Math.max(sheet.getLastRow(), 2);
    const rows = sheet.getRange(2, 1, lastRow - 1, width).getDisplayValues();

    if (rows.some(row => row[cols.key] === key)) return;   // 이미 등록한 답변

    const highest = rows.reduce((max, row) => (/^ID-\d+$/.test(row[cols.id]) ? Math.max(max, Number(row[cols.id].slice(3))) : max), 0);
    const freeIndex = rows.findIndex(row => row.slice(1).every(value => value === ''));
    const target = freeIndex >= 0 ? freeIndex + 2 : lastRow + 1;
    if (target > sheet.getMaxRows()) sheet.insertRowAfter(sheet.getMaxRows());

    const values = cols.heads.map(head => {
      const input = answers[head] || '';
      return /^[=+@'-]/.test(input) ? "'" + input : input;   // 수식으로 실행되지 않게 막는다
    });
    values[0] = false;
    values[cols.id] = 'ID-' + (highest + 1);
    values[cols.key] = key;

    sheet.getRange(target, 1).insertCheckboxes();
    sheet.getRange(target, 1, 1, width).setValues([values]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

/** '구직자 정보' 탭의 열 제목이 질문지와 맞는지 확인하고 열 위치를 돌려준다. */
function myCheckIntakeHeaders_(sheet) {
  const heads = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(text => String(text).trim());
  const id = heads.indexOf('구직자 ID');
  const key = heads.indexOf('폼 응답 식별자');
  const missing = MY_FORM_FIELDS.map(field => field[0]).filter(title => heads.indexOf(title) < 0);
  if (id < 0 || key < 0 || missing.length > 0) {
    throw new Error("'구직자 정보' 탭의 열 제목을 확인하세요. 없는 제목: " +
      [id < 0 ? '구직자 ID' : '', key < 0 ? '폼 응답 식별자' : ''].concat(missing).filter(Boolean).join(', '));
  }
  return { heads: heads, id: id, key: key };
}

function myWriteGuideLink_(ss, url) {
  const guide = ss.getSheetByName(MY_GUIDE_SHEET);
  if (!guide) return;
  const labels = guide.getRange(1, 1, guide.getLastRow(), 1).getDisplayValues().map(row => String(row[0]).trim());
  const index = labels.indexOf('구직자 작성 링크');
  if (index >= 0) guide.getRange(index + 1, 2).setValue(url);
}
