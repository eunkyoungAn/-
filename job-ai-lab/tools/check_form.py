#!/usr/bin/env python3
"""사전 질문지가 서로 같은지 대조한다.

  올라가 있는 구글 폼(사이트의 "질문지 미리 보기")
  = sheet/FormSetup.gs 의 질문 목록
  = 화면에 나오는 질문 표와 코드(data.js)
  = 받는 파일(files/…AppsScript.txt)과 전체 압축 파일 안의 같은 파일

실행:  python3 job-ai-lab/tools/check_form.py
구글 폼을 읽으려면 인터넷이 필요하다. --offline 을 붙이면 폼 대조는 건너뛴다.
"""
import hashlib, json, os, re, sys, urllib.request, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build  # noqa: E402  (질문 표와 주소는 build.py 가 스크립트에서 읽어 온 값을 그대로 쓴다)

fails = []


def check(name, ok, detail=''):
    print(('일치   ' if ok else '불일치 ') + name + (f'  ← {detail}' if detail and not ok else ''))
    if not ok:
        fails.append(name)


def sha(data):
    return hashlib.sha256(data).hexdigest()[:16]


script = open(os.path.join(ROOT, 'sheet', 'FormSetup.gs'), 'rb').read()
script_fields = [(q[0], q[3], q[2] == '필수', q[1]) for q in build.FORM_QUESTIONS]   # (제목, 도움말, 필수, 형식)

# 1) 올라가 있는 구글 폼 ↔ 스크립트
if '--offline' not in sys.argv:
    req = urllib.request.Request(build.LINKS['form'], headers={'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ko'})
    html = urllib.request.urlopen(req, timeout=40).read().decode('utf-8')
    m = re.search(r'FB_PUBLIC_LOAD_DATA_ = (\[.*?\]);\s*</script>', html, re.S)
    assert m, '구글 폼의 질문 자료를 찾지 못했습니다'
    data = json.loads(m.group(1))
    info = data[1]
    kinds = {0: '단답형', 1: '장문형'}
    live = [(it[1], it[2] or '', bool(it[4][0][2]), kinds.get(it[3], str(it[3]))) for it in info[1] if it[4]]
    check('구글 폼 제목', data[3] == build.FORM_TITLE, data[3])
    check('구글 폼 안내문', info[0] == build.FORM_INTRO)
    check('구글 폼 제출 뒤 문구', info[2][0] == build.FORM_DONE, info[2][0])
    check(f'구글 폼 질문 수 {len(live)}개', len(live) == len(script_fields))
    for i, (a, b) in enumerate(zip(live, script_fields), 1):
        check(f'  질문 {i:>2} {b[0]}', a == b, f'폼 {a} / 스크립트 {b}')

# 2) 스크립트 ↔ 화면(data.js)
lab = json.loads(open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read().split('window.LAB = ', 1)[1].rstrip().rstrip(';'))
check('화면의 코드 = 스크립트 파일', lab['formMake']['code'].encode('utf-8') == script)
check('화면의 질문 표 = 스크립트 질문 목록', lab['formMake']['questions'] == build.FORM_QUESTIONS)
check('화면의 제목·안내문·제출 뒤 문구', (lab['formMake']['title'], lab['formMake']['intro'], lab['formMake']['done']) == (build.FORM_TITLE, build.FORM_INTRO, build.FORM_DONE))

# 3) 스크립트 ↔ 받는 파일 ↔ 압축 파일
out = os.path.join(ROOT, 'files')
copy = open(os.path.join(out, build.SCRIPT_FILE), 'rb').read()
check('받는 파일 = 스크립트 파일', copy == script, f'{sha(copy)} / {sha(script)}')
with zipfile.ZipFile(os.path.join(out, build.ZIP_NAME)) as z:
    names = z.namelist()
    inzip = z.read(f'실습 도구/{build.SCRIPT_FILE}')
    check('압축 파일 안의 스크립트 = 스크립트 파일', inzip == script)
    for grp in build.FILES:
        for base, _ in grp['items']:
            for ext in ('pdf', 'docx'):
                name = f'{grp["group"]}/{base}.{ext}'
                check(f'압축 파일 안의 {base}.{ext} = 받는 파일', name in names and z.read(name) == open(os.path.join(out, f'{base}.{ext}'), 'rb').read())

# 4) 질문 제목 ↔ 배포용 시트의 '구직자 정보' 열 제목 (시트를 바꾸면 이 목록도 함께 고친다)
SHEET_HEADS = ['분석 대상 ☑', '구직자 ID', '성명·별칭', '희망 직무', '경력 요약', '핵심 역량', '자격·훈련', '담당 상담자', '다음 점검일',
               '경험 근거', '필수 근무조건', '희망 소득', '취업 희망시점', '필요한 지원', '취업 후 정착 지원', '메모', '폼 응답 식별자']
missing = [q[0] for q in build.FORM_QUESTIONS if q[0] not in SHEET_HEADS]
check("질문 제목 12개가 모두 '구직자 정보' 열 제목에 있음", not missing, ', '.join(missing))

print('\n' + (f'불일치 {len(fails)}건' if fails else f'모두 일치 (스크립트 sha256 {sha(script)})'))
sys.exit(1 if fails else 0)
