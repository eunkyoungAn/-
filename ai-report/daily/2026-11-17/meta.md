status: not_sent       # 슬랙 전송이 승인 대기로 멈춤. 소식은 2026-11-18 리포트에 합쳐 발송
type: daily
collected_via: page    # 채널 /videos 페이지 + WebSearch 교차확인
window: 최근 24시간. 8개 채널, 미발송 새 영상 5개 → 3개 수록
trigger: AI 유튜브 데일리 → 슬랙 (평일 09:17)
delivery: 텍스트 메시지 + GitHub 포스터 링크(커밋 고정 주소)
slack_thread:
videos: ZKKP6jbdNbg, YLBR7qz6JPs, vVVdxMwPBuA, kMdHCyAnNHA, soNLXvgUqNY
notes: 영상 내용(음성·자막) 미확인. 제목만 확인된 영상 2개는 제외. 조코딩 영상 제목의 GPT-6.2 Astra는 공식 출시 미확인이라 소식으로 싣지 않음.
