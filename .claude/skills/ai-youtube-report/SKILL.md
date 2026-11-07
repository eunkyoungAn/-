---
name: ai-youtube-report
description: 지정 유튜브 채널의 AI(Claude, ChatGPT 등) 최신 영상 이슈를 수집·요약해 정보성 포스터(PNG)로 만들고 슬랙 #ai-youtube-report 로 보낸다. 일간 요약·주간 심층 리포트. "AI 유튜브 리포트", "/ai-youtube-report", 일간·주간 루틴 실행 시 사용.
---

# AI 유튜브 이슈 리포트

## 원칙 (꼭 지킨다)
- 영상 **제목과 공식 출처에서 확인된 내용만** 요약한다. 없는 숫자·기능·출시일·가격을 지어내지 않는다.
- 릴리스·가격·기능 같은 사실 주장은 가능하면 **공식 블로그/문서로 교차확인**(`office-researcher`)한다.
- 항목마다 확인 수준 라벨을 붙인다: `공식 확인` / `제목 기준` / `검색요약` (Phase 4 API 도입 후 `설명 확인` 추가).
- 모든 항목에 원본 영상 링크·채널명·게시일을 넣는다. 영상 내용을 길게 인용하지 않고 요약만 한다.
- 썸네일 이미지는 포스터에 넣지 않는다(저작권). 링크만 건다.
- 수집이 막히면(네트워크 403 등) 지어내지 말고 WebSearch로 폴백하고 라벨을 `검색요약`으로 한다. 그것도 안 되면 슬랙에 사유만 남기고 종료한다.
- 브랜드·문체 기준은 `careercatcher-skill-os`. 개인정보·내부정보는 넣지 않는다.

## 1. 입력 수집 (일간)
- `ai-report/sources.md` 의 채널마다 `python3 -I ai-report/tools/fetch_channel.py <핸들> 10` 을 실행한다.
  - 이 환경에서는 RSS가 404, 영상 페이지(/watch)는 구글 봇 확인으로 막힌다. **봇 확인을 우회하지 않는다.**
  - 그래서 얻는 정보는 제목·조회수·상대시간(`age`: "5시간 전", "1일 전")뿐이다. 설명·자막은 없다.
- `age` 가 "분 전/시간 전/1일 전"인 영상만 최근 24시간으로 본다(월요일은 "3일 전"까지).
- 영상 내용 보충은 WebSearch(영상 제목·관련 공식 발표)로 한다. 라벨은 `제목 기준` 또는 `검색요약`.
- `state/youtube_seen.json` 의 `seen` 에 있는 videoId 는 제외한다.
- `ai-report/keywords.md` 로 분류(Claude / 경쟁 모델 / 도구·팁)하고 제외 규칙을 적용한다.
- 수집기가 실패하면(구조 변경·차단) 지어내지 말고 WebSearch 만으로 진행하고 meta.md `notes` 에 사유를 적는다.

## 2. 선정·요약
- TOP 5 선정: 공식 채널 > 발표·릴리스 > 데모·실습 > 의견. 분류가 한쪽으로 쏠리지 않게 한다.
- 영상당: 한 줄 요지(40자 내외) + 보충 1~2줄 + 확인 라벨.
- "오늘의 한 줄 인사이트" 1개: 커리어캐쳐 관점(취업·진로·AI 활용)으로 연결 가능한 시사점. 근거 없는 단정 금지.
- 영상이 5개 미만이면 억지로 채우지 않는다. 0개면 "오늘은 새 소식 없음" 한 줄만 슬랙에 보낸다.

## 3. 포스터
- 양식: `templates/ai-report-poster.html` 를 복사해 `ai-report/daily/YYYY-MM-DD/poster.html` 로 저장하고 내용을 채운다.
- 1080×1350, Pretendard, 분류별 색 고정, 카드당 3줄 이내.
- Playwright(사전 설치, `require('playwright')`) 로 `poster.png` 캡처(deviceScaleFactor 2). 캡처 후 이미지를 열어 글자 잘림·가독성을 확인한다.

## 4. 저장
- 폴더: `ai-report/daily/YYYY-MM-DD/` (`report.md`, `poster.html`, `poster.png`, `meta.md`)
- `report.md`: 슬랙 텍스트 폴백과 동일한 TOP 5(링크 포함).
- `meta.md`:
```
status: drafted        # drafted → sent
type: daily            # daily | weekly
collected_via: page    # page | websearch | api
slack_thread: <링크>
videos: <videoId 목록>
notes: <수집 실패·미확인 사항>
```
- 보낸 videoId 를 `state/youtube_seen.json` 에 추가한다.

## 5. 전달
- 슬랙 `#ai-youtube-report`: `slack_get_file_upload_url` → 업로드 → `slack_complete_file_upload` 로 poster.png 게시, 같은 스레드에 report.md 텍스트(링크 포함).
- 채널에 처음 게시하기 전에 채널 설명을 확인한다.
- 커밋·푸시 후 PR 생성·main 병합(저장소 CLAUDE.md 규칙).

## 6. 주간 심층 리포트 (금요일)
- 입력: 그 주 `ai-report/daily/*/report.md` + 신규 수집.
- 구성: ① 이번 주 3대 이슈 ② 모델·도구별 변화 비교표 ③ 영상 TOP 10 ④ 활용 팁 ⑤ 다음 주 주목.
- 포스터 2~3장(`ai-report/weekly/YYYY-Www/poster-1.png` …).
- **블로그 주제 후보 3개**(취업·진로·AI 활용 연결)를 `blog-ideas.md` 와 슬랙 스레드에 제안한다. `#blog-bot` 에는 자동으로 올리지 않는다(사용자가 골라 올리면 `blog-post` 플로우가 이어받음).
- 마지막에 `office-reviewer` 로 사실 오류·누락을 검수한다.
