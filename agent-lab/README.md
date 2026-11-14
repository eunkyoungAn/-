# 업무 에이전트 실습실

「업무 에이전트 설계와 실습」 수강생용 안내 사이트. 실습 순서, 스튜디오에 넣을 값, 자료 파일, 복사해서 쓰는 지시문, 결과 검수표를 한 곳에 모았다.

- 주소: `https://eunkyoungan.github.io/-/agent-lab/` (실제 배포는 `gh-pages` 브랜치. main에 합친 뒤 `agent-lab/` 폴더를 `tools/`만 빼고 `gh-pages`에 그대로 올려야 반영된다)
- 빌드·설치 없이 GitHub Pages에서 바로 동작한다.
- 에이전트 실행은 이 사이트가 아니라 업무 에이전트 스튜디오(claude.ai 아티팩트) 또는 Claude 채팅에서 한다. 이 사이트는 거기에 넣을 것을 복사·내려받게 해 준다.

## 파일 구성

| 파일 | 쓰임 |
|---|---|
| `index.html` | 화면 뼈대. 첫 화면(실습 카드, 자료 받기, 공통 규칙, 오류 사유)과 실습 화면. `#studio`는 내 스튜디오 만들기, `#project`는 프로젝트로 진행하기 화면 |
| `style.css` | 스타일 (밝은 단일 테마: 흰 바탕, 검은 단추, 파란 강조) |
| `fonts/` | Pretendard 글꼴(SIL OFL 1.1, 필요한 글자 범위만 나눠 받는 파일 92개). 외부 CDN 대신 같은 폴더에서 불러온다 |
| `app.js` | 화면 전환(`#s1` ~ `#s8`), 복사 단추, 검수 표시 |
| `config.js` | 스튜디오·연습실·새 채팅 링크. 링크가 바뀌면 이 파일만 고친다 |
| `data.js` | 실습 내용(넣을 값, 순서, 검수 항목, 지시문, 양식). `tools/build_data.py`가 만든다 |
| `files/` | 수강생이 내려받는 자료. 전체 압축 파일과 실습별 파일 |
| `tools/build_data.py` | `files/`의 프롬프트·양식에서 `data.js`를 다시 만든다 |

## 내용 고치기

1. 자료 파일이나 지시문을 바꾸려면 `files/` 안의 파일을 바꾼다. 전체 압축 파일(`files/업무에이전트_수강생실습자료.zip`)도 같은 내용으로 다시 묶어 넣는다.
2. 넣을 값, 실행 순서, 검수 항목은 `tools/build_data.py`의 `LESSONS`에서, Claude 채팅용 첨부 파일 확인은 `ATTACH`에서, 스튜디오 만들기는 `GUIDE`에서, 프로젝트로 진행하기는 `PROJECT`에서, 오류 사유는 `ERRORS`에서 고친다.
3. `python3 agent-lab/tools/build_data.py`를 실행해 `data.js`를 다시 만들고 함께 커밋한다(openpyxl 필요).

## 보안

- CSP 메타: `default-src 'none'`, 스크립트·스타일은 같은 폴더 파일만(`'self'`), `connect-src 'none'`. 외부 글꼴·분석 도구·CDN을 쓰지 않으며, 화면에서 바깥으로 보내는 요청이 없다.
- `referrer`는 `no-referrer`, 바깥 링크는 `rel="noopener noreferrer"`. `config.js`의 주소는 `https://claude.ai/`로 시작할 때만 쓴다.
- 입력 칸이 없다. 저장하는 것은 검수 체크 상태뿐이며 그 기기 브라우저(localStorage)에만 남는다.
- API 키, 계정 정보는 어디에도 넣지 않는다.
- `files/`의 자료는 모두 교육·실습용 가상 자료다. 참여자 명단의 이름·연락처도 가상이다. 실제 자료는 이 폴더에 올리지 않는다.
- 검색에 걸리지 않도록 `robots: noindex`를 넣었다. 주소를 아는 사람은 누구나 열 수 있으므로 공개해도 되는 내용만 둔다.
