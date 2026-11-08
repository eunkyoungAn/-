"""카카오 '나와의 채팅' 알림 테스트. 실제 카카오 서버에 접속하지 않고 가짜 응답으로 확인한다."""
import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_workdesk import Base, run  # noqa: E402
import kakao_notify as kn  # noqa: E402
import workdesk  # noqa: E402


class FakeKakao:
    def __init__(self, memo_result="ok"):
        self.memo_result = memo_result
        self.calls = []

    def __call__(self, url, data, headers, timeout=10.0):
        self.calls.append((url, data, headers))
        if url == kn.TOKEN_URL:
            if data["grant_type"] == "refresh_token":
                return 200, {"access_token": "new_access", "expires_in": 21599,
                             "refresh_token": "new_refresh", "refresh_token_expires_in": 5183999}
            return 200, {"access_token": "acc", "expires_in": 21599, "refresh_token": "ref",
                         "refresh_token_expires_in": 5183999, "scope": "talk_message"}
        if self.memo_result == "ok":
            return 200, {"result_code": 0}
        if self.memo_result == "timeout":
            raise kn.TransportTimeout("read timed out")
        return 401, {"code": -401, "msg": "this access token does not exist"}


class NotifyTests(Base):
    def setUp(self):
        super().setUp()
        os.environ["WORKDESK_KAKAO_TOKEN_FILE"] = str(self.dir / "kakao_token.json")
        os.environ["KAKAO_REST_API_KEY"] = "test_rest_key"
        kn.save_token({"access_token": "acc", "access_expires_at": time.time() + 3600,
                       "refresh_token": "ref", "refresh_expires_at": time.time() + 86400 * 50})
        self.fake = FakeKakao()
        self._orig = kn.http_post
        kn.http_post = self.fake
        self.ingest_sample()
        f = self.save(self.example())
        run("approve", f, "cand_001", "--by", "t")

    def tearDown(self):
        kn.http_post = self._orig
        os.environ.pop("WORKDESK_KAKAO_TOKEN_FILE", None)
        os.environ.pop("KAKAO_REST_API_KEY", None)
        super().tearDown()

    def notes(self):
        return workdesk.read_json(self.dir / "notifications.json", [])

    def memo_calls(self):
        return [c for c in self.fake.calls if c[0] == kn.MEMO_URL]

    def test_draft_contains_only_counts(self):
        code, out = run("notify", "draft", "--by", "t", "--date", "2026-11-12")
        self.assertEqual(code, 0, out)
        text = self.notes()[0]["text"]
        self.assertIn("지연 1건", text)  # 11/11 기한 경과
        for private in ("김민수", "재고", "집계표", "박지은"):
            self.assertNotIn(private, text)
        self.assertLessEqual(len(text), kn.TEXT_LIMIT)

    def test_cannot_send_without_approval(self):
        run("notify", "draft", "--by", "t")
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertEqual(code, 2)
        self.assertEqual(self.memo_calls(), [])

    def test_approved_send_once(self):
        run("notify", "draft", "--by", "t")
        run("notify", "approve", "noti_001", "--by", "t")
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertEqual(code, 0, out)
        self.assertEqual(self.notes()[0]["status"], "sent")
        url, data, headers = self.memo_calls()[0]
        self.assertEqual(headers["Authorization"], "Bearer acc")
        self.assertEqual(json.loads(data["template_object"])["object_type"], "text")
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertIn("[중복]", out)
        self.assertEqual(len(self.memo_calls()), 1)

    def test_changed_after_approval_invalidates(self):
        run("notify", "draft", "--by", "t")
        run("notify", "approve", "noti_001", "--by", "t")
        items = self.notes()
        items[0]["text"] += " 추가"
        workdesk.write_json(self.dir / "notifications.json", items)
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertEqual(code, 2)
        self.assertIn("다시 승인", out)
        self.assertEqual(self.notes()[0]["status"], "draft")
        self.assertEqual(self.memo_calls(), [])

    def test_timeout_is_unknown_and_no_auto_resend(self):
        self.fake.memo_result = "timeout"
        run("notify", "draft", "--by", "t")
        run("notify", "approve", "noti_001", "--by", "t")
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertEqual(self.notes()[0]["status"], "unknown")
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertEqual(code, 2)
        self.assertEqual(len(self.memo_calls()), 1)
        self.fake.memo_result = "ok"
        code, out = run("notify", "send", "noti_001", "--by", "t", "--confirmed-not-received")
        self.assertEqual(code, 0, out)
        self.assertEqual(len(self.memo_calls()), 2)

    def test_auth_error_is_failed(self):
        self.fake.memo_result = "401"
        run("notify", "draft", "--by", "t")
        run("notify", "approve", "noti_001", "--by", "t")
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertEqual(code, 1)
        self.assertEqual(self.notes()[0]["status"], "failed")

    def test_expired_access_token_refreshes_and_rotates_refresh_token(self):
        tok = kn.load_token()
        tok["access_expires_at"] = time.time() - 10
        kn.save_token(tok)
        run("notify", "draft", "--by", "t")
        run("notify", "approve", "noti_001", "--by", "t")
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertEqual(code, 0, out)
        tok = kn.load_token()
        self.assertEqual((tok["access_token"], tok["refresh_token"]), ("new_access", "new_refresh"))
        self.assertEqual(self.memo_calls()[0][2]["Authorization"], "Bearer new_access")

    def test_expired_refresh_token_fails_without_sending(self):
        kn.save_token({"access_token": "x", "access_expires_at": 0, "refresh_token": "r", "refresh_expires_at": 0})
        run("notify", "draft", "--by", "t")
        run("notify", "approve", "noti_001", "--by", "t")
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertEqual(self.notes()[0]["status"], "failed")
        self.assertEqual(self.memo_calls(), [])

    def test_stuck_sending_recovers_to_unknown(self):
        run("notify", "draft", "--by", "t")
        run("notify", "approve", "noti_001", "--by", "t")
        items = self.notes()
        items[0]["status"] = "sending"
        workdesk.write_json(self.dir / "notifications.json", items)
        self.assertEqual(run("notify", "send", "noti_001", "--by", "t")[0], 2)
        run("notify-recover")
        self.assertEqual(self.notes()[0]["status"], "unknown")
        self.assertEqual(self.memo_calls(), [])

    def test_token_file_private_and_not_printed(self):
        mode = os.stat(kn.token_path()).st_mode & 0o777
        self.assertEqual(mode, 0o600)
        run("notify", "draft", "--by", "t")
        run("notify", "approve", "noti_001", "--by", "t")
        code, out = run("notify", "send", "noti_001", "--by", "t")
        self.assertNotIn("acc", out.replace("access", ""))
        log = (self.dir / "notifications.json").read_text(encoding="utf-8")
        self.assertNotIn('"acc"', log)

    def test_auth_url_and_exchange(self):
        url = kn.authorize_url("https://localhost:8765/kakao")
        self.assertIn("scope=talk_message", url)
        self.assertIn("client_id=test_rest_key", url)
        tok = kn.exchange_code("code123", "https://localhost:8765/kakao", post=self.fake)
        self.assertEqual(tok["access_token"], "acc")
