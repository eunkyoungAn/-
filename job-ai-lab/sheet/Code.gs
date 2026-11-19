/**
 * 구인기업·직무 분석 자동화 (AI 취업지원 실무)
 * - '구인기업 리스트'에서 '분석 선택'에 체크한 행만 처리한다.
 * - 공고 문장은 스크립트가 한 줄씩 나눈다. AI는 문장을 바꾸거나 더하지 못하고,
 *   문장마다 요구 역량과 대응 하위능력만 붙인다.
 * - 대응 하위능력은 '판단 기준' 탭에 있는 이름만 인정한다. 기관 양식으로 바꾸려면 그 탭을 고친다.
 */
const CONFIG = {
  COMPANY_SHEET: '구인기업 리스트',
  ANALYSIS_SHEET: '직무 분석',
  SUMMARY_SHEET: '구인기업 분석 요약',
  CRITERIA_SHEET: '판단 기준',
  MODEL: 'gemini-3.1-flash-lite',
  API_CALL_DELAY_MS: 1200
};

const PARTS = [
  { header: '담당업무', must: '필수(업무)' },
  { header: '자격요건', must: '필수' },
  { header: '우대사항', must: '우대' }
];

const NONE_LABEL = '해당 없음(NCS 확인)';

const ANALYSIS_HEADERS = ['구인기업명', '채용직무', '구분', '공고 원문 문장', '요구 역량', '대응 하위능력', '필수/우대', '대응 이유', '상담자 확인', '생성일시'];
const SUMMARY_HEADERS = ['구인기업명', '채용직무', '직무 한 줄 요약', '필수 요건 요약', '우대 요건 요약', '구인기업에 확인할 사항', '알선 시 확인할 점', '생성일시'];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('자동화')
    .addItem('Gemini API 키 저장', 'saveGeminiApiKey')
    .addSeparator()
    .addItem('직무 분석 생성 (체크한 구인기업)', 'createJobAnalysis')
    .addItem('공고 문장만 나누기 (AI 없이)', 'splitPostingOnly')
    .addToUi();
}

function saveGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Gemini API 키 저장',
    'Google AI Studio에서 발급받은 Gemini API 키를 입력하세요. Apps Script 속성에 저장됩니다.',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;

  const key = response.getResponseText().trim();
  if (!key) {
    ui.alert('API 키가 입력되지 않았습니다.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
  ui.alert('Gemini API 키가 저장되었습니다.');
}

function createJobAnalysis() {
  runJobAnalysis_(true);
}

function splitPostingOnly() {
  runJobAnalysis_(false);
}

function runJobAnalysis_(useAi) {
  const ui = SpreadsheetApp.getUi();
  const companies = readCompanies_();
  if (companies.length === 0) {
    ui.alert("선택된 구인기업이 없습니다. '구인기업 리스트' 탭의 분석 선택 칸을 체크하세요.");
    return;
  }

  const criteria = readCriteria_();
  const analysisRows = [];
  const summaryRows = [];
  const skipped = [];

  companies.forEach(company => {
    const name = company['구인기업명'] || '';
    const job = company['채용직무'] || '';
    const items = splitPosting_(company);

    if (items.length === 0) {
      skipped.push(name);
      return;
    }

    let result = {};
    let errorText = '';

    if (useAi) {
      try {
        result = callGeminiJson_(buildAnalysisPrompt_(company, items, criteria));
        pauseAfterApiCall_();
        if (result.raw_text) errorText = 'AI 응답을 읽지 못했습니다. 직접 작성하거나 다시 실행하세요.';
      } catch (error) {
        errorText = formatApiError_(error);
      }
    }

    buildAnalysisRows_(name, job, items, result, criteria, errorText, useAi)
      .forEach(row => analysisRows.push(row));

    if (useAi) {
      summaryRows.push(buildSummaryRow_(name, job, result, errorText));
    }
  });

  if (analysisRows.length > 0) {
    writeRows_(CONFIG.ANALYSIS_SHEET, ANALYSIS_HEADERS, analysisRows, 9);
  }
  if (summaryRows.length > 0) {
    writeRows_(CONFIG.SUMMARY_SHEET, SUMMARY_HEADERS, summaryRows, 0);
  }

  let message = `구인기업 ${companies.length - skipped.length}곳, 공고 문장 ${analysisRows.length}개를 '직무 분석' 탭에 정리했습니다.`;
  if (useAi) message += '\n요구 역량과 대응 하위능력은 AI가 붙인 것입니다. 공고 문장과 맞는지 확인한 뒤 상담자 확인 칸에 체크하세요.';
  if (skipped.length > 0) message += `\n\n담당업무·자격요건·우대사항이 비어 있어 건너뛴 기업: ${skipped.join(', ')}`;
  ui.alert(message);
}

/** 공고의 담당업무·자격요건·우대사항을 한 줄씩 나눈다. 문장은 고치지 않는다. */
function splitPosting_(company) {
  const items = [];
  PARTS.forEach(part => {
    String(company[part.header] || '')
      .split(/\r?\n/)
      .map(line => line.replace(/^\s*(?:[-•·▪◦*]|\d+[.)]|[①-⑳])\s*/, '').trim())
      .filter(Boolean)
      .forEach(text => {
        items.push({ id: items.length + 1, part: part.header, must: part.must, text: text });
      });
  });
  return items;
}

function buildAnalysisRows_(name, job, items, result, criteria, errorText, useAi) {
  const byId = {};
  (Array.isArray(result.rows) ? result.rows : []).forEach(row => {
    if (row && row.id !== undefined) byId[String(row.id)] = row;
  });
  const now = new Date();

  return items.map(item => {
    const ai = byId[String(item.id)] || {};
    const matched = matchCriteria_(ai.competencies, criteria);
    let need = '';
    let competency = '';
    let reason = '';

    if (useAi) {
      need = String(ai.need || '').trim();
      competency = matched.length > 0 ? matched.join(', ') : NONE_LABEL;
      reason = errorText || String(ai.reason || '').trim();
      if (!errorText && !byId[String(item.id)]) reason = 'AI 응답에 이 문장이 없습니다. 직접 작성하세요.';
      if (errorText || !byId[String(item.id)]) competency = '';
    }

    return [name, job, item.part, item.text, need, competency, item.must, reason, false, now];
  });
}

function buildSummaryRow_(name, job, result, errorText) {
  const summary = result.summary || {};
  return [
    name,
    job,
    errorText || String(summary.job_summary || '').trim(),
    listToText_(summary.must_summary),
    listToText_(summary.preferred_summary),
    listToText_(summary.questions_for_employer),
    listToText_(summary.placement_notes),
    new Date()
  ];
}

/** AI가 고른 이름 가운데 '판단 기준' 탭에 실제로 있는 이름만 남긴다(최대 2개). */
function matchCriteria_(values, criteria) {
  const list = Array.isArray(values) ? values : (values ? String(values).split(/[,，/]/) : []);
  const compact = text => String(text || '').replace(/\s/g, '');
  const matched = [];
  list.forEach(value => {
    const found = criteria.find(c => compact(c.name) === compact(value));
    if (found && matched.indexOf(found.name) < 0) matched.push(found.name);
  });
  return matched.slice(0, 2);
}

function buildAnalysisPrompt_(company, items, criteria) {
  const criteriaText = criteria.map(c => `- ${c.name}${c.cue ? ': ' + c.cue : ''}`).join('\n');
  const info = {};
  ['구인기업명', '업종/주요 서비스', '근무지역', '기업 규모', '채용직무', '고용형태', '근무조건', '전형절차'].forEach(key => {
    if (company[key]) info[key] = company[key];
  });
  const lines = items.map(item => ({ id: item.id, part: item.part, text: item.text }));

  return `너는 고용서비스 기관의 직무분석 보조자다. 아래 [공고 문장]은 채용공고를 한 줄씩 나눈 것이다. 문장마다 요구 역량과 대응 하위능력을 정리하고, 공고 전체를 요약해 JSON으로만 출력해라.

출력 규칙:
- 반드시 JSON 객체만 출력한다. 마크다운, 코드블록, 설명 문장을 넣지 않는다.
- rows에는 [공고 문장]의 모든 id를 한 번씩 넣는다. 문장을 바꾸거나 새 문장을 더하지 않는다.
- need: 그 문장이 요구하는 역량을 25자 이내 명사구로 쓴다.
- competencies: [판단 기준]의 이름 가운데서만 고른다. 0~2개. 맞는 것이 없으면 빈 배열로 둔다. 이름은 글자 그대로 쓴다.
- reason: 그 하위능력을 고른 이유를 공고 문장의 표현을 들어 한 문장으로 쓴다. 고른 것이 없으면 빈 문자열로 둔다.
- 공고에 없는 사실은 쓰지 않는다. 나이, 성별, 출신 학교에 관한 판단은 하지 않는다.
- summary의 배열은 2~4개 항목으로 쓰고, 각 문자열은 '1) ', '2) '처럼 번호로 시작한다.
- questions_for_employer: 공고만으로는 알 수 없어 구인기업에 확인해야 할 사항을 쓴다.
- placement_notes: 구직자에게 이 공고를 안내하거나 알선할 때 확인할 점을 쓴다. 지원 제도의 금액이나 요건은 쓰지 않는다.

JSON 스키마:
{
  "rows": [{ "id": 1, "need": "요구 역량", "competencies": ["하위능력 이름"], "reason": "고른 이유" }],
  "summary": {
    "job_summary": "이 직무가 하는 일을 한 문장으로",
    "must_summary": ["필수 요건 요약"],
    "preferred_summary": ["우대 요건 요약"],
    "questions_for_employer": ["구인기업에 확인할 사항"],
    "placement_notes": ["알선 시 확인할 점"]
  }
}

[판단 기준]
${criteriaText}

[구인기업 정보]
${JSON.stringify(info, null, 2)}

[공고 문장]
${JSON.stringify(lines, null, 2)}`;
}

function readCompanies_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.COMPANY_SHEET);
  if (!sheet) throw new Error(`시트를 찾을 수 없습니다: ${CONFIG.COMPANY_SHEET}`);

  const values = sheet.getDataRange().getDisplayValues();
  const headerRowIndex = values.findIndex(row => row.some(cell => normalizeHeader_(cell) === '구인기업명'));
  if (headerRowIndex < 0) throw new Error("'구인기업 리스트' 탭에서 '구인기업명' 머리글을 찾을 수 없습니다.");

  const headers = values[headerRowIndex].map(normalizeHeader_);
  const nameIndex = headers.indexOf('구인기업명');
  const selectIndex = headers.indexOf('분석 선택');

  return values.slice(headerRowIndex + 1)
    .filter(row => String(row[nameIndex] || '').trim())
    .filter(row => selectIndex < 0 || isChecked_(row[selectIndex]))
    .map(row => {
      const company = {};
      headers.forEach((header, index) => {
        if (header) company[header] = row[index] || '';
      });
      return company;
    });
}

/** '판단 기준' 탭: 1행은 머리글(영역, 하위능력, 판정 단서). 기관 양식으로 바꾸려면 이 탭을 고친다. */
function readCriteria_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.CRITERIA_SHEET);
  if (!sheet) throw new Error(`시트를 찾을 수 없습니다: ${CONFIG.CRITERIA_SHEET}`);

  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map(normalizeHeader_);
  const nameIndex = Math.max(headers.indexOf('하위능력'), 0);
  const cueIndex = headers.indexOf('판정 단서');

  const criteria = values.slice(1)
    .map(row => ({ name: String(row[nameIndex] || '').trim(), cue: cueIndex < 0 ? '' : String(row[cueIndex] || '').trim() }))
    .filter(c => c.name);

  if (criteria.length === 0) throw new Error("'판단 기준' 탭에 하위능력이 없습니다.");
  return criteria;
}

function normalizeHeader_(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  const compact = text.replace(/\s/g, '');
  const map = {
    '분석선택': '분석 선택',
    '기업명': '구인기업명',
    '업종/주요서비스': '업종/주요 서비스',
    '기업규모': '기업 규모',
    '주요업무': '담당업무',
    '판정단서': '판정 단서'
  };
  return map[compact] || text;
}

function isChecked_(value) {
  const text = String(value || '').trim().toUpperCase();
  return value === true || ['TRUE', '예', 'Y', 'YES', '1', '✓', '✔'].indexOf(text) >= 0;
}

/** 같은 구인기업·채용직무의 이전 결과는 지우고 새 결과로 바꾼다. */
function writeRows_(sheetName, headers, rows, checkboxColumn) {
  const sheet = getOrCreateSheet_(sheetName);
  ensureOutputHeader_(sheet, headers);

  const keyOf = row => `${row[0]}||${row[1]}`;
  const newKeys = {};
  rows.forEach(row => { newKeys[keyOf(row)] = true; });

  const lastRow = sheet.getLastRow();
  let kept = [];
  if (lastRow >= 2) {
    const range = sheet.getRange(2, 1, lastRow - 1, headers.length);
    kept = range.getValues().filter(row => String(row[0] || '').trim() && !newKeys[keyOf(row)]);
    range.clearContent();
  }

  const all = kept.concat(rows);
  if (all.length === 0) return;

  sheet.getRange(2, 1, all.length, headers.length).setValues(all);
  sheet.getRange(2, 1, all.length, headers.length).setWrap(true).setVerticalAlignment('top');
  if (checkboxColumn > 0) {
    sheet.getRange(2, checkboxColumn, all.length, 1).insertCheckboxes();
  }
}

function callGeminiJson_(prompt) {
  const text = callGemini_(prompt);
  try {
    return JSON.parse(cleanJsonText_(text));
  } catch (error) {
    return { raw_text: text };
  }
}

function cleanJsonText_(text) {
  return String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function callGemini_(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Gemini API 키가 없습니다. 자동화 > Gemini API 키 저장을 먼저 실행하세요.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' }
  };

  const response = fetchGeminiWithRetry_(url, payload);
  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) {
    throw new Error(`Gemini API 오류 (${status}): ${body}`);
  }

  const data = JSON.parse(body);
  const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  if (!parts || parts.length === 0) return '';
  return parts.map(part => part.text || '').join('\n').trim();
}

function fetchGeminiWithRetry_(url, payload) {
  const maxRetries = 1;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 429 || attempt === maxRetries) return response;
    Utilities.sleep(getRetryDelayMs_(response.getContentText()));
  }
}

function getRetryDelayMs_(body) {
  const match = String(body || '').match(/"retryDelay"\s*:\s*"(\d+)s"/);
  if (!match) return 30000;
  return Math.min(Number(match[1]) * 1000 + 1000, 60000);
}

function pauseAfterApiCall_() {
  if (CONFIG.API_CALL_DELAY_MS > 0) Utilities.sleep(CONFIG.API_CALL_DELAY_MS);
}

function formatApiError_(error) {
  const message = String(error && error.message ? error.message : error);
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
    return 'Gemini API 한도 초과: 잠시 후 다시 실행하거나 체크한 기업 수를 줄이세요.';
  }
  if (message.includes('404') || message.includes('NOT_FOUND') || message.includes('no longer available')) {
    return `Gemini API 모델 오류: 코드 맨 위 MODEL 값(${CONFIG.MODEL})을 지금 쓸 수 있는 모델 이름으로 바꾸세요.`;
  }
  return `API 오류: ${message}`;
}

function listToText_(value) {
  if (Array.isArray(value)) {
    return value.map((item, index) => addListNumber_(item, index)).filter(Boolean).join('\n');
  }
  return value ? String(value) : '';
}

function addListNumber_(value, index) {
  const text = String(value || '').trim();
  if (!text) return '';
  return /^\d+[).]/.test(text) ? text : `${index + 1}) ${text}`;
}

function ensureOutputHeader_(sheet, headers) {
  const current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  if (!headers.every((header, index) => current[index] === header)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.setFrozenRows(1);
}

function getOrCreateSheet_(name) {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
