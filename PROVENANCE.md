# 원본 및 변경 내역

- 기준 사이트: https://kaleidoscopic-stardust-5d149f.netlify.app/
- 사이트 제목: 커리어캐쳐 | 나의 경험으로 쓰는 자기소개서
- 관련 채팅: 2026-09-09 「자동화 시트 웹페이지로 만들기」
- 관련 자료: 당시 만든 커리어캐쳐_무료배포용 파일, 단일 HTML, React/TypeScript 소스.
- 원래 목적: 자동화 시트를 웹페이지로 전환하고 사용자가 자신의 Gemini API 키로 실행.
- 확인: 사이트의 JavaScript, CSS, manifest, service worker, 아이콘 2개의 SHA-256이 로컬 배포본과 모두 일치. HTML 내용도 일치.
- GitHub Pages 대응: HTML 자산 경로 및 service worker 등록 경로를 상대경로로 수정. manifest 시작 주소·범위·아이콘도 상대경로로 수정. service worker 자산 경로 및 캐시를 저장소별 범위로 분리.
- 화면, 입력 항목, AI 프롬프트와 생성 로직은 원본을 유지.
- 채팅 전체와 개인 작업 데이터, 인증정보는 패키지에 포함하지 않음.
- 원본 시트는 관련 채팅에서 링크를 확인했으나 이번 작업에서 시트 내용을 다시 읽거나 포함하지 않음.

## 변경 전 원본 파일의 SHA-256

- `app.js`: `dfdb1731adc6f2d92bc7c1c612eedab8c7e4582af418729d9836c2bfc33d4cfc`
- `app.css`: `bfadf7f98a6e83158fb680f4a13b4a56f09816ce07e4119ba77d2bb7a9abaac2`
- `manifest.webmanifest`: `7ce2a228d5163f4aa6229f1c79c87b6fad0fbacb0af83adf571a7b02b068e5ef`
- `sw.js`: `6c523c709f5e9db0fc564d6b0843e1392a2ba83ced34521ae85315ccdad9833f`
- `icon-192.png`: `4001211d9783c61b79d1effeccc852b803922a23f338283ed656eed41797c51c`
- `icon-512.png`: `b4ca8911325b4720b768f34c0caee234862e753188114c5f0d066f2fe6eca541`
