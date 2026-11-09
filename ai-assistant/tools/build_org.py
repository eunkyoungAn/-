#!/usr/bin/env python3
"""AI비서 조직도 만들기.

ai-assistant/org.json 을 읽어
1) 적힌 에이전트·스킬·도구가 저장소에 실제로 있는지,
2) 저장소의 에이전트·스킬 중 조직도에 빠진 것이 없는지 검사한 뒤
3) ai-assistant/org.html (한 파일짜리 화면)을 만든다.

실행: python3 ai-assistant/tools/build_org.py          (검사 + 생성)
      python3 ai-assistant/tools/build_org.py --check  (검사만, 문제 있으면 종료코드 1)
"""
from __future__ import annotations

import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ORG = ROOT / "ai-assistant" / "org.json"
OUT = ROOT / "ai-assistant" / "org.html"

KIND_LABEL = {
    "person": "사람",
    "session": "메인 세션",
    "agent": "에이전트",
    "skill": "스킬",
    "plugin-skill": "플러그인 스킬",
    "tool": "도구",
}


def member_path(m: dict) -> Path | None:
    kind, mid = m["kind"], m["id"]
    if kind == "agent":
        return ROOT / ".claude" / "agents" / f"{mid}.md"
    if kind == "skill":
        return ROOT / ".claude" / "skills" / mid / "SKILL.md"
    if kind == "tool":
        return ROOT / mid
    if kind == "session":
        return ROOT / m.get("ref", "CLAUDE.md")
    return None  # person, plugin-skill: 저장소 밖


def check(org: dict) -> list[str]:
    problems = []
    members = [m for t in org["teams"] for m in t["members"] + ([t["lead"]] if t.get("lead") else [])]
    ids = [m["id"] for m in members]
    for dup in {i for i in ids if ids.count(i) > 1}:
        problems.append(f"조직도에 두 번 나옵니다: {dup}")
    for m in members + [org["chief"]]:
        if m["kind"] not in KIND_LABEL:
            problems.append(f"{m['id']}: 알 수 없는 종류 {m['kind']}")
            continue
        p = member_path(m)
        if p is not None and not p.exists():
            problems.append(f"{m['id']}: 저장소에 없습니다 ({p.relative_to(ROOT)})")
    listed = set(ids)
    for f in sorted((ROOT / ".claude" / "agents").glob("*.md")):
        if f.stem not in listed:
            problems.append(f"조직도에 빠진 에이전트: {f.stem}")
    for d in sorted((ROOT / ".claude" / "skills").iterdir()):
        if (d / "SKILL.md").exists() and d.name not in listed:
            problems.append(f"조직도에 빠진 스킬: {d.name}")
    return problems


def describe(path: Path | None) -> str:
    """에이전트·스킬 파일의 description 첫 줄을 가져온다(조직도 설명이 실제 파일과 어긋나지 않게)."""
    if not path or path.suffix != ".md" or not path.exists() or path.name == "CLAUDE.md":
        return ""
    for line in path.read_text(encoding="utf-8").splitlines()[:10]:
        if line.startswith("description:"):
            return line.split(":", 1)[1].strip()
    return ""


def enrich(org: dict) -> dict:
    for t in org["teams"]:
        for m in t["members"] + ([t["lead"]] if t.get("lead") else []):
            p = member_path(m)
            m["kind_label"] = KIND_LABEL[m["kind"]]
            m["path"] = str(p.relative_to(ROOT)) if p else None
            m["description"] = describe(p)
    org["counts"] = {
        "teams": len(org["teams"]),
        "agents": sum(1 for t in org["teams"] for m in t["members"] + ([t["lead"]] if t.get("lead") else []) if m["kind"] == "agent"),
        "leads": sum(1 for t in org["teams"] if t.get("lead")),
        "skills": sum(1 for t in org["teams"] for m in t["members"] if m["kind"] in {"skill", "plugin-skill"}),
        "tools": sum(1 for t in org["teams"] for m in t["members"] if m["kind"] == "tool"),
    }
    return org


TEMPLATE = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI비서 조직도</title>
<style>
:root{--bg:#f6f5f1;--surface:#fff;--ink:#1d1c1a;--muted:#6b6862;--line:#d9d5cc;--accent:#2f5d50;--accent-soft:#e3ece8;--warn:#8a4b12;--warn-soft:#f6ead9;--chip:#efede7}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#161615;--surface:#21201e;--ink:#ecebe7;--muted:#a19e97;--line:#3a3834;--accent:#8cc4b2;--accent-soft:#1f3530;--warn:#f0b878;--warn-soft:#3a2a17;--chip:#2c2b28}}
:root[data-theme="dark"]{--bg:#161615;--surface:#21201e;--ink:#ecebe7;--muted:#a19e97;--line:#3a3834;--accent:#8cc4b2;--accent-soft:#1f3530;--warn:#f0b878;--warn-soft:#3a2a17;--chip:#2c2b28}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;line-height:1.5}
main{max-width:1200px;margin:0 auto;padding:32px 16px 48px}
header h1{font-size:1.6rem;margin:0 0 4px;letter-spacing:-.01em}
header p{margin:0;color:var(--muted)}
.stats{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 8px}
.stat{background:var(--chip);border-radius:999px;padding:4px 12px;font-size:.85rem}
.std{margin:8px 0 28px;font-size:.9rem;color:var(--muted)}
.std b{color:var(--ink)}
.top{display:flex;flex-direction:column;align-items:center}
.node{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 18px;max-width:420px;width:100%;text-align:center}
.node.head{border:2px solid var(--accent)}
.node h2{font-size:1.05rem;margin:2px 0}
.node p{margin:2px 0;color:var(--muted);font-size:.9rem}
.kind{display:inline-block;font-size:.72rem;border:1px solid var(--line);border-radius:6px;padding:0 6px;color:var(--muted)}
.dispatch{margin:0 0 4px;width:100%;max-width:1200px}
.dispatch h2{font-size:.95rem;margin:0 0 8px;text-align:center}
.steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
@media (max-width:640px){.steps{grid-template-columns:repeat(2,1fr)}}
.steps li{margin:0;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:.82rem;color:var(--muted)}
.steps b{display:block;color:var(--ink);font-size:.9rem}
.steps .n{display:inline-block;background:var(--accent);color:var(--surface);border-radius:999px;width:20px;height:20px;line-height:20px;text-align:center;font-size:.75rem;margin-right:6px}
.dispatch .rf{text-align:center;font-size:.8rem;color:var(--muted);margin:8px 0 0}
.vline{width:2px;height:22px;background:var(--line)}
.teams{position:relative;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;padding-top:22px;border-top:2px solid var(--line);margin-top:0}
.team{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px;position:relative}
.team h3{margin:0;font-size:1.02rem}
.tag{display:inline-block;margin:4px 0 6px;font-size:.78rem;background:var(--accent-soft);color:var(--accent);border-radius:6px;padding:1px 8px;font-weight:600}
button.member.lead{margin:0 0 10px;padding:8px 10px;border:2px solid var(--accent);border-radius:10px;background:var(--accent-soft)}
button.member.lead .mname{font-size:.95rem}
button.member.lead .kind{background:var(--surface)}
.nolead{margin:0 0 10px;font-size:.8rem;color:var(--muted)}
.mission{margin:0 0 10px;color:var(--muted);font-size:.86rem}
ul{list-style:none;margin:0;padding:0}
li+li{margin-top:6px}
button.member{all:unset;box-sizing:border-box;display:block;width:100%;cursor:pointer;border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--bg)}
button.member:hover{border-color:var(--accent)}
button.member:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.mname{font-weight:600;font-size:.92rem}
.mrole{display:block;color:var(--muted);font-size:.82rem}
.detail{margin-top:6px;padding:8px 10px;border-left:3px solid var(--accent);background:var(--accent-soft);border-radius:0 8px 8px 0;font-size:.82rem}
.detail code{font-size:.78rem;word-break:break-all}
.detail .no{color:var(--warn)}
.approve{margin-top:12px;background:var(--warn-soft);border-radius:10px;padding:8px 10px;font-size:.82rem}
.approve b{color:var(--warn)}
.legend{margin-top:28px;font-size:.84rem;color:var(--muted)}
.legend p{margin:4px 0}
.theme{all:unset;float:right;cursor:pointer;border:1px solid var(--line);border-radius:999px;padding:4px 12px;font-size:.82rem}
.theme:focus-visible{outline:3px solid var(--accent)}
@media (max-width:640px){.teams{border-top:0;padding-top:0}header h1{font-size:1.35rem}}
</style>
</head>
<body>
<main>
<header>
<button class="theme" id="theme" type="button" aria-label="밝기 전환">밝게/어둡게</button>
<h1>__TITLE__</h1>
<p>대표가 일을 주면 대장이 팀에 나눠 맡기고, 정해진 규칙대로 해내도록 이끌어 결과를 합친다. · 기준일 __UPDATED__</p>
</header>
<div class="stats" id="stats"></div>
<p class="std">모든 팀 공통 기준: <b id="std"></b></p>
<section class="top" aria-label="지휘 계통">
  <div class="node head" id="head"></div>
  <div class="vline" aria-hidden="true"></div>
  <div class="node" id="chief"></div>
  <div class="vline" aria-hidden="true"></div>
  <div class="dispatch" id="dispatch"></div>
  <div class="vline" aria-hidden="true"></div>
</section>
<section class="teams" id="teams" aria-label="팀"></section>
<section class="legend">
<p><b>종류</b>: 에이전트 = 역할을 맡은 AI 팀원(<code>.claude/agents</code>) · 스킬 = 작업 매뉴얼(<code>.claude/skills</code>) · 플러그인 스킬 = 저장소 밖에 설치된 스킬 · 도구 = 규칙을 코드로 지키는 프로그램</p>
<p>이 화면은 조직 구성 지도입니다. 에이전트를 실행하거나 실시간 작업 상태를 보여주지 않습니다. 이름을 누르면 자세한 내용이 열립니다.</p>
<p>원본 데이터: <code>ai-assistant/org.json</code> → <code>python3 ai-assistant/tools/build_org.py</code>로 다시 만듭니다.</p>
</section>
</main>
<script>
const ORG = __DATA__;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const c = ORG.counts;
document.getElementById("stats").innerHTML =
  [`팀 ${c.teams}개`, `팀장 ${c.leads}명`, `에이전트 ${c.agents}명`, `스킬 ${c.skills}개`, `도구 ${c.tools}개`].map(t => `<span class="stat">${t}</span>`).join("");
document.getElementById("std").textContent = `${ORG.common_standard.name} (${ORG.common_standard.role})`;
const renderNode = (el, n, kind) => {
  document.getElementById(el).innerHTML =
    `<span class="kind">${kind}</span><h2>${esc(n.name)}</h2><p>${esc(n.role)}</p>` +
    (n.does?.length ? `<p>하는 일: ${n.does.map(esc).join(" · ")}</p>` : "") +
    (n.does_not?.length ? `<p>하지 않는 일: ${n.does_not.map(esc).join(" · ")}</p>` : "");
};
renderNode("head", ORG.head, "사람");
renderNode("chief", ORG.chief, "팀장 · 메인 세션 (Claude)");
const dp = ORG.dispatch;
document.getElementById("dispatch").innerHTML =
  `<h2>${esc(dp.title)}</h2><ol class="steps">${dp.steps.map((s, i) => `<li><b><span class="n">${i + 1}</span>${esc(s.name)}</b>${esc(s.text)}</li>`).join("")}</ol>` +
  `<p class="rf">자세한 규칙: <code>${esc(dp.rule_file)}</code></p>`;
document.getElementById("teams").innerHTML = ORG.teams.map((t, ti) => `
  <article class="team">
    <h3>${esc(t.name)}</h3><span class="tag">${esc(t.tag)}</span>
    <p class="mission">${esc(t.mission)}</p>
    ${t.lead ? `<button class="member lead" type="button" aria-expanded="false" aria-controls="l${ti}">
        <span class="kind">팀장</span> <span class="mname">${esc(t.lead.name)}</span>
        <span class="mrole">${esc(t.lead.role)}</span></button>
      <div class="detail" id="l${ti}" hidden>
        <div><code>${esc(t.lead.id)}</code></div>
        ${t.lead.description ? `<div>${esc(t.lead.description)}</div>` : ""}
        <div class="no">하지 않는 일: ${t.lead.does_not.map(esc).join(" · ")}</div>
        <div>파일: <code>${esc(t.lead.path)}</code></div>
      </div>` : `<p class="nolead">팀장 없음 · 대장이 직접 배정</p>`}
    <ul>${t.members.map((m, mi) => `
      <li><button class="member" type="button" aria-expanded="false" aria-controls="d${ti}_${mi}">
        <span class="kind">${esc(m.kind_label)}</span> <span class="mname">${esc(m.name)}</span>
        <span class="mrole">${esc(m.role)}</span></button>
        <div class="detail" id="d${ti}_${mi}" hidden>
          <div><code>${esc(m.id)}</code></div>
          ${m.description ? `<div>${esc(m.description)}</div>` : ""}
          ${m.does_not?.length ? `<div class="no">하지 않는 일: ${m.does_not.map(esc).join(" · ")}</div>` : ""}
          <div>${m.path ? `파일: <code>${esc(m.path)}</code>` : "저장소 밖(플러그인)에 설치됨"}</div>
        </div></li>`).join("")}
    </ul>
    ${t.approval_required ? `<div class="approve"><b>대표 승인 필요</b><br>${t.approval_required.map(esc).join("<br>")}</div>` : ""}
  </article>`).join("");
document.querySelectorAll("button.member").forEach(b => b.addEventListener("click", () => {
  const d = document.getElementById(b.getAttribute("aria-controls"));
  const open = b.getAttribute("aria-expanded") === "true";
  b.setAttribute("aria-expanded", String(!open)); d.hidden = open;
}));
const root = document.documentElement;
try { const s = localStorage.getItem("org-theme"); if (s) root.dataset.theme = s; } catch (e) {}
document.getElementById("theme").addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("org-theme", root.dataset.theme); } catch (e) {}
});
</script>
</body>
</html>
"""


def build(org: dict) -> str:
    data = json.dumps(enrich(org), ensure_ascii=False).replace("</", "<\\/")
    return (TEMPLATE.replace("__TITLE__", html.escape(org["title"]))
            .replace("__UPDATED__", html.escape(org["updated"]))
            .replace("__DATA__", data))


def main(argv: list[str]) -> int:
    org = json.loads(ORG.read_text(encoding="utf-8"))
    problems = check(org)
    if problems:
        print(f"[조직도 검사 실패] {len(problems)}건")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("[조직도 검사 통과] 적힌 에이전트·스킬·도구가 모두 저장소에 있고, 빠진 것도 없습니다.")
    if "--check" not in argv:
        OUT.write_text(build(org), encoding="utf-8")
        print(f"[생성] {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
