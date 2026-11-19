/**
 * 이메일 발송 자동화
 *
 * A열: 이메일 주소
 * B열: 받는 사람 이름
 * C열: 발송 선택 체크박스
 * D열: 발송 상태
 * E열: 발송 일시
 *
 * H2: 이메일 제목
 * H3: 이메일 본문
 * H4: 발신자 이름
 */

const CONFIG = {
  SHEET_NAME: '시트1',
  START_ROW: 2,

  EMAIL_COLUMN: 1,       // A열
  NAME_COLUMN: 2,        // B열
  CHECK_COLUMN: 3,       // C열
  STATUS_COLUMN: 4,      // D열
  SENT_DATE_COLUMN: 5,   // E열

  SUBJECT_CELL: 'H2',
  BODY_CELL: 'H3',
  SENDER_CELL: 'H4'
};


/**
 * 시트를 열면 상단에 이메일 발송 메뉴를 생성합니다.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📧 이메일 발송')
    .addItem('선택한 사람에게 발송', 'sendSelectedEmails')
    .addItem('첫 번째 수신자에게 테스트 발송', 'sendTestEmail')
    .addSeparator()
    .addItem('발송 기록 초기화', 'resetSendStatus')
    .addToUi();
}


/**
 * C열에서 체크한 사람에게 이메일을 발송합니다.
 */
function sendSelectedEmails() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getTargetSheet();

  const subject = String(
    sheet.getRange(CONFIG.SUBJECT_CELL).getDisplayValue()
  ).trim();

  const bodyTemplate = String(
    sheet.getRange(CONFIG.BODY_CELL).getDisplayValue()
  ).trim();

  const senderName = String(
    sheet.getRange(CONFIG.SENDER_CELL).getDisplayValue()
  ).trim() || '안내 메일';

  // 제목과 본문 입력 확인
  if (!subject) {
    ui.alert('H2 셀에 이메일 제목을 입력해 주세요.');
    return;
  }

  if (!bodyTemplate) {
    ui.alert('H3 셀에 이메일 본문을 입력해 주세요.');
    return;
  }

  const lastRecipientRow = getLastRecipientRow(sheet);

  if (lastRecipientRow < CONFIG.START_ROW) {
    ui.alert('A열에 수신자의 이메일 주소를 입력해 주세요.');
    return;
  }

  const rowCount = lastRecipientRow - CONFIG.START_ROW + 1;

  const data = sheet.getRange(
    CONFIG.START_ROW,
    CONFIG.EMAIL_COLUMN,
    rowCount,
    5
  ).getValues();

  const selectedRows = data.filter(function(row) {
    return row[2] === true;
  });

  if (selectedRows.length === 0) {
    ui.alert('C열에서 발송할 사람의 체크박스를 선택해 주세요.');
    return;
  }

  const confirm = ui.alert(
    '이메일 발송 확인',
    '선택한 ' + selectedRows.length + '명에게 이메일을 발송합니다.',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  data.forEach(function(row, index) {
    const rowNumber = CONFIG.START_ROW + index;

    const emailAddress = String(row[0] || '').trim();
    const recipientName = String(row[1] || '').trim();
    const isChecked = row[2] === true;
    const currentStatus = String(row[3] || '').trim();

    // 체크되지 않은 행은 제외
    if (!isChecked) {
      return;
    }

    // 이미 발송 완료된 행은 중복 발송하지 않음
    if (currentStatus === '발송 완료') {
      skippedCount++;
      return;
    }

    if (!emailAddress) {
      writeFailure(sheet, rowNumber, '이메일 주소 없음');
      failCount++;
      return;
    }

    if (!isValidEmail(emailAddress)) {
      writeFailure(sheet, rowNumber, '이메일 주소 형식 오류');
      failCount++;
      return;
    }

    const displayName = recipientName || '담당자';

    // {{이름}}을 B열 이름으로 변경
    const personalizedSubject = replaceVariables(
      subject,
      displayName
    );

    const personalizedBody = replaceVariables(
      bodyTemplate,
      displayName
    );

    try {
      GmailApp.sendEmail(
        emailAddress,
        personalizedSubject,
        personalizedBody,
        {
          name: senderName,
          htmlBody: convertTextToHtml(personalizedBody)
        }
      );

      sheet.getRange(rowNumber, CONFIG.STATUS_COLUMN)
        .setValue('발송 완료');

      sheet.getRange(rowNumber, CONFIG.SENT_DATE_COLUMN)
        .setValue(new Date())
        .setNumberFormat('yyyy-MM-dd HH:mm:ss');

      // 발송 후 체크박스 해제
      sheet.getRange(rowNumber, CONFIG.CHECK_COLUMN)
        .setValue(false);

      successCount++;

      // 너무 빠른 연속 발송 방지
      Utilities.sleep(300);

    } catch (error) {
      writeFailure(
        sheet,
        rowNumber,
        error.message
      );

      failCount++;
    }
  });

  SpreadsheetApp.flush();

  ui.alert(
    '발송 결과\n\n' +
    '발송 완료: ' + successCount + '건\n' +
    '발송 실패: ' + failCount + '건\n' +
    '중복 발송 제외: ' + skippedCount + '건'
  );
}


/**
 * A열에서 첫 번째로 입력된 이메일에 테스트 발송합니다.
 */
function sendTestEmail() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getTargetSheet();

  const subject = String(
    sheet.getRange(CONFIG.SUBJECT_CELL).getDisplayValue()
  ).trim();

  const bodyTemplate = String(
    sheet.getRange(CONFIG.BODY_CELL).getDisplayValue()
  ).trim();

  const senderName = String(
    sheet.getRange(CONFIG.SENDER_CELL).getDisplayValue()
  ).trim() || '안내 메일';

  if (!subject || !bodyTemplate) {
    ui.alert('H2에 제목, H3에 본문을 먼저 입력해 주세요.');
    return;
  }

  const lastRecipientRow = getLastRecipientRow(sheet);

  if (lastRecipientRow < CONFIG.START_ROW) {
    ui.alert('A열에 테스트할 이메일 주소를 입력해 주세요.');
    return;
  }

  const data = sheet.getRange(
    CONFIG.START_ROW,
    CONFIG.EMAIL_COLUMN,
    lastRecipientRow - CONFIG.START_ROW + 1,
    2
  ).getValues();

  const firstRecipient = data.find(function(row) {
    return String(row[0] || '').trim() !== '';
  });

  if (!firstRecipient) {
    ui.alert('테스트할 이메일 주소가 없습니다.');
    return;
  }

  const emailAddress = String(firstRecipient[0]).trim();
  const recipientName = String(firstRecipient[1] || '테스트 수신자').trim();

  if (!isValidEmail(emailAddress)) {
    ui.alert('첫 번째 이메일 주소의 형식을 확인해 주세요.');
    return;
  }

  const personalizedBody = replaceVariables(
    bodyTemplate,
    recipientName
  );

  try {
    GmailApp.sendEmail(
      emailAddress,
      '[테스트] ' + replaceVariables(subject, recipientName),
      personalizedBody,
      {
        name: senderName,
        htmlBody: convertTextToHtml(personalizedBody)
      }
    );

    ui.alert(
      emailAddress + ' 주소로 테스트 이메일을 발송했습니다.'
    );

  } catch (error) {
    ui.alert(
      '테스트 발송 실패\n\n' + error.message
    );
  }
}


/**
 * 발송 상태와 발송 일시를 초기화합니다.
 */
function resetSendStatus() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getTargetSheet();

  const lastRecipientRow = getLastRecipientRow(sheet);

  if (lastRecipientRow < CONFIG.START_ROW) {
    ui.alert('초기화할 발송 기록이 없습니다.');
    return;
  }

  const confirm = ui.alert(
    '발송 기록 초기화',
    'D열의 발송 상태와 E열의 발송 일시를 삭제합니다.',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  sheet.getRange(
    CONFIG.START_ROW,
    CONFIG.STATUS_COLUMN,
    lastRecipientRow - CONFIG.START_ROW + 1,
    2
  ).clearContent();

  ui.alert('발송 기록을 초기화했습니다.');
}


/**
 * A열 기준으로 마지막 수신자 행을 확인합니다.
 *
 * H열의 이메일 설정 영역 때문에 getLastRow()만 사용하면
 * 수신자 목록과 관계없는 행까지 포함될 수 있으므로
 * A열만 기준으로 확인합니다.
 */
function getLastRecipientRow(sheet) {
  const maxRow = sheet.getLastRow();

  if (maxRow < CONFIG.START_ROW) {
    return 0;
  }

  const emailValues = sheet.getRange(
    CONFIG.START_ROW,
    CONFIG.EMAIL_COLUMN,
    maxRow - CONFIG.START_ROW + 1,
    1
  ).getDisplayValues();

  for (let index = emailValues.length - 1; index >= 0; index--) {
    if (String(emailValues[index][0]).trim() !== '') {
      return CONFIG.START_ROW + index;
    }
  }

  return 0;
}


/**
 * {{이름}}을 실제 받는 사람 이름으로 변경합니다.
 */
function replaceVariables(text, recipientName) {
  return String(text).replace(
    /\{\{\s*이름\s*\}\}/g,
    recipientName
  );
}


/**
 * 일반 텍스트 본문을 HTML 형식으로 변환합니다.
 */
function convertTextToHtml(text) {
  return `
    <div style="
      max-width:600px;
      margin:0 auto;
      padding:28px;
      border:1px solid #dddddd;
      border-radius:8px;
      font-family:Arial, 'Noto Sans KR', sans-serif;
      font-size:15px;
      line-height:1.8;
      color:#222222;
    ">
      ${escapeHtml(text).replace(/\n/g, '<br>')}
    </div>
  `;
}


/**
 * 발송 실패를 D열과 E열에 기록합니다.
 */
function writeFailure(sheet, rowNumber, errorMessage) {
  sheet.getRange(rowNumber, CONFIG.STATUS_COLUMN)
    .setValue('발송 실패');

  sheet.getRange(rowNumber, CONFIG.SENT_DATE_COLUMN)
    .setValue(errorMessage);
}


/**
 * 대상 시트를 가져옵니다.
 */
function getTargetSheet() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    throw new Error(
      '"' + CONFIG.SHEET_NAME + '" 시트를 찾을 수 없습니다.'
    );
  }

  return sheet;
}


/**
 * 이메일 주소 형식을 확인합니다.
 */
function isValidEmail(emailAddress) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    .test(emailAddress);
}


/**
 * HTML 특수문자를 안전하게 변환합니다.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
