# AI 취업지원 실습실

「AI 활용 취업지원 실무」 통합 특강 3시간용 수강생 사이트. 이론은 START 장표(변화·트렌드·역할), 실습은 구글 시트와 구글 폼으로 진행하는 취업상담 워크플로우 5단계다.

- 주소: `https://eunkyoungan.github.io/-/job-ai-lab/` (실제 배포는 `gh-pages` 브랜치. main에 합친 뒤 `job-ai-lab/` 폴더를 `tools/`, `src/`, `sheet/`만 빼고 `gh-pages`에 올린다)
- 빌드·설치 없이 GitHub Pages에서 바로 동작한다. 이 사이트는 입력을 받지 않으며, 실습은 연결된 구글 시트(상담자용)와 구글 폼(구직자용 사전 질문지)에서 한다.

## 파일 구성

| 파일 | 쓰임 |
|---|---|
| `index.html` | 화면 뼈대(첫 화면, START 장표, 취업상담 워크플로우) |
| `style.css` | `agent-lab/style.css` 복사본 + 아래쪽 전용 스타일 |
| `app.js` | START 장표(`#start`), 워크플로우 전체 과정(`#flow`)과 단계별 화면(`#flow-1`~`#flow-5`, 준비물 확인부터 시작), 질문지 만들기(`#flow-form`), 개별 실습(`#mine-studio`, `#mine-agent`: `agent-lab`의 `#studio`, `#s8` 화면을 iframe으로 그대로 표시), 바로가기 메뉴 |
| `ai-test/`, `who/` | 시작하기 전에: AI 역량검사, 나는 어떤 AI 사용자?(레벨 확인). `ai-auto-lab/`의 같은 폴더를 복사해 이 과정에 맞게 문구만 고친 것 |
| `data.js` | 화면 데이터. `tools/build.py`가 만든다 |
| `src/*.md` | 연습용 가상 채용공고와 가상 구직자 서류 원본 |
| `files/` | 수강생이 내려받는 PDF·DOCX와 전체 압축 파일. build.py가 만든다 |
| `tools/build.py` | 내용 원본. 연결 주소(`LINKS`), START 장표(`START`), 워크플로우(`FLOW`), 질문지 만들기(`FORM_MAKE`), 개별 실습 화면 주소(`MINE`). 참고 자료 목록(`SOURCES`)은 기록용이며 사이트에 싣지 않는다 |
| `sheet/FormSetup.gs` | 내 사본 시트에 연결할 구직자용 사전 질문지를 만드는 Apps Script. 사이트 1단계의 "내가 쓸 사전 질문지 미리 만들기"에 그대로 실린다 |
| `sheet/Code.gs` | 이전 시안(구인기업·직무 분석 전용 시트)의 Apps Script. 현재 사이트가 연결하는 최종본 시트의 코드는 그 시트 안에 있다 |

## 내용 고치기

1. 시트나 질문지 주소가 바뀌면 `tools/build.py`의 `SHEET_ID`, `LINKS`를 고친다.
2. 워크플로우 단계 설명은 `FLOW`, 장표는 `START`, 가상 사례는 `src/`를 고친다.
3. `python3 job-ai-lab/tools/build.py` 실행(python-docx, LibreOffice 필요).
4. `index.html`의 `?v=` 값을 바꾸고 함께 커밋한다.

## 강의 전 확인

- 상담자용 시트의 공유 범위. 링크가 있는 누구나 볼 수 있는 상태라면 구직자 정보 탭에 실제 정보가 없는지 확인한다.
- 사본을 만든 계정에서 실행 단추가 동작하는지(권한 승인, Gemini API 키 유무).
- START 장표의 통계와 제도 일정(`[확인 필요]` 표시)을 공식 자료에서 다시 확인한다.

## 보안

CSP `default-src 'none'`, 스크립트·스타일은 같은 폴더 파일만, `connect-src 'none'`. 이 사이트는 아무것도 저장하거나 보내지 않는다. `files/`의 자료는 모두 가상 자료다.
