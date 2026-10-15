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
