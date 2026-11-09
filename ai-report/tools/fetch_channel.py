#!/usr/bin/env python3
"""채널의 최신 영상 목록을 JSON으로 출력한다 (표준 라이브러리만 사용).

클라우드 환경(데이터센터 IP)에서는 RSS(/feeds/videos.xml)가 404, 영상 페이지(/watch)는 구글 봇 확인
페이지로 리다이렉트된다(2026-11-07 확인). 봇 확인은 우회하지 않는다. 그래서 정상 응답하는
채널 /videos 페이지(ytInitialData)만 파싱한다. 정확한 게시일·설명이 필요하면 YouTube Data API(Phase 4).
사용: python3 -I ai-report/tools/fetch_channel.py @anthropic-ai [N=10]
출력: [{channel, video_id, title, views, age(상대시간), age_hours(시간 환산), url}]
"""
import json, re, sys, urllib.request

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8"})
    return urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")


def json_after(html, marker):
    i = html.index(marker) + len(marker)
    return json.JSONDecoder().raw_decode(html[i:])[0]


UNIT_H = {"분": 1 / 60, "시간": 1, "일": 24, "주": 168, "개월": 720, "년": 8760,
          "minute": 1 / 60, "hour": 1, "day": 24, "week": 168, "month": 720, "year": 8760}


def age_hours(age):
    """'9시간 전', '1일 전', '3 days ago' → 시간(float). 알 수 없으면 None."""
    m = re.search(r"(\d+)\s*(분|시간|일|주|개월|년|minute|hour|day|week|month|year)", age or "")
    return float(m.group(1)) * UNIT_H[m.group(2)] if m else None


def list_videos(handle):
    base = handle if handle.startswith("http") else f"https://www.youtube.com/{handle}"
    data = json_after(get(base.rstrip("/") + "/videos"), "ytInitialData = ")
    found, seen = [], set()

    def walk(o):
        if isinstance(o, dict):
            if o.get("contentType") == "LOCKUP_CONTENT_TYPE_VIDEO" and o.get("contentId"):
                md = o.get("metadata", {}).get("lockupMetadataViewModel", {})
                parts = [p.get("text", {}).get("content", "")
                         for r in md.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
                         for p in r.get("metadataParts", [])]
                vid = o["contentId"]
                if vid not in seen:
                    seen.add(vid)
                    found.append({"video_id": vid, "title": md.get("title", {}).get("content"),
                                  "views": parts[-2] if len(parts) >= 2 else None,
                                  "age": parts[-1] if parts else None})
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(data)
    return found


if __name__ == "__main__":
    handle = sys.argv[1]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    vids = list_videos(handle)[:n]
    for v in vids:
        v["channel"] = handle
        v["age_hours"] = age_hours(v.get("age"))
        v["url"] = f"https://www.youtube.com/watch?v={v['video_id']}"
    print(json.dumps(vids, ensure_ascii=False, indent=1))
