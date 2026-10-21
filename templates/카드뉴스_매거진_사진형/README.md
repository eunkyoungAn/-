# 카드뉴스 매거진 사진형 (2026-10-21 추가)

첫 사용: 「꼭 AI 써야 해?」 카드뉴스 (`office/20261021_꼭AI써야해/`).
참고 이미지: 잡지 표지처럼 사진 전체 배경 + 아래쪽에 큰 흰 글씨 + 따옴표 문장은 더 크고 굵게 + 하단 가운데 매체명·페이지 점.

## 형식
- 1080×1350, 사진 전체 배경 + 아래쪽 어두운 그라데이션
- 제목: 일반 줄은 SemiBold, `“따옴표”` 줄은 Black으로 더 크게
- 포인트 색 민트 #7FE3C2 (`*강조*`), 글꼴 Pretendard(폴더 안 `fonts/`)
- 요소: kicker(왼쪽 위 알약 라벨), sub(굵은 부제), body(본문), stat(큰 숫자+설명), source(출처)
- layout: 기본(글 아래) / `small`(글자 작게) / `top`(글 위쪽)

## 만드는 법
1. 작업 폴더에 `cards.json` 작성 (예시: `office/20261021_꼭AI써야해/cards.json`)
2. 사진은 작업 폴더 `photos/01.jpg` … 에 넣는다. 사진이 없으면 `scene`(night·cafe·window·office·dawn·mint) + `prop`(laptop·cup·phone·chart) 분위기 배경이 대신 들어간다.
3. `NODE_PATH=$(npm root -g) node templates/카드뉴스_매거진_사진형/build.js <작업폴더 절대경로>` → `cards.html`, `png/card_01.png …`
- 사람 얼굴 사진은 본인 동의·저작권 확인 후에만 쓴다. 참고 이미지 원본(타 매체 사진)은 쓰지 않는다.
