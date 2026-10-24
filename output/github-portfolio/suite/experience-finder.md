---
language: ko
license: [확인 필요]
tags: [careercatcher, 경험정리, 면접, gemini, opendart]
service_type: 웹앱 (Google Apps Script + Google Sheets)
ai_used: 예 — Gemini API (참가자 본인 키)
demo: https://script.google.com/macros/s/AKfycbwfNRBAoDQ-eDHeUTti7drgyL58p6fgm8-tv5hlf1tZfCfrHDhWztLyWEW6ZEYwoTftXA/exec
---

# Card: 기업·경험 찾기 (Career Escape)

## 1. Details
- **설명**: 경험 찾기가 어려운 구직자가 휴대폰으로 희망직무·경험을 입력하면 경험카드 1개, 자기소개서 초안 1개, 면접질문 10개를 만들어 이메일로 보내는 웹앱. 희망기업이 공시 대상이면 OpenDART 직원 현황·재무를 함께 분석한다.
- **서비스 순서**: 경험 찾기 단계(자기소개서 작성 앞단)
- **사용 AI·외부 API**: Gemini API, OpenDART
- **소스**: eunkyoungAn/career-escape (Code.gs, Index.html)

## 2. Uses
### 의도한 사용
- 경험을 말로 꺼내기 어려운 교육생이 질문에 답하며 경험을 찾는다.
- 희망기업 공시 정보를 지원동기·면접 준비에 쓴다.
### 응용 사용
- 취업 특강·1:1 컨설팅의 사전 과제
### 쓰면 안 되는 경우
- 생성된 초안을 검토 없이 제출
- AI 해석(직무 연관 부문 등)을 공식 사실로 인용
- 개인정보 안내 없이 공개 운영

## 3. Bias, Risks, and Limitations
- 첫 실행은 DART 전체 기업코드를 내려받느라 **4~5분** 걸릴 수 있다.
- 비상장·소규모 기업은 공시가 없어 채용공고 중심으로만 분석한다.
- 입력 경험이 빈약하면 초안도 평이해지고, 표현이 과장될 수 있다.
- 링크를 아는 사람은 누구나 접속할 수 있고, 메일은 소유자 계정으로 나가 Google 일일 한도가 적용된다.
### 권고
- 초안은 본인 수정이나 강사 첨삭을 거친 뒤 사용한다.

## 4. How to Get Started
1. Gemini API 키 준비 → 링크 접속
2. 목표 정하기 → 경험 찾아보기(질문 최대 5개) → 경험 정리하기 → 커리어 완성(화면·이메일)

## 5. Data
- **입력**: 이름, 이메일, 희망직무(필수), 희망기업·채용공고(선택), 경험 답변
- **저장**: Google Sheets. Gemini 키는 참가자 브라우저에만 두고 시트·캐시·로그에는 저장하지 않는다.
- **외부 원천**: OpenDART 공시(`empSttus`, `fnlttSinglAcnt`), 같은 기업 6시간 캐시

### 개인정보 보호 설계
- **API 키는 저장하지 않습니다.** 참가자 본인의 Gemini 키는 브라우저에만 두고 시트·캐시·로그에 남기지 않으며, 오류 메시지에 섞여도 `AIza…(가림)`으로 가립니다.
- **운영자가 AI 계정·비용에 접근하지 않습니다.** 참가자 키 방식이라 운영자 비용이 0원입니다.
- **필수 수집은 이름·이메일·희망직무로 한정**하고, 희망기업·채용공고는 선택입니다.
- **이 서비스는 운영자의 Google Sheets에 이름·이메일·답변을 저장합니다.** 결과 메일 발송을 위한 것입니다. 보유기간: [확인 필요 — 정해서 기재]
- 한계: 링크를 아는 사람은 누구나 접속할 수 있습니다.

## 6. Evaluation
- `TEST_CASES.md` 시나리오
- 공식 사실(DART)과 AI 해석을 나눠 표시하고, AI는 DART에 실제 있는 부문명만 쓴다.
- 현장 적용 결과: [확인 필요]

## 7. Technical Specifications
- Apps Script 웹앱, Sheets DB, Gemini BYOK 구조(운영자 AI 비용 0원)

## 8. Citation / Contact
- 커리어캐쳐(CareerCatcher) · dms5147@gmail.com
