export function buildCompanyPrompt(company) {
  return `너는 취업 컨설턴트다. 아래 기업/채용 정보를 바탕으로 자기소개서 작성에 바로 활용할 수 있는 기업·직무 분석 결과를 JSON으로만 작성해라.

출력 규칙:
- 반드시 JSON 객체만 출력한다. 마크다운, 코드블록, 설명 문장을 넣지 않는다.
- 각 배열은 3~5개 항목으로 작성한다.
- 배열 안의 각 문자열은 반드시 '1) ', '2) ', '3) '처럼 번호로 시작하고, 한 문장 이내로 짧게 쓴다.
- 입력 정보에 없는 사실은 단정하지 말고 '추가 확인 필요'라고 표시한다.
- 추상어보다 자기소개서에 옮겨 쓸 수 있는 구체 표현을 우선한다. 실제 수행 여부를 모르는 경험을 본인의 성과로 단정하지 않는다. 표현 제안은 조건부 예시로 명시한다.
- 각 항목은 '번호) 핵심어 - 짧은 설명' 형태로 쓴다.

JSON 스키마:
{
  "job_keywords": ["직무 핵심 키워드"],
  "required_competencies": ["요구 역량 키워드"],
  "experience_connection_points": ["지원자의 경험과 연결할 포인트"],
  "motivation_materials": ["지원동기 문장 재료"],
  "resume_phrases": ["자소서에 넣기 좋은 표현"],
  "interview_questions": ["면접 예상 질문"],
  "company_job_summary": ["기업과 직무를 이해하기 쉬운 핵심 요약"]
}

기업 정보:
${JSON.stringify(company, null, 2)}`;
}

export function buildCoverLetterPrompt(experience, companyContext) {
  return `너는 취업 컨설턴트다. 아래 경험 노트와 기업/직무 맥락을 바탕으로 자기소개서 초안 작성에 필요한 결과를 JSON으로만 작성해라.

출력 규칙:
- 반드시 JSON 객체만 출력한다. 마크다운, 코드블록, 설명 문장을 넣지 않는다.
- 경험을 과장하지 말고 입력된 행동과 성과를 중심으로 쓴다. 입력에 없는 수치·건강 상태·수료 과정·행동·성과를 만들어내지 않는다. 정보가 부족하면 초안을 짧게 작성하고 revision_points에 확인할 내용을 넣는다.
- matching_keywords와 revision_points 배열의 각 문자열도 반드시 '1) ', '2) ', '3) '처럼 번호로 시작한다.
- 자기소개서 초안은 700~900자 내외로 작성한다.
- 초안에는 상황-행동-성과-직무기여가 드러나야 한다.

JSON 스키마:
{
  "target_company_job": "가장 잘 연결되는 기업명/직무",
  "matching_keywords": ["경험과 직무가 만나는 키워드"],
  "application_question": "이 경험을 활용하기 좋은 자소서 문항 유형",
  "cover_letter_draft": "자기소개서 초안",
  "revision_points": ["사용자가 보완하면 좋은 점"]
}

기업/직무 맥락:
${companyContext || '기업 정보가 부족합니다.'}

경험 노트:
${JSON.stringify(experience, null, 2)}`;
}

