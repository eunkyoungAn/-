# AI 취업지원 실습실

「AI 활용 취업지원 실무 3종」(구인기업·직무 분석 → 구직역량·직무 적합도 진단 → 취업전략 설계·지원) 통합 특강 3시간용 수강생 실습 사이트. `agent-lab/`과 같은 틀이며 사용하는 AI만 다르다(Gemini 무료 수준 기본, ChatGPT 대체).

- 주소: `https://eunkyoungan.github.io/-/job-ai-lab/` (실제 배포는 `gh-pages` 브랜치. main에 합친 뒤 `job-ai-lab/` 폴더를 `tools/`, `src/`만 빼고 `gh-pages`에 올린다)
- 설계 근거: AI 활용 취업지원 강의설계서(2026-11-19)
- 빌드·설치 없이 GitHub Pages에서 바로 동작한다. AI 실행은 이 사이트가 아니라 Gemini·ChatGPT에서 하고, 사이트는 요청문을 만들어 주고 결과 표를 받아 다음 단계로 넘긴다.

## 파일 구성

| 파일 | 쓰임 |
|---|---|
| `index.html` | 화면 뼈대(첫 화면, 먼저 알기, 단계 화면) |
| `style.css` | `agent-lab/style.css` 복사본 + 맨 아래 전용 스타일 |
| `app.js` | START 장표(`#start`), 바로가기 메뉴, 화면 전환(`#basics`, `#s1`~`#s3`, `#review`), 내담자 유형, 표 3종, AI 표 붙여 넣기, 검수 표시 |
| `data.js` | 실습 데이터. `tools/build.py`가 만든다 |
| `src/*.md` | 가상 채용공고와 내담자 서류 원본. 04, 05는 build.py가 만든다 |
| `files/` | 수강생이 내려받는 PDF·DOCX, 스킬 zip, 전체 압축 파일. build.py가 만든다 |
| `tools/build.py` | 내용 원본. START 장표(`START`: 변화·트렌드·역할의 수치·인용·출처), 직업공통능력 목록, 가상 응답, 요청문, 검수 항목, 예시 답안, 지원 제도 |

## 내용 고치기

1. 공고·서류는 `src/01~03`을, 그 밖의 내용은 `tools/build.py`를 고친다.
2. `python3 job-ai-lab/tools/build.py` 실행(python-docx, LibreOffice 필요).
3. `index.html`의 `?v=` 값을 바꾸고 함께 커밋한다.

## 강의 전 확인

- 지원 제도의 금액·요건(`SUPPORTS`)과 `[확인 필요]` 항목을 공식 페이지에서 다시 확인한다.
- 강사 계정으로 Gemini 무료 수준에서 세 단계를 끝까지 실행해 한도에 걸리는 지점을 확인한다.
- 직업공통능력 "판정 단서"는 커리어캐쳐 요약이다. 표준 원문의 수행기준·평가준거로 바꾸려면 `COMPETENCIES`의 세 번째 값을 고친다.

## 보안

`agent-lab`과 같다. CSP `default-src 'none'`, 스크립트·스타일은 같은 폴더 파일만, `connect-src 'none'`. 입력한 표와 검수 표시는 그 기기 브라우저(localStorage)에만 남는다. `files/`의 자료는 모두 가상 자료다.
