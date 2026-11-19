# 메일 자동화 실습실

「AI기반 스마트 문서작성 실무」 3회차(Gemini 업무에 활용하기 1: 업무 메일 작성, 업무관리) 중 **Gemini + Apps Script 이메일 자동화** 부분의 수강생 실습 사이트. `cardnews-lab/`, `job-ai-lab/`과 같은 틀이다. START는 AI 이용 현황과 자동화 개념, 실습은 약 60%(60분 중 36분)다.

- 주소: `https://eunkyoungan.github.io/-/mail-lab/` (실제 배포는 `gh-pages` 브랜치. main에 합친 뒤 `mail-lab/` 폴더를 `gh-pages`에 올린다)
- 내용 원본: 3회차 PPT 14~16번(이메일 자동화: 드라이브에서 시트 만들기 → 이메일 주소·받는 사람 이름 입력 → 확장 프로그램 → Apps Script → 코드 붙여넣기·저장), 17번(발송 전 확인 할 것). PPT에 없던 단계(Gemini 코드 요청문, 권한 승인, 시트 메뉴로 실행, 테스트 → 전체 발송, C열 발송 결과)를 보완했다.

## 파일 구성

| 파일 | 쓰임 |
|---|---|
| `index.html` | 화면 뼈대(첫 화면, START 장표, 단계 화면) |
| `style.css` | `cardnews-lab/style.css` 복사본(+ `job-ai-lab` 원본) + 맨 아래 전용 스타일 |
| `app.js` | START 장표(AI · 자동화 · 안전), 단계 화면(`#s1`~`#s4`, `#review`), 메모·검수 표시 |
| `data.js` | 시간표, 시트 구성, 단계별 순서·요청문·검수, 발송 전 체크(PPT 17번), 오류 해결, 출처 |
| `files/mail-automation.gs` | 참고 코드(강사 백업). 2단계 요청문과 같은 메뉴·기능 |
| `code.js` | 참고 코드를 화면에 보여 주기 위한 사본. CSP가 `connect-src 'none'`이라 파일을 읽지 못해 스크립트로 넣는다 |

## 내용 고치기

1. 단계 내용·요청문은 `data.js`, START 장표는 `app.js`의 `SLIDES`를 고친다.
2. 참고 코드를 고치면 `code.js`를 다시 만든다:
   `python3 -c "import json;c=open('mail-lab/files/mail-automation.gs',encoding='utf-8').read();open('mail-lab/code.js','w',encoding='utf-8').write('window.MAIL_CODE = '+json.dumps(c,ensure_ascii=False)+';\n')"`
3. `index.html`의 `?v=` 값을 바꾸고 함께 커밋한다.

## 강의 전 확인

- 참고 코드는 문법 검사만 했다. 강사 계정으로 테스트 발송·전체 발송을 한 번 실행한다.
- 권한 승인 화면의 버튼 이름("확인되지 않은 앱", [고급], [이동], [허용])은 계정·시점에 따라 다를 수 있다. 실제 화면을 캡처해 두면 좋다. [확인 필요]
- 발송 한도(개인 100명/일, Workspace 1,500명/일)는 Google Apps Script Quotas 페이지 기준이며 바뀔 수 있다.
- START 1-1, 1-2 수치는 과학기술정보통신부 「2025 인터넷이용실태조사」(2026. 3. 31. 발표)를 보도 기사로 확인했다. 보도자료 원문으로 다시 확인한다.
- 원본 PPT 15번 캡처에 실제 이메일 주소가 보인다. 수강생 배포 전 가린다.
