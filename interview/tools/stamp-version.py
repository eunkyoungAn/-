#!/usr/bin/env python3
"""면접 리허설 파일 주소에 버전 번호(?v=)를 붙인다.

휴대폰 브라우저는 예전에 받은 app.js 등을 한동안 다시 쓰기 때문에, 배포한 뒤에도 옛 화면이 보일 수 있다.
배포할 때마다 이 스크립트를 한 번 실행하면 주소가 바뀌어 새 파일을 받는다.
쓰는 법: python3 interview/tools/stamp-version.py            (날짜·시각으로 자동)
         python3 interview/tools/stamp-version.py 20261115a
"""
import pathlib, re, sys, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
ver = sys.argv[1] if len(sys.argv) > 1 else time.strftime('%Y%m%d%H%M')

# './이름.js' 또는 './vendor/.../이름.js' 뒤의 ?v=... 를 새 버전으로 바꾼다(없으면 붙인다).
JS_REF = re.compile(r"""(['"])(\./[\w./-]+\.(?:js|mjs))(?:\?v=[\w-]*)?\1""")
changed = []
for f in sorted(ROOT.glob('*.js')):
    s = f.read_text(encoding='utf-8')
    out = []
    for line in s.splitlines(keepends=True):
        if re.search(r"\bimport\b", line):
            line = JS_REF.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={ver}{m.group(1)}", line)
        out.append(line)
    n = ''.join(out)
    if n != s:
        f.write_text(n, encoding='utf-8')
        changed.append(f.name)

idx = ROOT / 'index.html'
s = idx.read_text(encoding='utf-8')
n = re.sub(r'(href="style\.css|src="app\.js)(?:\?v=[\w-]*)?"', lambda m: f'{m.group(1)}?v={ver}"', s)
if n != s:
    idx.write_text(n, encoding='utf-8')
    changed.append('index.html')
# 앱 안의 버전 번호와 version.json(새 버전 확인용)
app = ROOT / 'app.js'
a = app.read_text(encoding='utf-8')
a2 = re.sub(r"const APP_VERSION = '[\w-]*';", f"const APP_VERSION = '{ver}';", a)
if a2 != a:
    app.write_text(a2, encoding='utf-8')
    if 'app.js' not in changed: changed.append('app.js')
(ROOT / 'version.json').write_text('{"v": "%s"}\n' % ver, encoding='utf-8')
changed.append('version.json')
print(f'버전 {ver}:', ', '.join(changed) or '바뀐 파일 없음')
