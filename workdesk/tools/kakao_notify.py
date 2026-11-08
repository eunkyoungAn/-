"""카카오톡 '나에게 보내기' 알림 (업무정리 데스크 5단계).

- 받는 사람은 토큰 주인 본인의 '나와의 채팅'뿐이다. 다른 사람·채팅방으로 보내는 기능은 없다.
- 알림 내용은 최소 정보(처리 상태, 업무 수)만. 업무 제목·사람 이름·원문은 넣지 않는다.
- 흐름: draft → approved → sending → sent / failed / unknown
  승인 뒤 내용이 바뀌면 다시 승인해야 한다. 결과가 불명확(unknown)하면 확인 전 재발송하지 않는다.
- 토큰은 저장소 밖 파일(기본 ~/.config/workdesk/kakao_token.json)에 두고 화면·로그에 찍지 않는다.

공식 문서 (연결 전에 최신 내용 확인):
- 나에게 보내기: POST https://kapi.kakao.com/v2/api/talk/memo/default/send  (동의항목 talk_message)
- 토큰: POST https://kauth.kakao.com/oauth/token
"""
from __future__ import annotations

import datetime as dt
import json
import os
import socket
import stat
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

AUTH_HOST = "https://kauth.kakao.com"
API_HOST = "https://kapi.kakao.com"
MEMO_URL = API_HOST + "/v2/api/talk/memo/default/send"
TOKEN_URL = AUTH_HOST + "/oauth/token"
TEXT_LIMIT = 200  # 텍스트 템플릿 text 최대 길이(공식 문서 기준, 연결 전 재확인)


class NotifyError(Exception):
    pass


class TransportTimeout(Exception):
    """요청은 나갔을 수 있으나 응답을 받지 못함 → 결과 불명확."""


# ------------------------------------------------------------- HTTP

def http_post(url: str, data: dict, headers: dict, timeout: float = 10.0):
    """(status, json_body) 를 돌려준다. 연결 전 실패는 OSError, 응답 대기 중 끊김은 TransportTimeout."""
    body = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8", **headers})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode("utf-8") or "{}")
        except ValueError:
            payload = {}
        return e.code, payload
    except (socket.timeout, TimeoutError) as e:
        raise TransportTimeout(str(e))
    except urllib.error.URLError as e:
        if isinstance(e.reason, (socket.timeout, TimeoutError)):
            raise TransportTimeout(str(e.reason))
        raise OSError(f"연결 실패: {e.reason}")


# ------------------------------------------------------------- 설정·토큰

def token_path() -> Path:
    env = os.environ.get("WORKDESK_KAKAO_TOKEN_FILE")
    return Path(env) if env else Path.home() / ".config" / "workdesk" / "kakao_token.json"


def rest_api_key() -> str:
    key = os.environ.get("KAKAO_REST_API_KEY")
    if not key:
        raise NotifyError("환경변수 KAKAO_REST_API_KEY(카카오 디벨로퍼스 앱의 REST API 키)가 필요합니다.")
    return key


def save_token(tok: dict) -> None:
    p = token_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(tok, ensure_ascii=False, indent=2), encoding="utf-8")
    os.chmod(tmp, stat.S_IRUSR | stat.S_IWUSR)
    os.replace(tmp, p)


def load_token() -> dict:
    p = token_path()
    if not p.exists():
        raise NotifyError("카카오 토큰이 없습니다. 'workdesk.py kakao-auth url'부터 진행하세요.")
    return json.loads(p.read_text(encoding="utf-8"))


def _store_token_response(resp: dict, old: dict | None = None) -> dict:
    now = time.time()
    tok = dict(old or {})
    tok["access_token"] = resp["access_token"]
    tok["access_expires_at"] = now + int(resp.get("expires_in", 0))
    if resp.get("refresh_token"):  # 갱신 응답에 새 리프레시 토큰이 오면 반드시 교체
        tok["refresh_token"] = resp["refresh_token"]
        tok["refresh_expires_at"] = now + int(resp.get("refresh_token_expires_in", 0))
    if resp.get("scope"):
        tok["scope"] = resp["scope"]
    save_token(tok)
    return tok


def authorize_url(redirect_uri: str) -> str:
    q = urllib.parse.urlencode({"client_id": rest_api_key(), "redirect_uri": redirect_uri,
                                "response_type": "code", "scope": "talk_message"})
    return f"{AUTH_HOST}/oauth/authorize?{q}"


def exchange_code(code: str, redirect_uri: str, post=http_post) -> dict:
    data = {"grant_type": "authorization_code", "client_id": rest_api_key(),
            "redirect_uri": redirect_uri, "code": code}
    if os.environ.get("KAKAO_CLIENT_SECRET"):
        data["client_secret"] = os.environ["KAKAO_CLIENT_SECRET"]
    status, resp = post(TOKEN_URL, data, {})
    if status != 200 or "access_token" not in resp:
        raise NotifyError(f"토큰 발급 실패 (HTTP {status}, {resp.get('error_code') or resp.get('error')})")
    if "talk_message" not in str(resp.get("scope", "talk_message")):
        raise NotifyError("talk_message(카카오톡 메시지 전송) 동의가 없습니다. 동의항목 설정을 확인하세요.")
    return _store_token_response(resp)


def valid_access_token(post=http_post) -> str:
    tok = load_token()
    if tok.get("access_expires_at", 0) - time.time() > 300:
        return tok["access_token"]
    if not tok.get("refresh_token") or tok.get("refresh_expires_at", 0) <= time.time():
        raise NotifyError("리프레시 토큰이 만료되었습니다. kakao-auth로 다시 로그인하세요.")
    data = {"grant_type": "refresh_token", "client_id": rest_api_key(), "refresh_token": tok["refresh_token"]}
    if os.environ.get("KAKAO_CLIENT_SECRET"):
        data["client_secret"] = os.environ["KAKAO_CLIENT_SECRET"]
    status, resp = post(TOKEN_URL, data, {})
    if status != 200 or "access_token" not in resp:
        raise NotifyError(f"토큰 갱신 실패 (HTTP {status}, {resp.get('error_code') or resp.get('error')}). 다시 로그인이 필요할 수 있습니다.")
    return _store_token_response(resp, tok)["access_token"]


# ------------------------------------------------------------- 메시지

def build_text(summary: dict) -> str:
    """원장 숫자만으로 만든 최소 알림 문구. 이름·제목·원문은 넣지 않는다."""
    parts = [f"[업무정리 데스크] {summary['date']} 현황",
             f"진행 {summary['active']}건 · 지연 {summary['late']}건 · 막힘 {summary['blocked']}건",
             f"기한 미정 {summary['no_due']}건 · 이번 주 완료 {summary['done_week']}건",
             "자세한 내용은 업무정리 데스크에서 확인하세요."]
    text = "\n".join(parts)
    if len(text) > TEXT_LIMIT:
        raise NotifyError(f"알림 문구가 {TEXT_LIMIT}자를 넘습니다.")
    return text


def template_object(text: str) -> dict:
    link_url = os.environ.get("WORKDESK_NOTIFY_LINK", "")
    link = {"web_url": link_url, "mobile_web_url": link_url} if link_url else {}
    return {"object_type": "text", "text": text, "link": link}


def send_memo(text: str, post=http_post) -> tuple[str, dict]:
    """('sent'|'failed'|'unknown', 상세) 를 돌려준다. 예외를 밖으로 던지지 않는다."""
    try:
        token = valid_access_token(post)
    except NotifyError as e:
        return "failed", {"reason": str(e), "stage": "token"}
    except OSError as e:
        return "failed", {"reason": str(e), "stage": "token"}
    except TransportTimeout as e:
        return "failed", {"reason": f"토큰 갱신 응답 없음: {e}", "stage": "token"}
    data = {"template_object": json.dumps(template_object(text), ensure_ascii=False)}
    try:
        status, resp = post(MEMO_URL, data, {"Authorization": f"Bearer {token}"})
    except TransportTimeout as e:
        return "unknown", {"reason": f"응답 없음: {e}"}
    except OSError as e:
        return "failed", {"reason": str(e)}
    if status == 200 and resp.get("result_code") == 0:
        return "sent", {"http": status}
    return "failed", {"http": status, "code": resp.get("code"), "msg": resp.get("msg")}


def today_str(tz: str = "Asia/Seoul") -> str:
    from zoneinfo import ZoneInfo
    return dt.datetime.now(ZoneInfo(tz)).date().isoformat()
