# 업무정리 데스크 (AI비서 · 업무 정리 에이전트)

대화·회의 메모에 흩어진 업무를 **근거와 함께** 뽑고, **사람이 확인한 업무만** 저장해서 진행 보고까지 만든다.
기준 문서: 「직장인 업무 자동화 프로젝트 기술 적용 계획」(2026-11-08) 0~2단계.

```
대화 TXT/CSV · 회의 메모
  ↓ ingest            원문 등록, 메시지 ID·줄 번호, 같은 파일 중복 차단
  ↓ extract-work-items   (AI) 요약·결정·업무 후보 + 근거 + 확인 질문
  ↓ validate          (도구) 근거 위치·담당자/기한 규칙 자동 검사
  ↓ verify-evidence      (AI) 원문 대조 판정표
  ↓ 사람이 검토         승인·수정·제외
  ↓ approve           (도구) 승인 기록 + 확정 업무 원장
  ↓ status / update   진행 상태·변경 이력
  ↓ weekly-status-report  확정 업무만으로 주간 보고서
  ↓ notify (선택)     숫자만 담은 알림 → 승인 → 카카오 나와의 채팅
```

## 쓰는 법 (Claude에게 말하기)
- `[업무정리] 운영팀 단톡 | 업무후보` 세션에서 파일을 올리고 "업무 후보 뽑아줘"
- 결과 표를 보고 "cand_001 승인, cand_003은 담당자 이서연으로 승인, cand_005 제외"
- "task_002 완료, 결과물은 드라이브 ○○ 폴더" → "이번 주 보고서 만들어줘"

## 역할
| 역할 | 담당 | 하지 않는 일 |
|---|---|---|
| 총괄 | 메인 세션 (사용자와 대화) | 근거 없이 업무 확정 |
| 추출 | `work-extractor` 에이전트 / `extract-work-items` 스킬 | 없는 담당자·기한 생성, 승인 |
| 검토 | `evidence-verifier` 에이전트 / `verify-evidence` 스킬 | 다른 역할 말만 보고 판정 |
| 보고 | `weekly-status-report` 스킬 | 후보를 확정 업무처럼 보고 |
| 원장 | `tools/workdesk.py` (규칙을 코드로 강제) | — |

## 도구 명령 (직접 써도 됨)
```bash
python3 workdesk/tools/workdesk.py ingest 파일.txt --by 홍길동
python3 workdesk/tools/workdesk.py show src_001
python3 workdesk/tools/workdesk.py validate workdesk/runs/폴더/candidates.json
python3 workdesk/tools/workdesk.py approve 후보파일 cand_001 --by 홍길동 [--owner 이름 --due 2026-11-20]
python3 workdesk/tools/workdesk.py status task_001 done --by 홍길동 --evidence "드라이브/보고서.docx"
python3 workdesk/tools/workdesk.py report --out 보고서.md
python3 workdesk/tools/workdesk.py notify draft --by 홍길동     # 카카오 알림 (KAKAO-ALIM.md 참고)
python3 workdesk/tools/workdesk.py purge           # 보존 기한(기본 90일) 지난 원문 확인 후 --yes로 삭제
```

## 데이터와 개인정보
- 원문·원장은 `workdesk/data/`(또는 환경변수 `WORKDESK_DATA` 경로)에 저장되고 **git에서 제외**된다.
- 실제 업무 대화는 **내 컴퓨터의 Claude Code(데스크톱 앱)**에서 쓰는 것을 권장한다. 클라우드 세션은 끝나면 데이터가 사라지고, 커밋하면 공개 저장소에 올라갈 수 있다.
- 회사 정책과 대화 참여자의 동의를 먼저 확인하고, 필요한 구간만 넣는다.
- `samples/`와 `runs/example/`은 모두 **가상 데이터**다.

## 검증
```bash
python3 -m unittest discover -s workdesk/tests -v
```
계획서 11장 시나리오와 알림 시나리오(승인 후 변경, 전송 불명확, 토큰 갱신 등) 중 도구로 확인 가능한 것(중복 파일, 형식 오류, 근거 누락, 날짜 불명확, 승인 후 변경, 완료 근거 등)을 자동 테스트한다.
AI 추출 품질(정밀도·재현율)은 사람이 만든 정답과 비교해야 하며 아직 측정하지 않았다.

## 카카오 알림 (5단계, 구현됨 · 실제 전송 미확인)
공식 '나에게 보내기' API로 승인된 최소 정보만 보낸다. 연결 방법과 확인 범위는 `KAKAO-ALIM.md`.

## 다음 단계 (아직 안 함)
| 단계 | 내용 |
|---|---|
| 3 | 웹 검토 화면(왼쪽 원문 · 오른쪽 후보, 근거 클릭 이동) — `frontend-design` 스킬 |
| 4 | 역할 관리 확장(Paperclip·Hermes 등)은 업무량이 늘 때 검토 |
| 6 | 팀 사용: 로그인·권한·DB 전환 |
