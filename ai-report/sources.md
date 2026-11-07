# 모니터링 채널 목록

> 채널 ID(`UC…`)는 추측하지 않는다. 아래 ID는 2026-11-07 채널 페이지(`externalId`)에서 확인했다.
> 사용자가 자유롭게 추가·삭제한다. 추가할 때는 핸들(@...)만 적어도 되고, 수집기가 핸들로 읽는다.

수집 명령: `python3 -I ai-report/tools/fetch_channel.py <핸들> 10`

| 분류 | 채널 | 핸들 | id | 언어 |
|---|---|---|---|---|
| 공식 | Anthropic | @anthropic-ai | UCrDwWp7EBBv4NwvScIpBDOA | en/ko 자막 |
| 공식 | OpenAI | @OpenAI | UCXZCJLdBC09xxGZ6gcdrc6A | en |
| 공식 | Google DeepMind | @GoogleDeepMind | UCP7jMXSY2xbc3KCAE0MHQ-A | en |
| 뉴스 | AI Explained | @aiexplained-official | UCNJ1Ymd5yFuUPtn21xtRbbw | en |
| 뉴스 | Matthew Berman | @matthew_berman | UCawZsQWqfGSbCI5yjkdVkTA | en |
| 뉴스 | Two Minute Papers | @TwoMinutePapers | UCbfYPyITQ-7l4upoX8nvctg | en |
| 국내 | 조코딩 JoCoding | @jocoding | UCQNE2JmbasNYbjGAcuBiRRg | ko |
| 국내 | 안될공학 | @unrealtech | UCeN2YeJcBCRJoXgzF_OU3qw | ko |

## 보강 수집
- WebSearch: `claude`, `chatgpt`, `gemini`, `claude code` 최신 소식 (결과 라벨 `검색요약`)
- 2단계(YouTube Data API): 키워드 검색·정확한 게시일·설명·조회수 — `docs/AI-REPORT-FLOW.md` Phase 4
