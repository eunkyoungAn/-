---
name: weekly-status-report
description: 사람이 승인한 확정 업무 원장(workdesk)으로 주간 진행 보고서(완료·진행·지연·막힘·확인 필요·변경 내역)를 만든다. "주간 보고서", "이번 주 업무 현황", "진행 상황 정리" 요청 시 사용. 승인 안 된 후보는 보고하지 않는다.
---

# 주간 진행 보고

1. 먼저 상태 변경이 있으면 반영한다(사용자가 말한 것만):
   - `python3 workdesk/tools/workdesk.py status <task_id> doing|blocked|done|cancelled --by <이름> [--note 이유] [--evidence 결과물 위치]`
   - 완료는 **근거(--evidence)가 있을 때만**. 근거가 없으면 완료로 쓰지 않고 사용자에게 묻는다.
2. `python3 workdesk/tools/workdesk.py report [--date YYYY-MM-DD] --out workdesk/runs/<YYYYMMDD>_주간보고/report.md`
3. 도구가 만든 초안을 바탕으로 다듬는다:
   - 숫자·업무 목록은 바꾸지 않는다. 문장만 업무보고 문체(개조식)로 정리.
   - 지연·막힘 항목 밑에 "다음 조치 제안"을 **제안**으로 구분해 붙일 수 있다.
   - 검토 대기 후보는 "검토 대기 n건"으로만 언급.
4. 보고 양식이 필요하면 `one-page-report-docx` 또는 `docx`로 넘긴다.
5. `office-reviewer`로 마지막 점검: 원장에 없는 업무·완료 표시가 들어가지 않았는지.

## 하지 않는 일
후보를 확정 업무처럼 보고, 근거 없는 완료 표시, 외부 발송.
