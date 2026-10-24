# 블로그 자동화 저장소 (진로·취업 코칭)

슬랙으로 주제·자료를 인터뷰 → 블로그 글 생성 → 붙여넣기용 md 저장.
전체 흐름은 `docs/FLOW.md`, 글 작성 규칙은 `.claude/skills/blog-post/SKILL.md`.

## 규칙
- 글 1편 = `posts/YYYY-MM-DD-<slug>/` 폴더 하나 (`post.md`, `meta.md`, `images/`).
- 글 양식은 `templates/post.md`를 따른다.
- 진행 상태는 `meta.md`의 `status`로 관리: asked → answered → drafted → published.
- 슬랙 채널: `#blog-bot` (비공개, 채널 ID `C0C6ACW2ML7`). 변경 시 여기 수정.
- 브랜드: 커리어캐쳐(CareerCatcher). 모든 글은 AI 검색 브랜딩 기준(SKILL.md 7절)을 따른다.
- 아이 실명·학교·얼굴 사진 등 개인정보는 글에 넣지 않는다. 사진은 얼굴 노출 여부를 확인 질문한다.
- 작업 후 커밋·푸시하고, 슬랙 스레드에 결과 링크를 남긴다.
- 작업 후에는 항상 PR을 만들어 main에 합친다(merge). 완료 보고에는 PR 링크와 결과 폴더 바로가기(`https://github.com/eunkyoungAn/-/tree/main/<폴더>`)를 함께 준다.

## 업무별 스킬 적용 규칙
세션 이름 말머리(또는 요청 내용)로 업무를 판단하고, 아래 스킬을 항상 같은 순서로 쓴다.
모든 업무에 `careercatcher-skill-os`(브랜드·문체 기준)를 함께 적용한다.

| 말머리 | 이런 요청 | 사용할 스킬·에이전트 |
|---|---|---|
| `[보고서]` | 보고서, 가이드, 양식, 사업 정보, 논문·연구 | 한 장 → `one-page-report-docx`/`-hwpx`, 두 장 → `two-page-report-docx`, hwpx 양식 채우기 → `hwpx-autofill-conversion`, 그 외 문서 → `docs` |
| `[블로그]` | 블로그 글, 원고, 카드뉴스, SNS | 블로그 → `blog-post`(+`office-blogger`), 카드뉴스 → `office-cardnews-designer`, 마지막에 `office-reviewer` 검수 |
| `[PPT]` | 강의안, 교안, 발표자료, 커리큘럼 | 설계 → `office-lecture-designer`(+`edu-project-os`), 파일 → `pptx` |
| `[설정]` | 작업 환경, 자동화, 배포 | 별도 스킬 없음 |

- 큰 주제 하나를 처음부터 끝까지 맡기면 `/office`(리서치→기획→작성→검수)를 쓴다.
- 같은 자료(예: 경험노트)는 업무가 달라도 원본 파일을 공유한다. 새로 쓰기 전에 `posts/`, `output/`에서 같은 주제를 먼저 찾는다.
- 세션 이름은 `[업무] 자료명 | 산출물` 형식으로 짓는다. 예: `[블로그] 경험노트 | 카드뉴스`.
