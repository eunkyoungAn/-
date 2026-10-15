# 🏢 Claude 에이전트 사무실

주제 하나만 던지면 팀장이 업무를 나눠 각 팀이 처리합니다.

```
사용자 ──주제──▶ 팀장(office-manager)
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
`office-manager.md`의 배분 단계에 한 줄 추가하면 됩니다.

## 전문팀
| 팀 | 에이전트 | 이렇게 던지면 |
|---|---|---|
| 강의설계팀 | office-lecture-designer | `/office 대학생 대상 AI 활용 취업준비 4시간 특강` |
| 블로그팀 | office-blogger | `/office 자소서 첫 문장 쓰는 법 블로그 글` |
| 자기소개서팀 | office-coverletter-writer | `/office 삼성전자 마케팅 직무 자소서, 경험: ...` |
