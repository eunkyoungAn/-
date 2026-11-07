# 01_research: AI 평가와 보안 (2026-11-07 기준)

방법 메모: 웹 검색 요약만 확인했고 공식 페이지 본문은 직접 열람하지 못함. 아래 "공식"은 검색 결과에 공식 URL이 잡힌 경우, 검색 요약은 "요약만 확인"으로 표기.

## ① 핵심 요약
- GPT-6 Cyber는 보도로 존재 확인(승인 고객 한정 접근 구조도 일치). 그러나 "Firefox 취약점 81건"은 검색에서 못 찾음(미확인).
- LifeVal(169개 과제)은 2차 보도 다수로 확인. 점수는 OpenAI 자체 결과.
- Kimi K3.1 Pro는 출시는 확인, 가중치 공개는 "11월 4일까지 공개 예정"만 확인. 실제 공개 여부 미확인.
- 조코딩·안될공학 영상은 검색에서 못 찾음(제목 기준 그대로, 내용 쓰지 말 것).
- 흐름(과제 완수형 평가)은 METR·GDPval·LifeVal로 부분 뒷받침. 채용 조언은 일반 조언 수준.

## ② 항목별 확인 수준 표

| # | 항목 | 확인된 사실 | 출처 | 확인 수준 | 이미지와 다른 점 |
|---|---|---|---|---|---|
| ① | GPT-6 Cyber, Firefox 81건 | Fortune 인용 보도: OpenAI가 GPT-6 Cyber 프리뷰 준비. Daybreak Red(신청제) 일부 고객이 알파 접근. 2026년 4개째 사이버 특화 모델(5.4/5.5/5.6-Cyber 이어). Trusted Access for Cyber는 검증된 방어자 대상 프로그램(2026-02 시작). "81건"은 검색에 없음. Firefox 취약점 발굴은 Anthropic 쪽 보도(Opus 4.6 22건, Mythos Preview 271건)만 확인 | https://thenextweb.com/news/openai-gpt-6-cyber-preview-fortune , https://www.ksl.com/article/51628388/openai-to-preview-gpt-6-cyber-within-days-fortune-reports , https://openai.com/blog/trusted-access-for-cyber , https://www.pcgamer.com/software/browsers/defenders-finally-have-a-chance-to-win-decisively-firefox-cto-raves-about-claude-mythos-bug-hunting-capabilities-after-it-finds-271-vulnerabilities/ | 모델·접근 제한: 보도(9월 말 기준). 81건·"수정 제안": 미확인 | 보도는 9월 말 "프리뷰 예정"이고, 이미지는 "1일 전" 소식. 공식 발표 여부 미확인. Firefox 건은 타사(Anthropic) 사례와 혼동 가능성, 주의 |
| ② | LifeVal | 2026-11-02경 공개. 169개 에이전트형 생활 과제(자녀 학교 등록, 관공서 업무 등), 브라우저·컴퓨터 사용. 미국 시간사용조사 등 기반 설계. 최고 모델 평균 80.6%라는 보도, 예시 과제 일부는 90~100%. OpenAI 자체 결과. 매체 간 공개 범위 서술이 엇갈림 | https://apidog.com/blog/what-is-openai-lifeval/ , https://letsdatascience.com/news/openai-introduces-lifeval-benchmark-for-everyday-ai-tasks-4b0130d9 , https://yourstory.com/ai-story/lifeval-openai-ai-everyday-tasks | 보도(2차 다수). OpenAI 원문은 미열람 | 이미지 "9시간 전"과 보도일(11/2~3) 불일치 가능. 점수는 글에 쓰지 않는 편이 안전 |
| ③ | Kimi K3.1 Pro | 2026-10-23 API·앱 출시, 100만 토큰 컨텍스트. 가중치는 "11/4까지 공개 예정"으로 보도. 11/4 이후 공개 확인 기사는 못 찾음. 사이버 관련 학습 자료 제거했다는 보도. 벤치마크는 대부분 업체 발표 수치. Artificial Analysis가 공개 시 오픈웨이트 1위일 것이라 했다는 전언 | https://letsdatascience.com/news/moonshot-releases-kimi-k31-pro-api-open-weights-due-nov-4-786e160c , https://www.vals.ai/models/kimi_kimi-k3.1-pro , https://www.vktr.com/ai-platforms/kimi-k31-pro-nears-top-proprietary-models-as-moonshot-limits-its-cyber-skills/ | 출시: 보도. 가중치 실제 공개: 미확인(Hugging Face 직접 확인 필요) | 이미지는 "공개 완료"처럼 읽힘. 확인된 건 "공개 예정". "최상위권"은 조건부(공개 후 기준) |
| ④ | 조코딩 AdMob 영상 | 해당 영상 못 찾음. 조코딩 채널 목록에 AdMob·1인개발 태그가 있다는 수준. AdMob 공식 문서에서 광고 단위 생성 후 앱에 연동하는 개념은 확인 | https://developers.google.com/admob , https://dpg.danawa.com/mobile/video/view?listSeq=6074716 | 영상: 미확인(제목 기준 유지). AdMob 일반 개념: 공식 | 이미지의 "Google AdMob 세션" 표현은 영상 내용 확인 불가 |
| ⑤ | 안될공학 Siri AI | 영상·채널 못 찾음. 별개로 Apple이 6/8 WWDC에서 Siri AI 공개, Gemini 활용, iOS 27에서 타사 AI 어시스턴트 개방 계획, EU 미제공 보도, 한국경제는 "구글 따라가는 수준" 평가 | https://www.hankyung.com/article/2026060964881 , https://www.digitaltoday.co.kr/en/view/530/apples-siri-aims-to-catch-up-with-google-and-openai | 영상: 미확인. Apple Siri AI 배경: 보도 | "애플에게 기회라는 분석"은 영상 주장. 같은 주제의 보도는 비판적 시각도 있어 단정 금지 |
| ⑥ | Claude: Enterprise 보안 센터, 개인 금융 연결(베타) | "Claude Security"(구 Claude Code Security)가 Enterprise 대상 공개 베타라는 보도. "보안 센터"라는 이름은 못 찾음. 개인 금융 연결은 "Claude Money" 테스트 보도(TestingCatalog 스크린샷 인용, 날짜 불분명, 개인 대상으로 보임) | https://www.techzine.eu/news/security/140944/anthropic-claude-security-available-to-all-enterprise-customers/ , https://runtimewire.com/article/anthropic-tests-claude-money-bank-account-connections , https://www.bleepingcomputer.com/news/artificial-intelligence/anthropic-wants-claude-to-analyze-your-bank-account-and-financial-data/amp/ | 두 기능 모두 이름·시점 불일치, 검색요약 수준 | "보안 센터"는 "Claude Security"와 다른 이름일 수 있음. "이번 주" 시점 미확인. 두 기능이 한 업데이트인지 미확인 |

## ③ 흐름 근거: 평가가 "끝까지 해내는가"로 이동
| 근거 | 내용 | 강도 |
|---|---|---|
| METR 시간 지평(time horizon) | 모델이 완료하는 과제 길이(인간 전문가 소요 시간 기준, 50% 성공)로 측정. 약 7개월마다 2배라는 추정. 2026-02 Opus 4.6이 약 14시간 수준이라는 전언(2차, METR 직접 확인 필요). METR 스스로 아주 긴 과제는 신뢰 있게 측정 못 한다고 경고 | 중 (논문 https://arxiv.org/html/2503.14499v3 확인. 최신 수치는 2차) |
| GDPval 계열 | 실제 직무 과제 수행 평가라는 설명을 확인. 다만 이번 검색의 상세는 2차 요약이고, 설명이 시뮬레이션 회사 과제와 섞여 있어 정의는 원문 확인 필요 | 약~중 |
| OpenAI LifeVal | 시험 문제가 아닌 생활 업무 169개를 에이전트가 수행. 이 흐름의 직접 사례(자체 결과) | 중 (보도 다수, 외부 검증 없음) |
| 업계 전체 이동 | "벤치마크 전반이 이동 중"이라고 직접 정리한 공신력 있는 자료는 못 찾음 | 미확인. 글에서는 "그런 사례가 늘고 있다" 정도로만 |

## ④ 취업 연결 근거
- 검색에서 "AI 경험을 도구 이름이 아닌 목표·과정·결과·검증으로 쓰라"고 명시한 채용 담당자 공식 발언이나 기관 자료는 못 찾음(미확인).
- 확인된 것은 취업 커뮤니티·상담 플랫폼·블로그 수준의 일반 조언(근거 약함): 경험의 구체성이 중요, 면접에서 문장마다 사례 설명 가능해야 함, AI가 임의로 추가한 성과·수치는 실제 기록과 대조, 상투 문장 지양. 예: https://comento.kr/job-questions/모든회사/모든직무/자기소개서_작성 시 ai 사용에 대한 불이익 및 시선-634865 , https://view.asiae.co.kr/article/2026020907233089971 (인사담당자의 AI 활용 인지 관련 기사, 본문 미열람)
- 일부 블로그의 "대기업 다수가 AI 탐지 도구 사용" 주장은 검증 안 됨. 쓰지 말 것.
- 글에서는 "일반적으로 권장되는 작성법(제안)"으로 쓰고, 채용 기준이라고 단정하지 않기.

## ⑤ 글에 쓰면 안 되는 것 / [확인 필요]
쓰지 말 것
- "Firefox 취약점 81건"을 확정 사실로 쓰기. 근거 미확인. 쓰려면 "카드 표기 기준(검색요약)".
- LifeVal 점수(80.6%, 100% 등)를 성과처럼 인용. 자체 결과, 매체별 서술 상이.
- Kimi "가중치 공개 완료", "공개 모델 1위". 확인은 "공개 예정"까지.
- 조코딩·안될공학 영상 내용 요약 또는 그 주장의 사실화.
- "채용 담당자가 ○○를 본다", "기업 다수가 AI 탐지기 사용" 등 출처 없는 단정.
- "AI가 시험 점수 평가는 끝났다" 식 과장. 시험형 벤치마크도 여전히 쓰임.
- Firefox 사례를 OpenAI로 서술할 때 Anthropic 사례(22건, 271건)와 섞기.

[확인 필요]
1. OpenAI 공식 블로그의 GPT-6 Cyber 발표 여부와 "Firefox 81건" 출처.
2. LifeVal OpenAI 원문(공개 범위, 외부 검증, 발표 시점).
3. Kimi K3.1 Pro 가중치 Hugging Face 공개 여부·라이선스.
4. 조코딩·안될공학 영상 실제 제목과 내용(슬랙 스레드 링크).
5. Anthropic 공식 릴리스 노트에서 "보안 센터"·금융 연결(베타) 명칭과 시점.
6. 채용 담당자 관점 근거(공식 설문·기관 자료) 보강.

## ⑥ 출처 목록
- https://thenextweb.com/news/openai-gpt-6-cyber-preview-fortune
- https://www.ksl.com/article/51628388/openai-to-preview-gpt-6-cyber-within-days-fortune-reports
- https://openai.com/blog/trusted-access-for-cyber
- https://www.pcgamer.com/software/browsers/defenders-finally-have-a-chance-to-win-decisively-firefox-cto-raves-about-claude-mythos-bug-hunting-capabilities-after-it-finds-271-vulnerabilities/
- https://apidog.com/blog/what-is-openai-lifeval/
- https://letsdatascience.com/news/openai-introduces-lifeval-benchmark-for-everyday-ai-tasks-4b0130d9
- https://yourstory.com/ai-story/lifeval-openai-ai-everyday-tasks
- https://letsdatascience.com/news/moonshot-releases-kimi-k31-pro-api-open-weights-due-nov-4-786e160c
- https://www.vals.ai/models/kimi_kimi-k3.1-pro
- https://www.vktr.com/ai-platforms/kimi-k31-pro-nears-top-proprietary-models-as-moonshot-limits-its-cyber-skills/
- https://developers.google.com/admob
- https://dpg.danawa.com/mobile/video/view?listSeq=6074716
- https://www.hankyung.com/article/2026060964881
- https://www.digitaltoday.co.kr/en/view/530/apples-siri-aims-to-catch-up-with-google-and-openai
- https://www.techzine.eu/news/security/140944/anthropic-claude-security-available-to-all-enterprise-customers/
- https://runtimewire.com/article/anthropic-tests-claude-money-bank-account-connections
- https://www.bleepingcomputer.com/news/artificial-intelligence/anthropic-wants-claude-to-analyze-your-bank-account-and-financial-data/amp/
- https://arxiv.org/html/2503.14499v3
- https://view.asiae.co.kr/article/2026020907233089971
