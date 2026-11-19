# 카드뉴스 자동화 실습실

「AI 활용 카드뉴스 제작」 1회차(3시간, 2회 중 1회차) 수강생 실습 사이트. `job-ai-lab/`과 같은 틀이다. 첫 부분(START)은 AI 이용 현황과 오늘 쓰는 AI를 다루고, 수업 시간의 약 60%(110분)는 실습 3단계와 마무리다.

- 주소: `https://eunkyoungan.github.io/-/cardnews-lab/` (실제 배포는 `gh-pages` 브랜치. main에 합친 뒤 `cardnews-lab/` 폴더를 `gh-pages`에 올린다)
- 실습 원본: 구글 시트 「키보드 카드뉴스 운영 마스터」(시작하기, GPT 프로젝트 설정, 대시보드, 카드뉴스 관리, Gemini 자동화 설치 탭)
- 빌드·설치 없이 GitHub Pages에서 바로 동작한다. AI 실행은 시트(Gemini API), ChatGPT, Canva에서 하고 이 사이트는 순서·요청문·검수 항목을 안내한다.

## 파일 구성

| 파일 | 쓰임 |
|---|---|
| `index.html` | 화면 뼈대(첫 화면, START 장표, 단계 화면) |
| `style.css` | `job-ai-lab/style.css` 복사본 + 맨 아래 전용 스타일 |
| `app.js` | START 장표(`#start`, AI · 구조 · 역할), 단계 화면(`#s1`~`#s3`, `#review`), 메모·검수 표시 |
| `data.js` | 시간표, 열 지도, 단계별 순서·요청문·검수, 프로젝트 지침 원문, 오류 해결, 출처 |
| `fonts/` | Pretendard (job-ai-lab과 같음) |

## 내용 고치기

1. 단계 내용·요청문은 `data.js`, START 장표는 `app.js`의 `SLIDES`를 고친다.
2. `index.html`의 `?v=` 값을 바꾸고 함께 커밋한다.

## 강의 전 확인

- 시트 X열(GPT 프로젝트 요청문) 수식에 원본 시트 주소가 고정되어 있다. 사본에서도 원본을 가리키므로, 원본 수식을 고치거나 3단계 안내대로 수강생이 주소를 바꾸게 한다.
- Gemini 자동화 코드의 모델 `gemini-3.5-flash-lite`와 `thinkingLevel: 'minimal'` 설정을 무료 키로 호출할 수 있는지, 하루 한도를 Google 공식 가격·한도 페이지에서 확인한다. [확인 필요]
- 수강생 ChatGPT 요금제에서 프로젝트, Google Drive 연결, Canva 앱을 쓸 수 있는지 확인한다. 요청문의 `@Google Drive`, `@Canva` 호출 방식은 OpenAI 도움말에서 확인하지 못했다. [확인 필요]
- 대시보드의 "저장률 = 저장수 ÷ 조회수" 정의와 달리 관리 탭에는 조회수·저장수 열이 없다.
- 예시 데이터: KB-009~011 주제 중복, KB-012 "리리니어" 오타(2단계 검토 예시로 사용), KB-006·008 결과물 링크가 기본 주소.
- START 1-1, 1-2 수치는 과학기술정보통신부 「2025 인터넷이용실태조사」(2026. 3. 31. 발표)를 보도 기사로 확인했다. 강의 전 보도자료 원문으로 다시 확인한다.

## 보안

`job-ai-lab`과 같다. CSP `default-src 'none'`, 스크립트·스타일은 같은 폴더 파일만, `connect-src 'none'`. 메모와 검수 표시는 그 기기 브라우저(localStorage)에만 남는다.
