---
language: ko
license: All Rights Reserved — 별도 허락 없이 사용 불가
tags: [careercatcher, 포트폴리오, 노션, gemini]
service_type: 웹앱 (GitHub Pages 정적 사이트)
ai_used: 예 — Gemini API (선택, 키 없이 프롬프트 복사도 가능)
demo: https://eunkyoungan.github.io/-/portfolio-builder/
---

# Card: AI 활용 포트폴리오 작성 (포트폴리오 빌더)

## 1. Details
- **설명**: 퍼플커리어 노션 포트폴리오 양식(Contact · About me · Skills · AI 역량 · Projects · Experiences · Education)에 맞춰, 입력하면 AI가 직무 역량이 드러나는 포트폴리오를 만들어 주는 무료 웹 도구
- **구성**: 빌더(`index.html`), 그림 매뉴얼(`guide/`), 완성 예시(`sample/`)
- **소스**: eunkyoungAn/- 저장소 `portfolio-builder/`

## 2. Uses
### 의도한 사용
- 직무 역량이 드러나는 취업용 포트폴리오 초안 만들기(HTML 저장)
### 응용 사용
- 노션 포트폴리오 특강 실습
### 쓰면 안 되는 경우
- 하지 않은 프로젝트·성과를 AI로 채워 넣기

## 3. Bias, Risks, and Limitations
- AI가 입력 내용을 그럴듯하게 다듬는 과정에서 성과가 부풀려질 수 있다.
- API 키가 없으면 프롬프트를 복사해 ChatGPT·Claude에 직접 붙여넣어야 한다.
### 권고
- 수치·성과는 본인 기록과 대조한 뒤 쓴다.

## 4. How to Get Started
1. (선택) 무료 Gemini 키 발급 → 빌더 맨 위 "AI 자동 완성 켜기"에 붙여넣기
2. 내용 입력 → [포트폴리오 완성하기] → [HTML 저장]

## 5. Data
- 입력 내용은 서버에 저장하지 않고 브라우저에만 임시 저장한다.
- 이메일·연락처는 AI에 보내지 않는다. API 키는 저장하지 않는다.

### 개인정보 보호 설계
- **운영자는 입력 내용을 보유하지 않습니다.** 서버로 보내 저장하지 않고 사용자 브라우저에만 임시 저장합니다.
- **이메일·연락처는 AI에 보내지 않습니다.**
- **API 키는 저장하지 않습니다.** 키 없이 프롬프트를 복사해 쓰는 방법도 제공합니다.
- 한계: 선택한 AI(Gemini 등)로 보내는 내용은 해당 서비스의 정책을 따릅니다.

## 6. Evaluation
- 완성 예시: `sample/`
- 현장 적용 결과: [확인 필요]

## 7. Technical Specifications
- 단일 페이지 정적 웹, Gemini API 호출(선택)

## 8. Citation / Contact
- © career catcher · purple-career · dms5147@gmail.com
