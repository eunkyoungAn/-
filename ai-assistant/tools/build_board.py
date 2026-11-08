#!/usr/bin/env python3
"""대장 지시판 페이지 만들기.

ai-assistant/org.json 의 팀·팀장 정보를 board.template.html 에 넣어
ai-assistant/dispatch-board.html (Artifact로 게시하는 원본)을 만든다.

실행: python3 ai-assistant/tools/build_board.py
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ORG = ROOT / "ai-assistant" / "org.json"
TEMPLATE = ROOT / "ai-assistant" / "tools" / "board.template.html"
OUT = ROOT / "ai-assistant" / "dispatch-board.html"


def teams(org: dict) -> list[dict]:
    items = [{"id": "auto", "name": "대장이 판단", "tag": "말머리 자동", "lead": None, "sub": "팀을 모르겠을 때"}]
    for t in org["teams"]:
        lead = t.get("lead")
        items.append({
            "id": t["id"],
            "name": t["name"],
            "tag": t["tag"],
            "lead": lead["name"] if lead else None,
            "sub": "팀장 없음 · 대장이 직접 배정",
        })
    return items


def main() -> None:
    org = json.loads(ORG.read_text(encoding="utf-8"))
    data = json.dumps(teams(org), ensure_ascii=False).replace("</", "<\\/")
    OUT.write_text(TEMPLATE.read_text(encoding="utf-8").replace("__TEAMS__", data), encoding="utf-8")
    print(f"[생성] {OUT.relative_to(ROOT)} (팀 {len(org['teams'])}개)")


if __name__ == "__main__":
    main()
