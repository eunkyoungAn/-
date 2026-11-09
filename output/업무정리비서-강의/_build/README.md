# 교안 다시 만들기

- `build.js`: 슬라이드 24장 생성 (발표 스크립트는 `../01_구성안.md` 표에서 자동으로 노트에 넣음)
- `kit.js`: 앱 화면 스타일 부품(카드, 단계 칩, 채팅 화면, 화면 경로 표시)과 색·글꼴
- 필요: `npm install pptxgenjs react-icons react react-dom sharp`, pptx 스킬의 `apply_theme.js`
- 실행: `NODE_PATH=./node_modules node build.js 나만의_업무정리비서_만들기.pptx`

디자인 기준: 흰 바탕, 큰 굵은 제목, 둥근 카드, 포인트 색 하나(3D5AFE), 맑은 고딕. 캐릭터 없이 전문적인 톤(구조도·원칙 카드·큰 숫자)으로 구성.
앱 서비스 화면 느낌을 참고했지만 특정 회사의 로고·고유 색·화면은 쓰지 않았다.
`미리보기.pdf`는 맑은 고딕이 없는 환경에서 변환한 것이라 글꼴이 실제와 다르다. PowerPoint에서 열면 맑은 고딕으로 보인다.
