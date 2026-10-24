---
language: ko
license: [확인 필요]
tags: [careercatcher, 자기소개서, 면접, 경험정리, gemini, opendart]
service_type: 웹앱 (Google Apps Script)
ai_used: 예 — Gemini API (참가자 본인 키)
demo: [확인 필요]
---

# Card: Career Escape

## 1. Details
- **설명**: 구직자가 휴대폰으로 희망직무와 경험을 입력하면 경험카드 1개, 자기소개서 초안 1개, 면접질문 10개를 만들어 이메일로 보내는 웹앱. 희망기업이 공시 대상이면 OpenDART 직원 현황·재무를 함께 분석한다.
- **만든 사람**: 커리어캐쳐(CareerCatcher) — 진로·취업 교육용 MVP
- **형태 / 배포**: Google Apps Script 웹앱 + Google Sheets
- **사용 AI·외부 API**: Gemini API(질문·자기소개서·면접질문 생성), OpenDART(`empSttus`, `fnlttSinglAcnt`)
- **저장소**: eunkyoungAn/career-escape (비공개)

## 2. Uses
### 의도한 사용
- 취업 교육 수업에서 QR·링크로 접속해 경험을 찾아 정리하고 자기소개서 초안 작성
- 희망기업 공시 정보를 지원동기·면접 준비에 활용
### 응용 사용
- 1:1 컨설팅 사전 과제, 면접 특강 실습 자료
### 쓰면 안 되는 경우
- 생성된 자기소개서를 검토 없이 그대로 제출
- AI가 해석한 기업 정보(직무 연관 부문 등)를 사실로 인용
- 수집 안내 없이 이름·이메일을 받는 공개 운영

## 3. Bias, Risks, and Limitations
- AI 초안은 입력한 경험의 양과 질에 크게 좌우되고, 과장된 표현이 생길 수 있다.
- 비상장·소규모 기업은 공시가 없어 채용공고 중심으로만 분석한다.
- 채용공고 URL 본문은 자동으로 수집하지 않는다(붙여넣기 권장).
- `모든 사용자` 배포라서 링크를 아는 사람은 누구나 접속할 수 있다.
- 메일은 웹앱 소유자 계정에서 발송되어 Google 일일 한도가 적용된다.
### 권고
- 초안은 강사 첨삭이나 본인 수정을 거친 뒤 사용한다.
- 운영 전에 개인정보 처리 안내와 보유기간을 고지한다.

## 4. How to Get Started
- 참가자: Gemini API 키 발급(무료) → 링크 접속 → 4단계(목표 정하기 → 경험 찾아보기 → 경험 정리하기 → 커리어 완성)
- 운영자: 시트에 Apps Script 붙여넣기 → `setupCareerEscape` 실행 → DART 키 설정 → 웹 앱 배포 (재배포는 `배포 관리`에서 새 버전)

## 5. Data
- **입력**: 이름, 이메일, 희망직무(필수), 희망기업·채용공고(선택), 경험 답변(최대 5개)
- **저장 위치**: Google Sheets — `세션`, `직무분석`, `답변`, `경험카드`, `결과물`, `면접질문`, `오류로그`
- **API 키**: Gemini 키는 참가자 브라우저(localStorage)에만 저장하고 시트·캐시·로그에는 남기지 않는다(오류 메시지 마스킹). DART 키는 Script Properties에 둔다.
- **외부 원천**: OpenDART 공시. 같은 기업은 6시간 캐시

## 6. Evaluation
- 기능 테스트: `TEST_CASES.md` 시나리오
- AI 결과 검증: DART 수치는 "공식 사실", 부문 해석은 "AI 추정(사실 아님)"으로 나눠 표시한다. AI는 DART에 실제로 있는 부문명만 쓰고, 소계 행은 빼고 집계한다.
- 기업명 매칭: `(주)`·`㈜`·`주식회사`·공백을 무시하고 상장사를 우선한다.
- 현장 적용 결과: [확인 필요 — 회차·인원·만족도]

## 7. Technical Specifications
- `Code.gs`(시트 DB, Gemini BYOK, DART, 질문 흐름, 이메일), `Index.html`(모바일 화면), `appsscript.json`
- 비용 구조: 참가자 키를 쓰므로 운영자의 Gemini 비용은 0원(관리자 키 대체 옵션은 기본으로 꺼져 있음)

## 8. Citation / Contact
- 커리어캐쳐(CareerCatcher) · dms5147@gmail.com
