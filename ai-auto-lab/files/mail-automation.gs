/**
 * 이메일 자동화 참고 코드 (강사 백업용)
 * Gemini가 만든 코드가 동작하지 않을 때 이 코드를 붙여 넣어 실습을 이어갑니다.
 *
 * 시트 구성 (1행은 제목)
 *   A열: 이메일 주소 / B열: 받는 사람 이름 / C열: 발송 결과
 */

// ===== 여기만 고치세요 (따옴표 ' ' 는 지우지 않습니다) =====
const SUBJECT = '취업 준비 모임 회의 안내';
const BODY =
  '{이름}님, 안녕하세요.\n\n' +
  '다음 주 취업 준비 활동을 논의하기 위해 회의를 엽니다.\n\n' +
  '- 일시: 7월 24일 오후 2시\n' +
  '- 장소: 교육장 2층 회의실\n' +
  '- 준비사항: 이력서 초안 지참\n\n' +
  '참석 여부를 회신해 주시면 감사하겠습니다.';
const SENDER_NAME = '취업 준비 모임';
// ==========================================================

// 시트를 열면 '메일 자동화' 메뉴를 만듭니다.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('메일 자동화')
    .addItem('1. 테스트 발송 (2행 한 명)', 'sendTest')
    .addItem('2. 전체 발송', 'sendAll')
    .addToUi();
}

// 2행 한 사람에게만 [테스트] 메일을 보냅니다.
function sendTest() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const email = String(sheet.getRange(2, 1).getValue()).trim();
  const name = String(sheet.getRange(2, 2).getValue()).trim();

  if (!isValidEmail(email)) {
    ui.alert('2행의 이메일 주소 형식을 확인해 주세요.');
    return;
  }

  try {
    sendOne(email, name, '[테스트] ');
    ui.alert(email + ' 주소로 테스트 메일을 보냈습니다.');
  } catch (error) {
    ui.alert('테스트 발송 실패\n\n' + error.message);
  }
}

// C열(발송 결과)이 비어 있는 사람에게만 보냅니다.
function sendAll() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    ui.alert('2행부터 받는 사람 정보를 입력해 주세요.');
    return;
  }

  const answer = ui.alert(
    '전체 발송',
    'C열이 비어 있는 사람에게 메일을 보냅니다. 계속할까요?',
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) return;

  const rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  let sent = 0;

  rows.forEach(function (row, i) {
    const email = String(row[0]).trim();
    const name = String(row[1]).trim();
    const result = String(row[2]).trim();
    const resultCell = sheet.getRange(i + 2, 3);

    if (result !== '' || email === '') return; // 이미 보냈거나 빈 행은 건너뜁니다.

    if (!isValidEmail(email)) {
      resultCell.setValue('주소 확인 필요');
      return;
    }

    try {
      sendOne(email, name, '');
      resultCell.setValue('발송 완료 ' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'));
      sent++;
    } catch (error) {
      resultCell.setValue('발송 실패: ' + error.message);
    }
  });

  ui.alert(sent + '명에게 메일을 보냈습니다. C열 결과를 확인해 주세요.');
}

// 메일 한 통을 보냅니다.
function sendOne(email, name, prefix) {
  const body = BODY.split('{이름}').join(name);
  GmailApp.sendEmail(email, prefix + SUBJECT, body, {
    name: SENDER_NAME,
    htmlBody: body.replace(/\n/g, '<br>')
  });
}

// 이메일 주소 형식을 간단히 확인합니다.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
