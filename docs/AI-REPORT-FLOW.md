# AI 유튜브 이슈 리포트 플로우

지정 유튜브 채널의 AI(Claude·ChatGPT 등) 신규 영상을 수집·요약해 **정보성 포스터**로 슬랙 `#ai-youtube-report` 에 보낸다.
스킬: `.claude/skills/ai-youtube-report/SKILL.md` · 설정: `ai-report/sources.md`, `ai-report/keywords.md`

```
[일간 루틴] 평일 아침 (KST 7시대, 분은 지터)
  채널 /videos 페이지(+WebSearch) 수집 → 중복 제거(state/youtube_seen.json) → 분류·TOP5 → 요약·교차확인
  → poster.html → Playwright → poster.png → 슬랙 업로드 + 텍스트 → 커밋·PR·병합
[주간 루틴] 금요일 오후
  일간 리포트 7일치 종합 → 포스터 2~3장 → 슬랙 + 블로그 주제 후보 3개(blog-ideas.md)
        ↓ 사용자가 골라 #blog-bot 에 올리면
  기존 blog-post 플로우(docs/FLOW.md)가 이어받음
```

## 단계 (Phase)
| 단계 | 내용 | 상태 |
|---|---|---|
| 0 준비 | 슬랙 채널 생성(C0CFT3QPYM7), 환경 허용 호스트(www.youtube.com), 채널 ID 검증(8곳) | 완료 |
| 1 MVP | 일간 수동 1회 드라이런, 포스터 검수, 슬랙 시험 게시 | 대기 |
| 2 일간 루틴 | 루틴 등록, 며칠 운영하며 키워드·채널 튜닝 | 대기 |
| 3 주간 | 주간 포스터 + 블로그 후보 연결, 루틴 등록 | 대기 |
| 4 API 확장 | YouTube Data API(조회수·검색·쇼츠 제외). 키는 `request_credential`로만 등록(파일·env에 저장 금지) | 대기 |

## 알려진 제약
- 기본 환경은 `youtube.com` 을 차단(403)한다. 환경 `eunkyoungan-blog-ai-report` 에 `www.youtube.com` 을 허용해 두었다. **루틴도 이 환경에서 돌려야 한다.**
- 이 환경(데이터센터 IP)에서 YouTube는 RSS(`/feeds/videos.xml`)에 404를 주고, 영상 페이지(`/watch`)는 구글 봇 확인 페이지로 보낸다(2026-11-07 확인). 봇 확인은 우회하지 않는다.
- 그래서 1단계는 채널 `/videos` 페이지만 읽는다(`ai-report/tools/fetch_channel.py`). 제목·조회수·상대시간만 얻을 수 있다. 정확한 게시일·설명은 Phase 4(YouTube Data API)에서 보강한다.
- 수집기가 실패하면 WebSearch 로 폴백한다(라벨 `검색요약`).
- 썸네일은 저작권상 포스터에 넣지 않는다.

## 폴더
```
ai-report/daily/YYYY-MM-DD/   report.md, poster.html, poster.png, meta.md
ai-report/weekly/YYYY-Www/    report.md, poster-N.png, meta.md, blog-ideas.md
state/youtube_seen.json       이미 보낸 videoId
templates/ai-report-poster.html
```
