/**
 * [연습] 가상의 교육 만족도 조사 만들기 — 새 구글 폼의 Apps Script에서 쓰는 코드
 *
 * 쓰는 법
 * 1. forms.google.com 에서 빈 양식을 새로 만든다.
 * 2. 오른쪽 위 ⋮(더보기) → Apps Script 를 연다.
 * 3. 들어 있는 코드를 모두 지우고 이 코드를 붙여 넣은 뒤 저장한다.
 * 4. 함수 createPracticeSurvey 를 골라 실행하고 권한을 승인한다.
 *
 * 하는 일
 * - 지금 열려 있는 양식에 제목, 안내문, 질문 5개, 제출 뒤 문구를 넣는다.
 * - 질문이 이미 들어 있는 양식에서는 멈춘다. 반드시 새 양식에서 실행한다.
 *
 * 질문을 바꾸려면 아래 SURVEY_ITEMS 목록만 고친다.
 */
const SURVEY_TITLE = '[연습] 취업지원 교육 만족도 조사';
const SURVEY_INTRO = '연습용 가상 설문입니다. 실제 이름과 연락처는 적지 마세요.';
const SURVEY_DONE = '응답해 주셔서 감사합니다.';
const SURVEY_ITEMS = [
  // [질문 제목, 형식(scale 5점 척도 / choice 객관식 / text 서술형), 필수 여부, 보기 또는 도움말]
  ['교육 전반에 만족하셨나요?', 'scale', true, ['전혀 그렇지 않다', '매우 그렇다']],
  ['교육 내용이 내 업무에 도움이 되었나요?', 'scale', true, ['전혀 그렇지 않다', '매우 그렇다']],
  ['가장 도움이 된 내용은 무엇인가요?', 'choice', true, ['강의(변화·트렌드·역할)', '취업상담 워크플로우 5단계 실습', '내 업무 에이전트 만들기', '기타']],
  ['실습 난이도는 어땠나요?', 'choice', true, ['쉬웠다', '적당했다', '어려웠다']],
  ['개선할 점이나 더 다뤘으면 하는 내용을 적어 주세요.', 'text', false, '없으면 비워 두셔도 됩니다.']
];

function createPracticeSurvey() {
  const form = FormApp.getActiveForm();
  const existing = form.getItems();
  if (existing.some(item => item.getTitle())) {
    throw new Error('질문이 이미 들어 있는 양식입니다. 새 양식을 만들어 그 양식에서 실행하세요.');
  }
  existing.forEach(item => form.deleteItem(item));   // 새 양식에 기본으로 들어 있는 빈 질문을 지운다
  form.setTitle(SURVEY_TITLE).setDescription(SURVEY_INTRO).setCollectEmail(false).setConfirmationMessage(SURVEY_DONE);
  SURVEY_ITEMS.forEach(row => {
    const title = row[0], type = row[1], required = row[2], extra = row[3];
    if (type === 'scale') {
      form.addScaleItem().setTitle(title).setBounds(1, 5).setLabels(extra[0], extra[1]).setRequired(required);
    } else if (type === 'choice') {
      form.addMultipleChoiceItem().setTitle(title).setChoiceValues(extra).setRequired(required);
    } else {
      form.addParagraphTextItem().setTitle(title).setHelpText(extra).setRequired(required);
    }
  });
  Logger.log('응답자에게 보낼 주소: ' + form.getPublishedUrl());
  Logger.log('질문을 고치는 주소: ' + form.getEditUrl());
}
