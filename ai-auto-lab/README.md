# AI 업무 자동화 실습실

메일 자동화(`mail-lab/`)와 카드뉴스 만들기(`cardnews-lab/`)를 한 사이트로 합친 수강생 실습 사이트. 공통 START(AI · 자동화 · 카드뉴스 · 안전) 다음에 실습 1(메일 자동화 4단계 + 발송 전 체크)과 실습 2(카드뉴스 3단계 + 기록)가 이어진다.

- 주소: `https://eunkyoungan.github.io/-/ai-auto-lab/` (실제 배포는 `gh-pages` 브랜치. main에 합친 뒤 `ai-auto-lab/` 폴더를 `gh-pages`에 올린다)
- 시간: 10:00~13:00, 3시간(개념 52분, 실습 108분 = 60%, 휴식 20분). [가정] 실제 수업 시간이 다르면 `data.js`의 `timeline`과 각 단계 `time`을 고친다.
- 첫 시작: `who/`(나는 어떤 AI 사용자? 맞춰 보기 5문제 + 나는? 4문제, `ai-practice`의 AI 역량검사와 같은 레이아웃), `ai-test/`(AI 역량검사, gh-pages의 `ai-practice/index.html`을 가져온 사본). 두 페이지는 글꼴을 Google Fonts에서 불러오는 독립 페이지다.
- 체크리스트 주소: `#check` (START 전 "AI 사용 전, 나는 어떤 사용자?", 출처: 장현민(팀제이커브) 인터뷰의 AI 활용 3레벨, Lilys 요약 노트 https://lilys.ai/digest/12201909/16136708)
- 첫 화면은 과정 소개이고, 순서는 소개 → 시작하기 전에(`#before`: 점검, START 장표, 준비) → G-mail 자동화(`#mail`) → 카드뉴스 자동화(`#card`)다.
- 단계 주소: G-mail 자동화 `#m1`~`#m4`, 마무리 `#mr` / 실습 2 `#c1`~`#c3`, 마무리 `#cr` / START `#start`

## 파일 구성

| 파일 | 쓰임 |
|---|---|
| `index.html` | 화면 뼈대(첫 화면, START 장표, 단계 화면) |
| `style.css` | `mail-lab/style.css` 복사본 + 맨 아래 전용 스타일 |
| `app.js` | START 장표 14장, 실습 순서(m1→m4→mr→c1→c3→cr), 메모·검수 표시 |
| `data.js` | `mail-lab/data.js`와 `cardnews-lab/data.js`를 합친 데이터(parts 2개) |
| `code.js`, `files/mail-automation.gs` | 메일 자동화 참고 코드 (`mail-lab`과 같음) |

## 내용 고치기

- 단계 내용·요청문은 `data.js`의 `parts[0]`(메일), `parts[1]`(카드뉴스), START 장표는 `app.js`의 `SLIDES`를 고친다.
- `index.html`의 `?v=` 값을 바꾸고 함께 커밋한다.
- `mail-lab/`, `cardnews-lab/`은 따로 남아 있다. 한쪽만 고치면 내용이 달라지므로 앞으로는 이 폴더를 기준으로 고친다.

## 강의 전 확인

`mail-lab/README.md`, `cardnews-lab/README.md`의 "강의 전 확인"과 같다. 핵심만:
- 메일: 강사 계정으로 실제 발송 확인, 권한 승인 화면 캡처, 원본 PPT 15번의 실제 이메일 주소 가리기
- 카드뉴스: 원본 시트 X열 요청문 주소 수정, Gemini 모델명과 ChatGPT Drive·Canva 연결 사전 실행 [확인 필요]
- START 통계는 과학기술정보통신부 보도자료 원문으로 재확인 [확인 필요]
