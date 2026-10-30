# Grounded AI(그라운딩, 근거 기반 AI) 리서치

- 작성일: 2026-10-30 / 용도: 커리어캐쳐 블로그(취준생·직장인, 자소서·면접 준비에 AI 활용)
- 확인 수준 표기: **원문 확인** = 해당 페이지를 직접 열어 확인 / **검색요약** = 검색 결과 요약만 확인(페이지 직접 열람 못 함)
- 환경 제약: aws.amazon.com, arxiv.org, blog.google, support.google.com, docs.cloud.google.com, docs.anthropic.com 직접 열람 불가(네트워크 허용 목록 밖). 해당 출처는 검색요약으로만 표기.
- 통계·수치: 이 문서에는 블로그에 쓸 통계가 없음(출처 확인된 수치 없음). 글에 수치를 넣지 않는 것을 권장.

## ① 핵심 요약
1. Grounding은 LLM이 학습 기억만으로 답하지 않고, 검증 가능한 외부 자료(문서·검색 결과)에 근거해 답하게 만드는 방식이다.
2. 목적은 환각(hallucination) 감소와 출처 확인 가능성이다. 다만 환각을 완전히 없애지는 못한다(Anthropic 공식 문서가 명시).
3. 구현 예: RAG, 웹 검색 연동(Google Search 그라운딩), 파일 검색(OpenAI File Search), 인용 기능(Claude Citations), 문서 첨부형(NotebookLM).
4. 한계: 근거 자료가 틀리거나 부족하면 답도 틀리고, 출처가 붙어도 사람이 원문을 확인해야 한다.
5. 취업 준비 팁: 내 경험 자료를 주고 "자료 안의 내용만 사용 / 근거 문장 표시 / 없으면 모른다고" 요청하면 자소서·면접 답변의 지어내기를 줄일 수 있다.

## ② 주요 발견

### 1) 정의
- Grounding = 모델 출력을 외부의 검증 가능한 자료에 연결하는 것. 업체 문서들이 "실시간 웹 콘텐츠/자체 데이터에 모델을 연결해 사실성을 높이고 인용을 제공"하는 의미로 사용.
  - Google "Grounding with Google Search": 모델이 검색이 도움 될지 판단 → 검색어 생성·실행 → 결과로 답변 작성, 출처 URL 인용 정보를 반환. 확인 수준: 검색요약. https://ai.google.dev/gemini-api/docs/google-search
  - Google 엔터프라이즈 문서: 자체 검색 API의 스니펫을 "source of truth"로 삼아 근거 있는 답변 생성. 검색요약. https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-your-search-api
- RAG(검색 증강 생성): LLM이 답하기 전에 학습 데이터 밖의 신뢰할 만한 지식 베이스를 참조하게 하는 기법. 검색기가 관련 자료를 찾아 질문과 함께 생성 모델에 전달. 학습 데이터는 시점이 고정돼 최신 정보 반영이 어렵다는 점이 배경. 재학습 없이 지식 추가 가능. 검색요약(AWS·IBM 문서). https://aws.amazon.com/what-is/retrieval-augmented-generation/ , https://www.ibm.com/think/topics/retrieval-augmented-generation
- RAG 원 논문: Lewis et al., 2020, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (arXiv 2005.11401). 서지정보만 검색요약으로 확인, 초록 원문은 미확인. https://arxiv.org/abs/2005.11401
- 용어 주의: "grounding"은 업체마다 범위가 달라(웹 검색형/자체 문서형) 단일 표준 정의는 미확인. 글에서는 "근거 자료에 연결해 답하게 하는 방식"으로 풀어 쓰는 것을 권장(추정).

### 2) 환각과의 관계
- 환각 = 사실과 다르거나 주어진 맥락과 일치하지 않는 텍스트를 생성하는 현상. Anthropic은 "가장 진보한 모델도 때때로 생성할 수 있다"고 명시. **원문 확인.** https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
- Grounding/RAG는 환각을 줄이는 수단으로 제시됨(AWS·IBM·Google 문서, 2025 arXiv 리뷰). 검색요약.
- 그러나 "줄이는 것이지 없애는 것이 아님": Anthropic 원문 - "these techniques significantly reduce hallucinations, they don't eliminate them entirely. Always validate critical information." **원문 확인.**
- Google Live API 문서가 "환각 방지"라고 표현한 것은 업체 주장이며 오류 0을 보장한다는 근거는 아님. 검색요약.

### 3) 구현 방식 (제품명은 공식 문서 확인 건만)
- **웹 검색 연동**: Google Gemini API "Grounding with Google Search" - 응답 텍스트 구간과 출처 URL을 연결하는 인용 정보 반환. 검색요약. https://ai.google.dev/gemini-api/docs/google-search
- **파일 검색/RAG**: OpenAI File Search - 업로드한 파일을 벡터 저장소에 청킹·임베딩·인덱싱하고 시맨틱+키워드 검색으로 모델이 참조. `include`로 검색된 결과 확인 가능. 검색요약(공식 문서 검색결과). https://developers.openai.com/api/docs/guides/tools-file-search
- **출처 인용**: Anthropic Claude Citations - 문서에 citations 활성화 시 답변의 근거가 된 정확한 구절(cited_text, 페이지/문자 범위)을 반환. 텍스트·PDF 지원, 이미지 인용 불가. 검색요약(공식 문서 검색결과). https://platform.claude.com/docs/en/build-with-claude/citations
- **문서 첨부형 서비스**: Google NotebookLM - 사용자가 올린 소스에만 근거해 답하고 인라인 인용으로 원문 구절 연결. 2023 출시 글이 "원문 인용을 응답 옆에 표시"를 설명했다는 내용은 검색요약. 구글 공식 도움말·블로그 원문은 열람 못 함(미확인). https://blog.google/technology/ai/notebooklm-google-ai/ (대학 도서관 가이드 등 2차 자료가 동일 설명)
- 일반 사용자용 챗봇의 파일 첨부·웹검색 기능 세부 동작(제품별)은 이번에 확인 못 함. 미확인.

### 4) 한계
- 근거 자료가 틀리거나 부족하면 답도 틀림 / 자료에 없는 정보는 채워주지 못함(NotebookLM 2차 가이드 설명, 검색요약). "Garbage in, garbage out" 성격은 일반 원리이며 공식 문서 직접 인용은 미확인(추정).
- 출처가 붙어도 사람이 확인 필요: Anthropic "Always validate critical information, especially for high-stakes decisions." **원문 확인.** 인용 클릭 후 원문 대조 권장은 2차 가이드(검색요약).
- 검색 결과 수 제한 등 설정이 답변 품질에 영향: OpenAI `max_num_results`는 토큰·지연을 줄이나 품질을 희생할 수 있음. 검색요약.
- 검색 연동형은 웹 출처의 품질에 의존(일반 원리, 공식 문구 미확인, 추정).

### 5) 취업 준비에서 쓰는 법 (일반적 사용 팁)
Anthropic 공식 가이드(원문 확인)의 기법을 자소서·면접에 적용한 것. 적용 예시는 팀 작성 제안(추정)이며 공식 문구가 아님.
- **자료 안의 내용만 사용**: 공식 기법 "External knowledge restriction - 제공 문서의 정보만 쓰고 일반 지식은 쓰지 말 것". → 예: "아래 경험노트 안의 내용만 사용해 자소서 초안을 써줘."
- **근거 문장 표시**: 공식 기법 "Use direct quotes / Verify with citations - 먼저 정확한 인용문을 추출하고, 주장마다 근거 인용을 달고, 근거를 못 찾으면 해당 주장을 삭제". → 예: "문장마다 경험노트의 근거 문장을 []로 붙이고, 근거가 없으면 그 문장을 빼줘."
- **모르면 모른다고**: 공식 기법 "Allow Claude to say 'I don't know'". → 예: "자료에 없는 내용은 추측하지 말고 '자료에 없음'이라고 써줘. 필요한 정보는 질문으로 되물어줘."
- 면접: 경험 자료를 주고 예상 질문별 답변을 만들게 한 뒤, 답변의 수치·역할·기간이 자료와 일치하는지 본인이 대조. 자료에 없는 성과·숫자가 들어갔다면 환각 신호(일반 권고, 추정).
- 주의: 개인정보(실명·학교·연락처 등)는 외부 AI 서비스에 올릴 때 직접 가리거나 서비스의 데이터 사용 정책을 확인(일반 권고. 각 서비스 정책은 이번에 미확인).
- 참고: 공식 문서는 "문서 길이가 길 때(>20k 토큰) 인용 추출 기법이 유효"라고 설명(원문). 짧은 경험노트에서는 효과 차이가 다를 수 있음(추정).

## ③ 통계·사례
- 출처 확인된 통계·수치: 없음. 환각률 등 수치는 이번 조사에서 확인하지 않았으므로 글에 쓰지 말 것.
- 사례(구조 설명용): 문서 첨부형 서비스에서 "답변 옆 원문 구절 확인" 흐름은 NotebookLM·Claude Citations 문서에서 공통 확인(검색요약).
- Anthropic 공식 예시: 보도자료 초안 작성 후 주장마다 근거 인용을 찾고, 없으면 삭제 표시(원문 확인). → 자소서 문장 검증 흐름에 그대로 응용 가능.

## ④ 확인되지 않은 부분 (미확인)
- Google 공식 Vertex AI Grounding 개요 페이지 원문(도메인 접근 불가) - 미확인
- AWS RAG 페이지, IBM RAG 페이지 원문 - 검색요약만
- RAG 원 논문 초록 원문 - 미확인
- NotebookLM 공식 도움말·출시 글 원문 - 미확인
- OpenAI File Search, Claude Citations, Gemini Google Search 그라운딩 페이지 원문 직접 열람 - 미확인(검색요약)
- ChatGPT·Claude·Gemini 일반 앱의 파일 첨부/검색 기능이 어느 수준으로 "그라운딩"되는지 - 미확인
- 그라운딩의 환각 감소 정량 효과 - 미확인(수치 사용 금지)
- 위 열람 불가 도메인을 허용하면 원문 재확인 가능.

## ⑤ 출처 목록
1. Anthropic, Reduce hallucinations (원문 확인) - https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
2. Anthropic, Citations (검색요약) - https://platform.claude.com/docs/en/build-with-claude/citations
3. Google, Grounding with Google Search, Gemini API (검색요약) - https://ai.google.dev/gemini-api/docs/google-search
4. Google Cloud, Grounding with your search API (검색요약) - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-your-search-api
5. Google Cloud, Grounding overview (검색 결과에 노출, 미열람) - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/overview
6. OpenAI, File search (검색요약) - https://developers.openai.com/api/docs/guides/tools-file-search
7. AWS, What is RAG? (검색요약) - https://aws.amazon.com/what-is/retrieval-augmented-generation/
8. IBM, What is RAG? (검색요약) - https://www.ibm.com/think/topics/retrieval-augmented-generation
9. Lewis et al. 2020, RAG (서지만 검색요약) - https://arxiv.org/abs/2005.11401
10. Google, Introducing NotebookLM (검색요약) - https://blog.google/technology/ai/notebooklm-google-ai/
