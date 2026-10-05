# 블로그 자동화 저장소 (자녀코칭)

슬랙으로 주제·자료를 인터뷰 → 블로그 글 생성 → 붙여넣기용 md 저장.
전체 흐름은 `docs/FLOW.md`, 글 작성 규칙은 `.claude/skills/blog-post/SKILL.md`.

## 규칙
- 글 1편 = `posts/YYYY-MM-DD-<slug>/` 폴더 하나 (`post.md`, `meta.md`, `images/`).
- 글 양식은 `templates/post.md`를 따른다.
- 진행 상태는 `meta.md`의 `status`로 관리: asked → answered → drafted → published.
- 슬랙 채널: `#blog-bot` (변경 시 여기 수정).
- 아이 실명·학교·얼굴 사진 등 개인정보는 글에 넣지 않는다. 사진은 얼굴 노출 여부를 확인 질문한다.
- 작업 후 커밋·푸시하고, 슬랙 스레드에 결과 링크를 남긴다.
