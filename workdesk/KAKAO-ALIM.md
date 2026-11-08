# 카카오톡 '나와의 채팅' 알림 연결 안내

## 결론: 가능하다 (조건 있음)
카카오 공식 **'나에게 보내기' API**로 내 카카오톡 '나와의 채팅'에 알림을 보낼 수 있다.

| 항목 | 내용 (2026-11-08 확인) |
|---|---|
| 보내는 곳 | `POST https://kapi.kakao.com/v2/api/talk/memo/default/send` |
| 필요한 것 | 카카오 디벨로퍼스 앱, 카카오 로그인 활성화, 동의항목 **카카오톡 메시지 전송(talk_message)** |
| 받는 사람 | 로그인한 **본인**의 나와의 채팅만 (다른 사람·단톡방 아님) |
| 메시지 | 텍스트 템플릿, 본문 최대 200자 |
| 액세스 토큰 | REST API 방식 6시간 |
| 리프레시 토큰 | 2달. 만료 1달 전부터 갱신 가능, 갱신하면 새 토큰이 나오고 이전 것은 폐기 |
| 할 수 없는 것 | 단톡방·개인 대화 **읽기**, 다른 사람에게 보내기(친구에게 보내기는 별도 조건) |

출처: 카카오 디벨로퍼스 [메시지 REST API](https://developers.kakao.com/docs/latest/ko/message/rest-api), [기본 템플릿](https://developers.kakao.com/docs/latest/ko/message-template/default), [카카오 로그인 REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api).
이 클라우드 세션에서는 카카오 서버 접속이 막혀 있어 문서 원문을 직접 열지 못했고, 검색 결과로 확인했다. **연결 전에 위 문서를 한 번 더 확인한다.**
특히 확인할 것: talk_message 동의항목을 일반 앱에서 설정할 수 있는지(비즈 앱 전환 필요 여부), link 필드 필수 여부.

## 이 저장소에서 확인된 것 / 안 된 것
- 확인됨: 초안 → 승인 → 전송 → 결과 기록 흐름, 중복 전송 방지, 승인 후 변경 시 승인 취소, 응답 없음 → '결과 불명확'(자동 재발송 안 함), 토큰 자동 갱신과 리프레시 토큰 교체, 토큰 파일 권한(본인만 읽기) — 가짜 카카오 서버로 테스트 11개 통과
- **아직 안 됨: 실제 카카오 서버로 보낸 적 없음.** 아래 연결을 마친 뒤 첫 전송으로 확인해야 한다.

## 연결 방법 (내 컴퓨터에서 1회, 약 15분)
1. [카카오 디벨로퍼스](https://developers.kakao.com) → 내 애플리케이션 → 앱 만들기 (이름 예: 업무정리 알림)
2. 앱 키에서 **REST API 키** 복사
3. 카카오 로그인 → 활성화 ON → Redirect URI에 `https://localhost:8765/kakao` 등록
4. 동의항목 → **카카오톡 메시지 전송(talk_message)** 설정
5. 보안 → Client Secret을 켰다면 그 값도 준비
6. 터미널에서 (키는 화면 기록·저장소에 남기지 않기):
   ```bash
   export KAKAO_REST_API_KEY=<REST API 키>
   python3 workdesk/tools/workdesk.py kakao-auth url
   ```
7. 나온 주소를 브라우저에서 열고 로그인·동의 → 주소창이 `https://localhost:8765/kakao?code=...`로 바뀜(페이지가 안 열려도 정상) → `code=` 뒤 값 복사
   ```bash
   python3 workdesk/tools/workdesk.py kakao-auth exchange --code <복사한 값>
   ```
   토큰은 `~/.config/workdesk/kakao_token.json`(본인만 읽기)에 저장된다. 저장소에는 들어가지 않는다.

## 보내기
```bash
python3 workdesk/tools/workdesk.py notify draft --by 이름          # 숫자만 담긴 초안 확인
python3 workdesk/tools/workdesk.py notify approve noti_001 --by 이름
python3 workdesk/tools/workdesk.py notify send noti_001 --by 이름
```
알림 예시 (업무 제목·사람 이름·원문은 넣지 않음):
```
[업무정리 데스크] 2026-11-12 현황
진행 3건 · 지연 1건 · 막힘 0건
기한 미정 1건 · 이번 주 완료 2건
자세한 내용은 업무정리 데스크에서 확인하세요.
```

## 결과가 불명확할 때
- `[결과 불명확]`이 나오면 **나와의 채팅을 먼저 확인**한다. 와 있으면 그대로 둔다.
- 안 왔으면 `notify send noti_001 --by 이름 --confirmed-not-received`.
- 프로그램이 전송 중 꺼졌으면 `notify-recover`로 상태를 '결과 불명확'으로 바꾼 뒤 같은 방법으로 확인한다.

## 클라우드 세션에서 쓰려면
이 세션의 네트워크는 `kapi.kakao.com`, `kauth.kakao.com`을 막고 있다. 클라우드에서 보내려면 환경 설정에 두 주소를 허용하고, 토큰을 매 세션 다시 넣어야 한다. **내 컴퓨터의 Claude Code에서 쓰는 것을 권장**한다.
