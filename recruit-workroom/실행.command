#!/bin/bash
# macOS/Linux: 더블클릭 또는 ./실행.command
cd "$(dirname "$0")" || exit 1
command -v python3 >/dev/null || { echo "Python 3.10 이상을 설치하세요."; exit 1; }
[ -d .venv ] || python3 -m venv .venv || exit 1
.venv/bin/python -m pip install -q -r requirements.txt || exit 1
(sleep 2; (open http://127.0.0.1:8765 || xdg-open http://127.0.0.1:8765) >/dev/null 2>&1) &
echo "인재추천 워크룸 실행 중 - Ctrl+C 로 종료"
exec .venv/bin/python server.py
