# 모니터링 채널 목록

> 채널 ID(`UC…`)는 **추측하지 않는다.** Phase 0에서 채널 페이지/RSS로 실제 확인한 뒤 채운다.
> 확인 전 항목은 `id: (미확인)` 으로 두고, 일간 수집에서 건너뛴다. 사용자가 자유롭게 추가·삭제한다.
> RSS 주소: `https://www.youtube.com/feeds/videos.xml?channel_id=<id>`

| 분류 | 채널 | id | 언어 | 비고 |
|---|---|---|---|---|
| 공식 | Anthropic | (미확인) | en | Claude 공식 발표·데모 |
| 공식 | OpenAI | (미확인) | en | ChatGPT·모델 발표 |
| 공식 | Google DeepMind | (미확인) | en | Gemini |
| 공식 | Google (Gemini 관련) | (미확인) | en | 선택 |
| 뉴스 | (영문 AI 뉴스 채널 1~2곳) | (미확인) | en | 사용자 지정 권장 |
| 국내 | (국내 AI 활용 채널 1~2곳) | (미확인) | ko | 사용자 지정 권장 |

## 보강 수집 (RSS 외)
- WebSearch: `claude`, `chatgpt`, `gemini`, `claude code` + "youtube" 최신 영상 (결과 라벨은 `검색요약`)
- 2단계(YouTube Data API): 키워드 검색·조회수·쇼츠 제외 — `docs/AI-REPORT-FLOW.md` Phase 4
