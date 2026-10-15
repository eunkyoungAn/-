# 🏢 Claude 에이전트 사무실

주제 하나만 던지면 팀장이 업무를 나눠 각 팀이 처리합니다.

```
사용자 ──주제──▶ 팀장(/office 명령)
                   ├─▶ 리서치팀  → 01_research.md
                   ├─▶ 기획팀    → 02_plan.md
                   ├─▶ 콘텐츠팀  → 03_draft.md
                   ├─▶ 검수팀    → 04_review.md
                   └─▶ (수정 반영) → 05_final.md
```

## 사용법 (Claude Code에서 이 저장소를 연 상태)
```
/office 2027년 청년 취업 트렌드 강의안
```
결과물은 `office/<날짜_주제>/` 폴더에 쌓입니다.

## 팀 추가하기
`.claude/agents/`에 md 파일을 하나 추가하고(예: `office-designer.md` — PPT 구조 담당),
`.claude/commands/office.md`의 배분 단계에 한 줄 추가하면 됩니다.

## 전문팀
| 팀 | 에이전트 | 이렇게 던지면 |
|---|---|---|
| 강의설계팀 | office-lecture-designer | `/office 대학생 대상 AI 활용 취업준비 4시간 특강` |
| 블로그팀 | office-blogger | `/office 자소서 첫 문장 쓰는 법 블로그 글` |
| 카드뉴스팀 | office-cardnews-designer | `/office 면접 꿀팁 5가지 카드뉴스` 또는 `/office 경험노트 작성법 블로그 글 + 카드뉴스` |
| 발표자료팀 | office-ppt-designer | `/office 친환경 포장재 프로젝트 결과 보고 발표자료` 또는 `/office 시장 분석 보고서 + 카드뉴스 + 발표자료` (병렬) |
| 자기소개서팀 | office-coverletter-writer | `/office 삼성전자 마케팅 직무 자소서, 경험: ...` |

## 구조 메모
Claude Code의 하위 에이전트는 다른 에이전트를 부를 수 없습니다.
그래서 팀장 역할은 에이전트가 아니라 `/office` 명령(메인 세션)이 맡고, 메인 세션이 각 팀 에이전트를 직접 호출합니다.

## 사무실 화면
`office/dashboard.html` — 팀원들이 책상에서 일하는 모습을 보여줍니다. GitHub Pages나 내 컴퓨터에서 열면 저장소의 실제 진행 상황을 불러오고, 그 외에는 데모를 재생합니다.

## 디자인 기준
`office/design/ppt-morph-spec.md` — 발표자료팀이 따르는 「모핑·도식 버전 디자인 명세서」. 흰 배경, #5779FF 강조, 맑은 고딕, 모핑 전환, 품질 기준. 이 파일을 바꾸면 이후 모든 발표자료에 반영됩니다.
