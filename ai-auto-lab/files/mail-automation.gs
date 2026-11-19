// ==========================================
// [설정 영역] 여기만 수정해서 사용하세요!
// ==========================================
const SENDER_NAME = "홍길동"; // 보내는 사람 이름
const EMAIL_SUBJECT = "안녕하세요, {이름}님! 안내 메일 드립니다."; // 메일 제목 ({이름} 사용 가능)
const EMAIL_BODY = `안녕하세요, {이름}님.

준비된 안내 내용을 여기에 적어주세요.
여러 줄로 편하게 작성할 수 있습니다.

감사합니다.
${SENDER_NAME} 드림`;

// 시트 열 위치 설정 (1행은 제목이므로 데이터는 2행부터 시작)
const SHEET_NAME = ""; // 비워두면 현재 활성화된 첫 번째 시트 사용
const COL_EMAIL = 1;  // A열: 이메일 주소
const COL_NAME = 2;   // B열: 받는 사람 이름
const COL_CHECK = 3;  // C열: 체크박스
const COL_STATUS = 4; // D열: 발송 결과

// ==========================================
// 아래 코드는 수정하지 않아도 됩니다.
// ==========================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("메일 자동화")
    .addItem("체크박스 추가/정리", "setupCheckboxes")
    .addItem("전체 체크", "checkAllRows")
    .addItem("전체 체크 해제", "uncheckAllRows")
    .addSeparator()
    .addItem("테스트 발송", "sendTestEmail")
    .addItem("전체 발송", "sendAllEmails")
    .addToUi();
}

function getTargetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (SHEET_NAME && SHEET_NAME.trim() !== "") {
    const sheet = ss.getSheetByName(SHEET_NAME.trim());
    if (!sheet) {
      throw new Error(`'${SHEET_NAME}' 시트를 찾을 수 없습니다.`);
    }
    return sheet;
  }
  return ss.getActiveSheet();
}

function setupCheckboxes() {
  const sheet = getTargetSheet();
  const ui = SpreadsheetApp.getUi();

  // 1행 제목 정리
  sheet.getRange(1, COL_EMAIL).setValue("이메일 주소");
  sheet.getRange(1, COL_NAME).setValue("받는 사람 이름");
  sheet.getRange(1, COL_CHECK).setValue("발송 선택");
  sheet.getRange(1, COL_STATUS).setValue("발송 결과");

  const lastRow = Math.max(sheet.getLastRow(), 2);
  const checkRange = sheet.getRange(2, COL_CHECK, lastRow - 1, 1);
  checkRange.insertCheckboxes();

  ui.alert(`2행부터 ${lastRow}행까지 C열에 체크박스를 생성했습니다.`);
}

function setAllCheckboxes(checked) {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const checkRange = sheet.getRange(2, COL_CHECK, lastRow - 1, 1);
  checkRange.insertCheckboxes();
  checkRange.setValue(checked);
}

function checkAllRows() {
  setAllCheckboxes(true);
}

function uncheckAllRows() {
  setAllCheckboxes(false);
}

function personalizeText(template, name) {
  const safeName = name ? String(name).trim() : "고객";
  return template.replace(/\{이름\}/g, safeName);
}

function sendSingleRowEmail(sheet, rowIndex, isTest) {
  const email = String(sheet.getRange(rowIndex, COL_EMAIL).getValue() || "").trim();
  const name = String(sheet.getRange(rowIndex, COL_NAME).getValue() || "").trim();

  if (!email) {
    return false;
  }

  const personalizedSubject = personalizeText(EMAIL_SUBJECT, name);
  const finalSubject = isTest ? `[테스트] ${personalizedSubject}` : personalizedSubject;
  const finalBody = personalizeText(EMAIL_BODY, name);

  GmailApp.sendEmail(email, finalSubject, finalBody, {
    name: SENDER_NAME
  });

  const formattedDate = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd HH:mm"
  );

  sheet.getRange(rowIndex, COL_STATUS).setValue(
    isTest ? `테스트 발송 완료 (${formattedDate})` : `발송 완료 (${formattedDate})`
  );

  // 발송 후 체크박스 자동 해제 (중복 발송 방지)
  sheet.getRange(rowIndex, COL_CHECK).setValue(false);

  return true;
}

function sendTestEmail() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getTargetSheet();
  const testRow = 2; // 1행은 제목이므로 첫 번째 수신자는 2행

  const email = String(sheet.getRange(testRow, COL_EMAIL).getValue() || "").trim();
  if (!email) {
    ui.alert("2행에 이메일 주소가 없습니다. 확인 후 다시 시도해 주세요.");
    return;
  }

  try {
    sendSingleRowEmail(sheet, testRow, true);
    ui.alert(`2행(${email})으로 테스트 메일을 발송했습니다.\nD열에 테스트 발송 결과가 기록되었습니다.`);
  } catch (err) {
    ui.alert(`테스트 발송 중 오류가 발생했습니다:\n${err.message}`);
  }
}

function sendAllEmails() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    ui.alert("발송할 대상(2행 이상)이 없습니다.");
    return;
  }

  // 조건: A열 이메일이 있고, C열 체크박스가 체크(true)되어 있으며, D열 발송 결과가 비어 있는 행
  const targetRows = [];
  for (let row = 2; row <= lastRow; row++) {
    const email = String(sheet.getRange(row, COL_EMAIL).getValue() || "").trim();
    const isChecked = sheet.getRange(row, COL_CHECK).getValue() === true;
    const status = String(sheet.getRange(row, COL_STATUS).getValue() || "").trim();

    if (email && isChecked && status === "") {
      targetRows.push(row);
    }
  }

  if (targetRows.length === 0) {
    ui.alert(
      "발송할 대상이 없습니다.\n(C열 체크박스가 선택되고, D열이 비어 있는 수신자를 확인해 주세요.)"
    );
    return;
  }

  const response = ui.alert(
    "전체 발송 확인",
    `선택된 총 ${targetRows.length}명에게 메일을 발송하시겠습니까?`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert("전체 발송이 취소되었습니다.");
    return;
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const row of targetRows) {
    try {
      const sent = sendSingleRowEmail(sheet, row, false);
      if (sent) {
        sentCount++;
      }
    } catch (err) {
      failedCount++;
      sheet.getRange(row, COL_STATUS).setValue(`발송 실패: ${err.message}`);
    }
  }

  ui.alert(
    `전체 발송이 완료되었습니다.\n- 성공: ${sentCount}건\n- 실패: ${failedCount}건`
  );
}
