"""조직도가 저장소의 실제 에이전트·스킬과 맞는지 검사한다."""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import build_org  # noqa: E402


class OrgTests(unittest.TestCase):
    def org(self):
        return json.loads(build_org.ORG.read_text(encoding="utf-8"))

    def test_org_matches_repository(self):
        self.assertEqual(build_org.check(self.org()), [])

    def test_missing_member_detected(self):
        org = self.org()
        org["teams"][0]["members"].append({"id": "no-such-agent", "name": "x", "kind": "agent", "role": "x"})
        self.assertTrue(any("no-such-agent" in p for p in build_org.check(org)))

    def test_unlisted_agent_detected(self):
        org = self.org()
        org["teams"] = [t for t in org["teams"] if t["id"] != "workdesk"]
        self.assertTrue(any("work-extractor" in p for p in build_org.check(org)))

    def test_html_is_up_to_date(self):
        self.assertEqual(build_org.OUT.read_text(encoding="utf-8"), build_org.build(self.org()),
                         "org.json이 바뀌었습니다. python3 ai-assistant/tools/build_org.py 로 다시 만드세요.")

    def test_script_close_tag_escaped(self):
        org = self.org()
        org["teams"][0]["mission"] = "</script><b>x"
        self.assertNotIn("</script><b>", build_org.build(org).split("const ORG = ")[1].split(";\n")[0])
