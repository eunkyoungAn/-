"""업무정리 데스크 원장 도구 테스트 (계획서 11장 시나리오 중 도구가 책임지는 것).

실행: python3 -m unittest discover -s workdesk/tests -v
가상 데이터만 쓰고, 임시 폴더에 원장을 만든다.
"""
import contextlib
import copy
import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import workdesk  # noqa: E402

SAMPLES = ROOT / "samples"
EXAMPLE = ROOT / "runs" / "example" / "candidates.json"


def run(*argv):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = workdesk.main(list(argv))
    return code, out.getvalue() + err.getvalue()


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        os.environ["WORKDESK_DATA"] = self.tmp.name
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        os.environ.pop("WORKDESK_DATA", None)
        self.tmp.cleanup()

    def write(self, name, text):
        p = self.dir / name
        p.write_text(text, encoding="utf-8")
        return p

    def ingest_sample(self):
        code, out = run("ingest", str(SAMPLES / "운영팀_대화_가상.txt"), "--by", "t")
        self.assertEqual(code, 0, out)

    def example(self):
        return json.loads(EXAMPLE.read_text(encoding="utf-8"))

    def save(self, doc, name="c.json"):
        p = self.dir / name
        p.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        return str(p)

    def tasks(self):
        return workdesk.read_json(self.dir / "tasks.json", [])


class IngestTests(Base):
    def test_pc_txt_ids_lines_and_multiline(self):
        self.ingest_sample()
        msgs = workdesk.load_messages("src_001")
        self.assertEqual(len(msgs), 11)
        m2 = msgs[1]
        self.assertEqual((m2["message_id"], m2["line_start"], m2["speaker"]), ("msg_0002", 6, "박지은"))
        self.assertEqual(m2["sent_at"], "2026-11-03T09:14:00+09:00")
        last = msgs[-1]
        self.assertEqual((last["line_start"], last["line_end"]), (16, 17))

    def test_pm_conversion(self):
        self.ingest_sample()
        self.assertTrue(workdesk.load_messages("src_001")[4]["sent_at"].startswith("2026-11-03T14:15"))

    def test_mobile_txt(self):
        p = self.write("m.txt", "2026년 11월 3일 오전 12:05, 홍길동 : 자정 메시지\n2026년 11월 3일 오후 12:30, 김철수 : 점심\n둘째 줄\n")
        code, out = run("ingest", str(p), "--by", "t")
        self.assertEqual(code, 0, out)
        msgs = workdesk.load_messages("src_001")
        self.assertEqual(msgs[0]["sent_at"], "2026-11-03T00:05:00+09:00")
        self.assertEqual(msgs[1]["sent_at"], "2026-11-03T12:30:00+09:00")
        self.assertEqual((msgs[1]["line_start"], msgs[1]["line_end"]), (2, 3))

    def test_csv_multiline_line_ranges(self):
        code, out = run("ingest", str(SAMPLES / "교육팀_대화_가상.csv"), "--by", "t")
        self.assertEqual(code, 0, out)
        msgs = workdesk.load_messages("src_001")
        self.assertEqual([(m["line_start"], m["line_end"]) for m in msgs], [(2, 2), (3, 3), (4, 5)])

    def test_memo_has_no_timestamps_warning(self):
        code, out = run("ingest", str(SAMPLES / "운영회의_메모_가상.md"), "--by", "t")
        self.assertEqual(code, 0)
        self.assertIn("시각 정보가 없습니다", out)

    def test_duplicate_file_not_reimported(self):
        self.ingest_sample()
        code, out = run("ingest", str(SAMPLES / "운영팀_대화_가상.txt"), "--by", "t")
        self.assertEqual(code, 0)
        self.assertIn("[중복]", out)
        self.assertEqual(len(workdesk.read_json(self.dir / "sources.json", [])), 1)

    def test_partial_overlap_warning(self):
        self.ingest_sample()
        text = (SAMPLES / "운영팀_대화_가상.txt").read_text(encoding="utf-8")
        p = self.write("part.txt", "\n".join(text.splitlines()[4:9]) + "\n추가 줄\n")
        code, out = run("ingest", str(p), "--by", "t")
        self.assertEqual(code, 0, out)
        self.assertIn("겹치는 메시지", out)

    def test_broken_csv_is_error(self):
        p = self.write("bad.csv", "Name,Text\n가,나\n")
        code, out = run("ingest", str(p), "--by", "t")
        self.assertEqual(code, 2)
        self.assertIn("Date, User, Message", out)
        self.assertFalse((self.dir / "sources.json").exists())

    def test_unsupported_extension(self):
        p = self.write("x.pdf", "x")
        code, out = run("ingest", str(p), "--by", "t")
        self.assertEqual(code, 2)

    def test_original_file_untouched(self):
        src = SAMPLES / "운영팀_대화_가상.txt"
        before = src.read_bytes()
        self.ingest_sample()
        self.assertEqual(src.read_bytes(), before)


class ValidateTests(Base):
    def setUp(self):
        super().setUp()
        self.ingest_sample()

    def errors(self, doc):
        return workdesk.validate_candidates(doc)

    def test_example_passes(self):
        self.assertEqual(self.errors(self.example()), [])

    def test_missing_evidence(self):
        d = self.example()
        d["candidates"][0]["evidence"] = []
        self.assertTrue(any("근거" in e for e in self.errors(d)))

    def test_fake_message_id(self):
        d = self.example()
        d["candidates"][0]["evidence"][0]["message_id"] = "msg_9999"
        self.assertTrue(any("원문에 없는 근거" in e for e in self.errors(d)))

    def test_wrong_line_range(self):
        d = self.example()
        d["candidates"][0]["evidence"][0]["line_start"] = 99
        self.assertTrue(any("줄 범위" in e for e in self.errors(d)))

    def test_invented_owner_rejected(self):
        d = self.example()
        d["candidates"][0]["proposed_owner"] = "홍길동"
        self.assertTrue(any("근거 원문에 보이지" in e for e in self.errors(d)))

    def test_speaker_counts_as_explicit_owner(self):
        d = self.example()  # cand_003: 김지훈이 "제가 올릴게요"
        self.assertFalse(any("cand_003" in e for e in self.errors(d)))

    def test_ambiguous_due_must_be_null_with_question(self):
        d = self.example()
        c = d["candidates"][1]
        c["due_basis"], c["questions"] = "ambiguous", []
        errs = self.errors(d)
        self.assertTrue(any("null이어야" in e for e in errs))
        self.assertTrue(any("확인 질문" in e for e in errs))

    def test_inferred_due_needs_timestamp(self):
        code, _ = run("ingest", str(SAMPLES / "운영회의_메모_가상.md"), "--by", "t")
        d = {"source_ids": ["src_002"], "run": {}, "summary": [], "decisions": [], "candidates": [{
            "candidate_id": "c1", "title": "홍보물 시안", "proposed_owner": None, "owner_basis": "unknown",
            "proposed_due_at": "2026-11-13", "due_basis": "inferred", "timezone": "Asia/Seoul",
            "evidence": [{"source_id": "src_002", "message_id": "msg_0003", "line_start": 3, "line_end": 3}],
            "questions": ["디자인 담당이 누구인가요?"], "status": "needs_review", "version": 1}]}
        self.assertTrue(any("시각이 없어" in e for e in self.errors(d)))

    def test_status_must_be_needs_review(self):
        d = self.example()
        d["candidates"][0]["status"] = "approved"
        self.assertTrue(any("needs_review" in e for e in self.errors(d)))

    def test_duplicate_candidate_id(self):
        d = self.example()
        d["candidates"].append(copy.deepcopy(d["candidates"][0]))
        self.assertTrue(any("중복" in e for e in self.errors(d)))

    def test_bad_json_file(self):
        p = self.write("bad.json", "{not json")
        code, out = run("validate", str(p))
        self.assertEqual(code, 2)
        self.assertIn("JSON 형식 오류", out)


class ApprovalTests(Base):
    def setUp(self):
        super().setUp()
        self.ingest_sample()
        self.file = self.save(self.example())

    def test_approve_creates_task_and_is_idempotent(self):
        self.assertEqual(run("approve", self.file, "cand_001", "--by", "t")[0], 0)
        code, out = run("approve", self.file, "cand_001", "--by", "t")
        self.assertIn("[중복]", out)
        self.assertEqual(len(self.tasks()), 1)
        self.assertEqual(len(workdesk.read_json(self.dir / "approvals.json", [])), 1)

    def test_inferred_due_requires_confirmation(self):
        code, out = run("approve", self.file, "cand_002", "--by", "t")
        self.assertEqual(code, 2)
        self.assertIn("추정값", out)
        self.assertEqual(run("approve", self.file, "cand_002", "--by", "t", "--due", "2026-11-13")[0], 0)

    def test_no_due_requires_explicit_flag(self):
        self.assertEqual(run("approve", self.file, "cand_004", "--by", "t")[0], 2)
        self.assertEqual(run("approve", self.file, "cand_004", "--by", "t", "--allow-no-due")[0], 0)

    def test_changed_content_after_approval_needs_new_approval(self):
        run("approve", self.file, "cand_001", "--by", "t")
        d = self.example()
        d["candidates"][0]["title"] = "바뀐 제목"
        changed = self.save(d, "c2.json")
        code, out = run("approve", changed, "cand_001", "--by", "t")
        self.assertEqual(code, 2)
        self.assertIn("update", out)
        self.assertEqual(self.tasks()[0]["title"], "월간 재고 집계표 초안 작성")

    def test_invalid_file_cannot_be_approved(self):
        d = self.example()
        d["candidates"][0]["evidence"] = []
        code, _ = run("approve", self.save(d, "bad.json"), "cand_001", "--by", "t")
        self.assertEqual(code, 2)
        self.assertEqual(self.tasks(), [])

    def test_unknown_owner_cannot_be_approved_without_owner(self):
        d = self.example()
        c = d["candidates"][0]
        c["proposed_owner"], c["owner_basis"] = None, "unknown"
        f = self.save(d, "u.json")
        self.assertEqual(run("approve", f, "cand_001", "--by", "t")[0], 2)
        self.assertEqual(run("approve", f, "cand_001", "--by", "t", "--owner", "김민수")[0], 0)

    def test_audit_written(self):
        run("approve", self.file, "cand_001", "--by", "t")
        lines = (self.dir / "audit.jsonl").read_text(encoding="utf-8").splitlines()
        self.assertEqual([json.loads(x)["action"] for x in lines], ["ingest", "approve"])


class StatusAndReportTests(Base):
    def setUp(self):
        super().setUp()
        self.ingest_sample()
        f = self.save(self.example())
        run("approve", f, "cand_001", "--by", "t")
        run("approve", f, "cand_003", "--by", "t", "--due", "2026-11-06")

    def test_done_requires_evidence_and_valid_transition(self):
        self.assertEqual(run("status", "task_001", "done", "--by", "t")[0], 2)  # todo→done 불가
        run("status", "task_001", "doing", "--by", "t")
        self.assertEqual(run("status", "task_001", "done", "--by", "t")[0], 2)  # 근거 없음
        self.assertEqual(run("status", "task_001", "done", "--by", "t", "--evidence", "파일")[0], 0)
        self.assertEqual(run("status", "task_001", "doing", "--by", "t")[0], 2)  # done 이후 변경 불가

    def test_blocked_requires_note(self):
        self.assertEqual(run("status", "task_001", "blocked", "--by", "t")[0], 2)

    def test_update_requires_reason(self):
        self.assertEqual(run("update", "task_001", "--by", "t", "--due", "2026-11-12")[0], 2)
        self.assertEqual(run("update", "task_001", "--by", "t", "--due", "2026-11-12", "--reason", "확인")[0], 0)

    def test_report_only_confirmed_tasks(self):
        text = workdesk.build_report(workdesk.dt.date(2026, 11, 10))
        self.assertIn("task_002 보도자료 초안 업로드", text)  # 11/6 기한 경과 → 지연
        self.assertIn("지연 1건", text)
        self.assertNotIn("협력기관", text)  # 승인 안 된 cand_002는 보고하지 않음

    def test_report_done_this_week_with_evidence(self):
        run("status", "task_001", "doing", "--by", "t")
        run("status", "task_001", "done", "--by", "t", "--evidence", "드라이브/집계표.xlsx")
        today = workdesk.dt.date.today()
        text = workdesk.build_report(today)
        self.assertIn("완료 근거: 드라이브/집계표.xlsx", text)


if __name__ == "__main__":
    unittest.main()


class ProjectGroupingTests(Base):
    def test_project_from_source_and_grouped_report(self):
        code, out = run("ingest", str(SAMPLES / "운영팀_대화_가상.txt"), "--by", "t", "--project", "A센터 운영")
        self.assertIn("A센터 운영", out)
        f = self.save(self.example())
        run("approve", f, "cand_001", "--by", "t")
        run("approve", f, "cand_003", "--by", "t", "--due", "2026-11-06", "--project", "B대학 캠프")
        tasks = self.tasks()
        self.assertEqual([t["project"] for t in tasks], ["A센터 운영", "B대학 캠프"])
        text = workdesk.build_report(workdesk.dt.date(2026, 11, 10))
        self.assertIn("## A센터 운영", text)
        self.assertIn("## B대학 캠프", text)
        self.assertIn("[지연] 보도자료 초안 업로드", text)
        self.assertLess(text.index("## A센터 운영"), text.index("## B대학 캠프"))

    def test_candidate_project_validated_and_updatable(self):
        self.ingest_sample()
        d = self.example()
        d["candidates"][0]["project"] = ""
        self.assertTrue(any("project" in e for e in workdesk.validate_candidates(d)))
        d["candidates"][0]["project"] = "C기관"
        f = self.save(d)
        run("approve", f, "cand_001", "--by", "t")
        self.assertEqual(self.tasks()[0]["project"], "C기관")
        self.assertEqual(run("update", "task_001", "--by", "t", "--project", "D기관", "--reason", "기관 정정")[0], 0)
        self.assertEqual(self.tasks()[0]["project"], "D기관")

    def test_flat_report_without_projects(self):
        self.ingest_sample()
        run("approve", self.save(self.example()), "cand_001", "--by", "t")
        text = workdesk.build_report(workdesk.dt.date(2026, 11, 10))
        self.assertIn("## 진행 중", text)
