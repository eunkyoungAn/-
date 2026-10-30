# Grounded AI(그라운딩, 근거 기반 AI) 리서치 (RAG·파인튜닝 비교 확장판)

- 작성일: 2026-10-30 / 용도: 커리어캐쳐 블로그(취준생·직장인, 자소서·면접 준비에 AI 활용). 글 중심: Grounded AI·RAG·파인튜닝 비교 + '일하는 방식' 연결
- 확인 수준 표기: **원문 확인** = 해당 페이지를 직접 열어 확인 / **검색요약** = 검색 결과 요약만 확인(페이지 직접 열람 못 함)
- 환경 제약: aws.amazon.com, docs.aws.amazon.com, arxiv.org, blog.google, support.google.com, docs.cloud.google.com, docs.anthropic.com, developers.openai.com, platform.openai.com, learn.microsoft.com 직접 열람 불가(네트워크 허용 목록 밖). 이 출처들은 검색요약으로만 표기. 직접 열람한 것은 platform.claude.com 2개 페이지뿐.
- 통계·수치: 출처 확인된 수치 없음. 글에 수치를 넣지 않는 것을 권장.

## ① 핵심 요약
1. Grounding은 '답을 근거 자료에 묶는다'는 목적, RAG는 그 대표 구현 방식, 파인튜닝은 모델 자체의 행동(말투·형식·작업 방식)을 바꾸는 방식으로 층위가 다르다(Google·Microsoft·AWS 문서 설명, 검색요약).
2. 공식 문서들의 공통 구도: 지식 문제(최신·사내 자료) = RAG/그라운딩, 행동 문제(톤·형식·일관성) = 파인튜닝.
3. 환각은 줄일 수 있어도 없앨 수 없다(Anthropic 원문 확인). 출처가 있어도 사람이 검증해야 한다.
4. "프롬프트 → RAG → 파인튜닝" 순서: AWS는 프롬프트 먼저·파인튜닝은 비용 고려를 권고(검색요약). OpenAI는 이 순서를 '선형이 아니다'라고 단서를 단다(검색요약). 개인 업무엔 대부분 프롬프트+자료 첨부 단계로 충분하다는 해석은 추정.
5. 취업 준비 팁: 경험 자료 제공 + "자료 안의 내용만 / 근거 문장 표시 / 모르면 모른다고".

## ② 주요 발견

### 1) 정의
- Grounding = 모델 출력을 외부의 검증 가능한 자료에 연결하는 것.
  - Google "Grounding with Google Search": 모델이 검색 필요성 판단 → 검색어 생성·실행 → 결과로 답변, 출처 URL 인용 정보 반환. 검색요약. https://ai.google.dev/gemini-api/docs/google-search
  - Google 엔터프라이즈: 자체 검색 API 스니펫을 "source of truth"로 사용. 검색요약. https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-your-search-api
- RAG: 답변 전에 학습 데이터 밖의 신뢰할 만한 지식 베이스를 검색해 질문과 함께 모델에 전달. 학습 데이터는 시점 고정이라 최신성 확보가 어렵다는 배경. 재학습 없이 지식 추가. 검색요약. https://aws.amazon.com/what-is/retrieval-augmented-generation/ , https://www.ibm.com/think/topics/retrieval-augmented-generation
- RAG 원 논문: Lewis et al. 2020 (arXiv 2005.11401). 서지만 검색요약, 초록 원문 미확인. https://arxiv.org/abs/2005.11401
- 용어 주의: "grounding"은 업체마다 범위가 달라 단일 표준 정의는 미확인. 글에서는 "근거 자료에 연결해 답하게 하는 원칙"으로 풀어 쓰기 권장(추정).

### 2) 환각과의 관계
- 환각 = 사실과 다르거나 주어진 맥락과 불일치하는 텍스트 생성. Anthropic: 가장 진보한 모델도 때때로 생성. **원문 확인.** https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
- Grounding/RAG는 환각 감소 수단으로 제시됨(AWS·IBM·Google). 검색요약.
- "줄이는 것이지 없애는 것이 아님": Anthropic 원문 - "significantly reduce hallucinations, they don't eliminate them entirely. Always validate critical information." **원문 확인.**
- Google Live API의 "환각 방지" 표현은 업체 주장이며 오류 0 보장 근거 아님. 검색요약.

### 3) 구현 방식 (제품명은 공식 문서 확인 건만)
- 웹 검색 연동: Gemini API Grounding with Google Search. 검색요약. https://ai.google.dev/gemini-api/docs/google-search
- 파일 검색/RAG: OpenAI File Search - 업로드 파일을 벡터 저장소에 청킹·임베딩·인덱싱, 시맨틱+키워드 검색. 검색요약. https://developers.openai.com/api/docs/guides/tools-file-search
- 출처 인용: Claude Citations - 근거 구절(cited_text, 페이지/문자 범위) 반환, 텍스트·PDF 지원. 검색요약. https://platform.claude.com/docs/en/build-with-claude/citations
- 문서 첨부형: Google NotebookLM - 올린 소스에만 근거, 인라인 인용. 구글 공식 원문 미열람(미확인), 2차 가이드·검색요약. https://blog.google/technology/ai/notebooklm-google-ai/
- Google Vertex AI RAG Engine(관리형 RAG 런타임)과 grounding check API(RAG 출력을 검색된 사실과 비교) 존재: 검색요약. https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/ground-responses-using-rag
- 일반 챗봇 앱의 파일 첨부·웹검색 세부 동작은 제품별 미확인.

### 4) 한계
- 근거 자료가 틀리거나 부족하면 답도 틀림 / 자료에 없는 정보는 채우지 못함(NotebookLM 2차 설명, 검색요약). 공식 문서 직접 인용은 미확인(추정: 일반 원리).
- 출처가 붙어도 검증 필요: Anthropic "Always validate critical information, especially for high-stakes decisions." **원문 확인.**
- 검색 결과 수 제한(`max_num_results`)은 토큰·지연을 줄이나 품질 희생 가능(OpenAI, 검색요약).
- RAG 자체의 약점: AWS 비교 문서는 '문서 전체를 요약하는 작업'을 RAG의 약점으로 언급(검색요약).

### 5) 취업 준비 팁 (일반적 사용법)
Anthropic 공식 기법(원문 확인)을 자소서·면접에 적용. 예시 문구는 팀 작성(추정), 공식 문구 아님.
- 자료 안의 내용만 사용: 공식 기법 "External knowledge restriction". → "아래 경험노트 안의 내용만 사용해 초안을 써줘."
- 근거 문장 표시: 공식 기법 "direct quotes / verify with citations; 근거를 못 찾으면 주장 삭제". → "문장마다 근거 문장을 []로 붙이고, 근거 없으면 그 문장을 빼줘."
- 모르면 모른다고: 공식 기법 "Allow Claude to say 'I don't know'". → "자료에 없는 내용은 '자료에 없음'이라고 쓰고, 필요한 정보는 되물어줘."
- 면접: 답변의 수치·역할·기간을 본인이 자료와 대조. 자료에 없는 성과·숫자는 환각 신호(일반 권고, 추정).
- 개인정보(실명·학교·연락처)는 외부 AI에 올리기 전 가리거나 서비스 데이터 정책 확인(일반 권고, 서비스별 정책 미확인).
- 인용 추출 기법은 공식 문서에서 긴 문서(>20k 토큰) 대상으로 설명(원문). 짧은 경험노트에서의 효과는 다를 수 있음(추정).

### 6) [신규] 세 개념의 관계 (Grounding / RAG / 파인튜닝)
제안 구분: 그라운딩 = 목적·원칙, RAG = 그 대표 구현, 파인튜닝 = 가중치 추가 학습으로 행동 변경. 문서별 뒷받침 정도는 아래와 같다.
- Google Cloud: RAG를 grounding의 권장 방법으로 설명("recommended best practice is to use RAG"). 튜닝은 기본 동작을 바꿔 복잡한 프롬프트 없이도 원하는 결과를 일관되게 내게 하고, 프롬프트 단순화로 비용·지연을 줄이는 수단. → 그라운딩=RAG 중심 / 튜닝=행동 커스터마이징 구도 일치. 검색요약. https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/ground-responses-using-rag , https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/beginners-guide
- Microsoft(Foundry/Learn): "RAG = 비공개·자주 바뀌는 데이터에 근거한 답변, 파인튜닝 = 모델 행동·스타일·작업 성능(새 지식 아님)". 검색요약. https://learn.microsoft.com/en-us/azure/foundry/concepts/retrieval-augmented-generation , https://learn.microsoft.com/th-th/azure/developer/ai/augment-llm-rag-fine-tuning
- AWS Prescriptive Guidance: RAG 대 파인튜닝 비교 문서 존재, 둘을 한 모델에서 결합 가능. 검색요약. https://docs.aws.amazon.com/prescriptive-guidance/latest/retrieval-augmented-generation-options/rag-vs-fine-tuning.html
- OpenAI: 'Optimizing LLM Accuracy'에서 프롬프트 엔지니어링·RAG·파인튜닝을 정확도 최적화 수단으로 다루고, 격차를 context(모델이 모르는 정보)와 output/model(행동) 문제로 구분(Humanloop 요약 경유, 가이드 자체는 미열람). 검색요약. https://developers.openai.com/api/docs/guides/optimizing-llm-accuracy
- Anthropic: 프롬프트 가이드에서 성공 기준·평가를 먼저 세우라고 안내(원문 확인). RAG vs 파인튜닝 비교 문서는 이번에 미확인. https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- "파인튜닝 = 가중치 추가 학습" 정의 문구 자체를 공식 문서 원문으로 확인하지 못함(미확인). Google 문서가 '기본 동작 변경'으로 설명한 것은 검색요약.
- 파인튜닝은 인용 제공 안 함, 새 지식 주입 용도가 아님이 AWS·Microsoft에서 공통(검색요약).

### 7) [신규] 비교표 재료 (출처 있는 설명만)
| 항목 | 그라운딩/RAG | 파인튜닝 | 출처·확인 수준 |
|---|---|---|---|
| 목적 | 비공개·최신 자료에 근거한 답변 | 행동·스타일·작업 성능 변경(새 지식 주입용 아님) | Microsoft 문서, 검색요약 |
| 지식 최신성 | 최신 문서를 몇 분 내 반영 가능(AWS). 재학습 없이 프롬프트로 새 데이터 제공(Azure ML) | 재학습 필요. 소요 수 시간~수 일, 모델 크기에 따라(AWS). 업데이트가 잦은 작업엔 부적합(Microsoft) | AWS·Microsoft 문서, 검색요약 |
| 비용·준비 난이도 | 검색 호출로 왕복·연산·지연 추가(Microsoft). 색인·자료 준비 필요 | 시간·비용 부담 크다(AWS 라이프사이클 가이드). 지속적 도메인 적응은 비용 높음(Azure ML). 많은 조직은 불필요(AWS 데이터 가이드) | AWS·Microsoft 문서, 검색요약 |
| 출처 인용 | 가능(AWS: 정보 출처 참조 제공). Google 블로그: 항상 자사 데이터를 인용해야 하면 RAG | 불가(AWS: 응답에 출처 참조 없음) | AWS·Google 문서, 검색요약 |
| 환각 감소 | 근거 자료 제공으로 감소, 완전 제거 아님(Anthropic 원문 확인) | 환각 감소 효과에 대한 공식 근거 미확인 | Anthropic 원문 / 파인튜닝은 미확인 |
| 접근 통제 | RAG는 호출자별 접근 가능한 그라운딩 데이터 통제 가능(Google 블로그) | 해당 설명 미확인 | Google 블로그, 검색요약 |
| 적합 상황 | 최신·사내 문서 질의, 출처 필요 | 톤·형식·분류·요약 같은 반복 작업(AWS는 요약류, Google은 브랜드 보이스 예) | AWS·Google·Microsoft, 검색요약 |
| 주의 | 문서 전체 요약엔 약함(AWS) | 일반 언어 과제 성능이 떨어질 수 있음(Microsoft) | 검색요약 |
- 둘은 배타적이지 않고 결합 가능: 튜닝으로 브랜드 톤, RAG로 자사 데이터 기반 답변(Google 블로그). Microsoft Tech Community도 결합 제안. 검색요약. https://cloud.google.com/blog/products/ai-machine-learning/to-tune-or-not-to-tune-a-guide-to-leveraging-your-data-with-llms
- 주의: Google 블로그는 약 900~1,000일 전 글(구형 모델 언급), AWS 문서도 오래된 것이 있음. 현행 기능은 재확인 필요.
- 수치 비교(비용 금액, 정확도 %)는 확인하지 못해 포함하지 않음.

### 8) [신규] 일하는 방식 연결
- 권장 순서 문서 근거:
  - AWS Generative AI Lifecycle 가이드: 모델 기존 능력으로 되는 작업은 프롬프트 엔지니어링부터, 지식 주입은 RAG가 보통의 선택, 파인튜닝은 시간·비용 고려. 검색요약. https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/gen-ai-lifecycle-operational-excellence/gen-ai-lifecycle-operational-excellence.pdf
  - OpenAI: 많은 가이드가 '프롬프트 → RAG → 파인튜닝' 선형 흐름을 제시하나 실제로는 선형이 아니며, 프롬프트로 기준선을 만든 뒤 실패 원인(context vs 행동)에 따라 다음 수단 선택. 요약·번역·코드 생성은 프롬프트만으로 충분한 경우 많음. 대형 고객 배포 다수가 프롬프트+RAG만 사용. 검색요약(가이드 본문 미열람). https://developers.openai.com/api/docs/guides/optimizing-llm-accuracy
  - Anthropic: 먼저 성공 기준·평가 마련, 그 다음 프롬프트 개선(원문 확인).
  - 결론: "순서 자체"는 AWS가 가장 가깝게 뒷받침, OpenAI는 '고정 순서 아님'이라 단서. 글에서는 "대체로 이 순서를 권한다, 실패 원인에 따라 다르다"로 표현 권장.
- 개인·소규모 업무 해석(모두 추정, 팀 제안):
  - 자기소개서: 경험노트 첨부 + "자료 안 내용만" 프롬프트 = 단순한 그라운딩 단계. 파일이 많아지면 문서 첨부형 서비스/RAG.
  - 면접 준비: 이력서·직무기술서·내 경험을 근거 자료로 주고 예상 질문 답변을 만들게 한 뒤 근거 문장 대조 = 프롬프트+자료 첨부.
  - 교육자료 작성: 사내 규정·교안 원본을 자료로 첨부해 인용 요청 = 그라운딩/RAG. 같은 형식·톤을 매번 반복해야 하면 먼저 예시와 템플릿을 프롬프트에 넣고, 그래도 일관성이 안 나오는 대규모 반복에서만 파인튜닝 검토.
  - 개인이 파인튜닝까지 가야 하는 경우는 드물다는 판단: AWS가 "대부분 조직은 불필요"라 한 것에 근거한 추정이며 개인 사용자 대상 공식 언급은 미확인.

## ③ 통계·사례
- 출처 확인된 통계·수치: 없음. 환각률, 비용 금액, 정확도 수치는 쓰지 말 것.
- 사례(구조 설명용): Anthropic 공식 예시 - 보도자료 초안 작성 후 주장마다 근거 인용을 찾고 없으면 삭제 표시(원문 확인). 자소서 문장 검증 흐름에 응용 가능.
- OpenAI "대형 고객 배포 다수가 프롬프트+RAG만 사용"은 가이드 요약(검색요약), 구체 사례명·수치 미확인.

## ④ 확인되지 않은 부분 (미확인)
- 열람 불가 도메인(AWS, OpenAI, Microsoft Learn, Google Cloud, arXiv, blog.google, support.google.com) 원문 전반. 허용 시 재확인 가능.
- 파인튜닝 정의("가중치 추가 학습")의 공식 문서 원문, 파인튜닝의 환각 감소 효과
- Anthropic의 RAG vs 파인튜닝 비교 문서
- OpenAI 가이드 본문(Humanloop 등 2차 요약 경유)
- NotebookLM 공식 도움말, 일반 챗봇 앱의 파일 첨부·검색 기능 세부 동작
- 정량 비교(비용·정확도·환각률)
- 개인 사용자 대상 파인튜닝 권장 여부

## ⑤ 출처 목록
1. Anthropic, Reduce hallucinations (원문 확인) - https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
2. Anthropic, Prompt engineering overview (원문 확인) - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
3. Anthropic, Citations (검색요약) - https://platform.claude.com/docs/en/build-with-claude/citations
4. Google, Grounding with Google Search (검색요약) - https://ai.google.dev/gemini-api/docs/google-search
5. Google Cloud, Grounding with your search API (검색요약) - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-your-search-api
6. Google Cloud, Ground responses using RAG (검색요약) - https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/ground-responses-using-rag
7. Google Cloud, Generative AI beginner's guide (검색요약) - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/beginners-guide
8. Google Cloud blog, To tune or not to tune (검색요약, 오래된 글) - https://cloud.google.com/blog/products/ai-machine-learning/to-tune-or-not-to-tune-a-guide-to-leveraging-your-data-with-llms
9. OpenAI, File search (검색요약) - https://developers.openai.com/api/docs/guides/tools-file-search
10. OpenAI, Optimizing LLM Accuracy (검색요약) - https://developers.openai.com/api/docs/guides/optimizing-llm-accuracy
11. Microsoft Learn, RAG in Microsoft Foundry (검색요약) - https://learn.microsoft.com/en-us/azure/foundry/concepts/retrieval-augmented-generation
12. Microsoft Learn, Augment LLMs with RAGs or fine-tuning (검색요약) - https://learn.microsoft.com/th-th/azure/developer/ai/augment-llm-rag-fine-tuning
13. Microsoft Tech Community, RAG vs fine-tuning in Foundry (검색요약, 공식 문서보다 2차) - https://techcommunity.microsoft.com/discussions/azure-ai-foundry-discussions/when-should-you-use-rag-vs-fine-tuning-in-microsoft-foundry/4510099
14. AWS Prescriptive Guidance, Comparing RAG and fine-tuning (검색요약) - https://docs.aws.amazon.com/prescriptive-guidance/latest/retrieval-augmented-generation-options/rag-vs-fine-tuning.html
15. AWS Prescriptive Guidance, Gen AI Lifecycle Operational Excellence (검색요약) - https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/gen-ai-lifecycle-operational-excellence/gen-ai-lifecycle-operational-excellence.pdf
16. AWS, What is RAG? (검색요약) - https://aws.amazon.com/what-is/retrieval-augmented-generation/
17. IBM, What is RAG? (검색요약) - https://www.ibm.com/think/topics/retrieval-augmented-generation
18. Lewis et al. 2020 (서지만 검색요약) - https://arxiv.org/abs/2005.11401
19. Google, Introducing NotebookLM (검색요약) - https://blog.google/technology/ai/notebooklm-google-ai/
