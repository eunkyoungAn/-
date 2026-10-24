---
language: ko
license: [확인 필요]
tags: [careercatcher, 자기소개서, 기업분석, gemini]
service_type: 웹앱 (정적 사이트, React/TypeScript 소스)
ai_used: 예 — Gemini API (사용자 본인 키)
demo: https://kaleidoscopic-stardust-5d149f.netlify.app/
---

# Card: AI 활용 자기소개서 작성

## 1. Details
- **설명**: Gemini API로 기업 분석과 경험 기반 자기소개서 초안을 만드는 웹앱. 기업 리스트와 경험 노트를 입력하고 생성할 항목을 고른다.
- **서비스 순서**: 기업·경험을 정리한 뒤 자기소개서를 완성하는 단계
- **배포**: Netlify(위 주소), GitHub Pages용 파일은 eunkyoungAn/- 저장소 루트
- **소스**: `source/` (React/TypeScript, 프롬프트, 자동화 테스트)

## 2. Uses
### 의도한 사용
- 경험 노트를 바탕으로 지원 기업별 자기소개서 초안 작성
### 응용 사용
- 자기소개서 작성 특강 실습, 첨삭 전 초안 만들기
### 쓰면 안 되는 경우
- 없는 경험을 지어내거나 초안을 검토 없이 제출
- AI가 만든 기업 설명을 공식 정보로 인용

## 3. Bias, Risks, and Limitations
- 인터넷 연결과 유효한 본인 API 키가 필요하다.
- 기업 분석은 AI가 만든 내용이라 최신 사실과 다를 수 있다.
- 작업은 '작업 저장' 파일로 옮기며, 기기 간 자동 동기화는 없다.
### 권고
- 기업 정보는 공식 채용공고·홈페이지로 확인하고, 경험 내용은 사실만 쓴다.

## 4. How to Get Started
1. 본인 Gemini API 키 입력(또는 키 없이 입력 화면부터 열기)
2. 기업 리스트·경험 노트 입력 → 생성 항목 선택 → 모델 선택(목록 확인 또는 직접 입력)
3. 결과 확인 후 '작업 저장'

## 5. Data
- **입력**: 기업 리스트, 경험 노트
- **키 처리**: 접속 중 메모리에서만 쓰고 작업 저장 파일에 넣지 않는다.
- **서버 저장 여부**: [확인 필요]

## 6. Evaluation
- 기존 자동화 테스트 포함(`source/`). 결과: [확인 필요]
- 원본 확인·변경 내역: `PROVENANCE.md` (2026-10-06 정리)

## 7. Technical Specifications
- 빌드된 `index.html`·`app.js`·`app.css`, PWA(`manifest.webmanifest`, `sw.js`)

## 8. Citation / Contact
- 커리어캐쳐(CareerCatcher) · dms5147@gmail.com
