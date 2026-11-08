# 업무 후보 파일 형식 (candidates.json)

`python3 workdesk/tools/workdesk.py validate <파일>` 이 이 형식을 검사한다.

```json
{
  "source_ids": ["src_001"],
  "run": {"by": "extract-work-items", "skill_version": "1", "created_at": "2026-11-08T10:00:00+09:00", "model": "기록용"},
  "summary": ["요약 문장 1", "요약 문장 2"],
  "decisions": [
    {"text": "회의 장소는 2층 회의실로 확정",
     "evidence": [{"source_id": "src_001", "message_id": "msg_0006", "line_start": 10, "line_end": 10}]}
  ],
  "candidates": [
    {
      "candidate_id": "cand_001",
      "title": "월간 재고 집계표 초안 작성",
      "proposed_owner": "김민수",
      "owner_basis": "explicit",
      "proposed_due_at": "2026-11-11",
      "due_basis": "explicit",
      "timezone": "Asia/Seoul",
      "evidence": [
        {"source_id": "src_001", "message_id": "msg_0002", "line_start": 6, "line_end": 6},
        {"source_id": "src_001", "message_id": "msg_0007", "line_start": 12, "line_end": 12}
      ],
      "questions": ["기한이 11월 13일에서 11월 11일로 바뀐 것이 맞나요?"],
      "status": "needs_review",
      "version": 1
    }
  ]
}
```

| 항목 | 값 | 검사 규칙 |
|---|---|---|
| `owner_basis` | explicit / inferred / unknown | unknown이면 owner는 null. explicit이면 이름이 근거 원문(본문 또는 말한 사람)에 있어야 함. inferred·unknown은 질문 필수 |
| `due_basis` | explicit / inferred / ambiguous / unknown | ambiguous·unknown이면 due는 null. inferred는 근거 메시지에 시각이 있어야 함. explicit 외에는 질문 필수 |
| `evidence` | 1개 이상 | 원문에 실제로 있는 message_id, 줄 범위 일치 |
| `status` | needs_review | AI가 만든 후보는 항상 이 값 |

## 상태 흐름
- 후보: `needs_review → approved(확정 업무로 저장) / rejected`
- 확정 업무: `todo → doing → blocked / done / cancelled` (done은 완료 근거 필수, blocked는 이유 필수)
