#!/usr/bin/env python3
"""스스로 해 보기(문제 1·2)의 가상 자료, 회의 결과 문서, 예시 보고서, 정답 값을 만든다.

사용: python3 agent-lab/tools/make_selftest_data.py
같은 시드로 늘 같은 파일이 만들어진다. 정답은 tools/selftest_answers.json 에 쓰고,
build_data.py 가 읽어 화면의 '정답 보기'에 넣는다.

문제 1은 강사가 준 여행상품 실습 자료(고객 선호 데이터 + 분류기준 + 회의 결과 + 보고서)의
구성을 따라 새로 만든 가상 자료다. 문제 2는 같은 구성으로 키보드 판매 자료를 만든다.
"""
import json, os, random
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from docx import Document
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'files', '스스로해보기')
os.makedirs(OUT, exist_ok=True)
rnd = random.Random(20261115)
BOLD = Font(bold=True)
HEAD = PatternFill('solid', fgColor='E7E9EF')
EMPTY = PatternFill('solid', fgColor='FFF7E0')


def pick(weights):
    x = rnd.random() * sum(w for _, w in weights)
    for v, w in weights:
        x -= w
        if x <= 0:
            return v
    return weights[-1][0]


def write_sheet(ws, title, note, header, rows, empty_from):
    ws.append([title])
    ws.append([note])
    ws.append([])
    ws.append(header)
    ws['A1'].font = Font(bold=True, size=13)
    for c in ws[4]:
        c.font = BOLD
        c.fill = EMPTY if c.column >= empty_from else HEAD
    for r in rows:
        ws.append(r)
    for col in ws.columns:
        letter = col[3].column_letter
        ws.column_dimensions[letter].width = max(9, min(40, max(len(str(c.value or '')) for c in col[3:]) * 1.6))


def rule_sheet(ws, title, rows):
    ws.append([title])
    ws.append(['이 기준은 교육용 규칙입니다. 실제 분석 기준이나 시장 대표성을 의미하지 않습니다.'])
    ws.append([])
    ws.append(['분류항목', '값', '판단 기준', '우선 확인 열', '예시', '주의'])
    ws['A1'].font = Font(bold=True, size=13)
    for c in ws[4]:
        c.font = BOLD
        c.fill = HEAD
    for r in rows:
        ws.append(r)
    for letter, w in zip('ABCDEF', (14, 16, 46, 26, 22, 34)):
        ws.column_dimensions[letter].width = w
    for row in ws.iter_rows(min_row=5):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical='top')


def doc_base():
    d = Document()
    st = d.styles['Normal']
    st.font.name = '맑은 고딕'
    st.element.rPr.rFonts.set(qn('w:eastAsia'), '맑은 고딕')
    st.font.size = Pt(10.5)
    return d


def para(d, text, bold=False, size=None, color=None):
    p = d.add_paragraph()
    r = p.add_run(text)
    r.bold = bold
    if size:
        r.font.size = Pt(size)
    if color:
        r.font.color.rgb = RGBColor.from_string(color)
    p.paragraph_format.space_after = Pt(3)
    return p


def table(d, head, rows):
    t = d.add_table(rows=1, cols=len(head))
    t.style = 'Table Grid'
    for i, h in enumerate(head):
        t.rows[0].cells[i].text = h
        for r in t.rows[0].cells[i].paragraphs[0].runs:
            r.bold = True
    for row in rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = str(v)
    return t


def pct(a, b):
    return round(a / b * 100, 1)


# =====================================================================
# 문제 1 · 신규 여행상품 분석 (강사 자료의 구성을 따른 새 가상 자료)
# =====================================================================
PRODUCTS = {
    '후쿠오카 2박 3일': ('일본', (2, 3), ['미식', '쇼핑', '짧은 일정']),
    '타이베이 3박 4일': ('대만', (3, 4), ['미식', '문화', '자유시간']),
    '다낭 4박 5일': ('베트남', (4, 5), ['휴양', '웰니스', '리조트']),
}
REGION_GROUP = {'일본': '동북아', '대만': '동북아', '베트남': '동남아', '태국': '동남아', '제주': '국내', '유럽': '장거리'}
THEMES = {
    '일본': [('미식', 4), ('쇼핑', 3), ('짧은 일정', 2), ('온천', 2)],
    '대만': [('미식', 4), ('문화', 3), ('자유시간', 2), ('도시관광', 2)],
    '베트남': [('휴양', 4), ('웰니스', 2), ('리조트', 3), ('미식', 1)],
    '태국': [('휴양', 3), ('미식', 2), ('마사지', 2)],
    '제주': [('카페', 2), ('가족', 2), ('워케이션', 2), ('자연', 2)],
    '유럽': [('문화', 3), ('미술관', 2), ('도시관광', 2)],
}
DAYS = {'일본': [(2, 4), (3, 5), (4, 1)], '대만': [(3, 4), (4, 4), (5, 1)], '베트남': [(4, 4), (5, 4), (3, 1)],
        '태국': [(4, 3), (5, 2)], '제주': [(2, 3), (3, 3), (4, 1)], '유럽': [(7, 3), (8, 2), (10, 1)]}
COMMENTS = {
    '일본': ['주말에 짧게 다녀오고 맛집을 많이 가고 싶음', '쇼핑 시간이 넉넉했으면 함', '퇴근 후 출발해 짧게 다녀오고 싶음'],
    '대만': ['야시장과 현지 맛집을 가고 싶고 자유시간이 필요함', '근교 소도시와 카페를 함께 보고 싶음', '일정이 너무 빡빡하지 않았으면 함'],
    '베트남': ['리조트에서 아이와 쉬고 싶음', '마사지와 휴식 위주로 다녀오고 싶음', '수영장이 좋은 숙소를 원함'],
    '태국': ['휴양과 길거리 음식을 함께 즐기고 싶음', '마사지와 자유시간이 중요함'],
    '제주': ['평일에 업무를 하면서 머물고 싶음', '부모님과 이동이 편한 일정 선호', '렌터카 없이 갈 수 있는 코스를 원함'],
    '유럽': ['미술관과 역사 중심의 장거리 여행 희망', '여러 도시를 여유 있게 보고 싶음'],
}
PLAN = [('대만', 22), ('일본', 20), ('베트남', 18), ('제주', 8), ('태국', 6), ('유럽', 6)]
AGES = [('20대', 2), ('30대', 4), ('40대', 4), ('50대', 2), ('60대', 2)]
COMP = [('가족', 4), ('부부', 4), ('친구', 3), ('혼자', 2)]
DEPART = [('평일', 4), ('주말', 4), ('토요일 오전', 3), ('금요일 저녁', 1), ('연휴', 1)]
STAY = [('리조트', 4), ('4성급', 4), ('프리미엄', 3), ('3성급', 1), ('가성비', 1)]
IMPORTANT = ['짧은 이동', '아이 동반 편의', '자유시간', '숙소 품질', '안전', '맛집', '가격', '새벽 비행 제외']

cust = []
for region, n in PLAN:
    for _ in range(n):
        budget_base = {'유럽': 300, '베트남': 120, '태국': 120, '제주': 90}.get(region, 110)
        budget = max(50, int(round(rnd.gauss(budget_base, 30) / 5) * 5))
        cust.append({'region': region, 'age': pick(AGES), 'trips': rnd.choice([1, 2, 2, 3, 4, 4, 5, 6]),
                     'comp': pick(COMP), 'theme': pick(THEMES[region]), 'days': pick(DAYS[region]), 'budget': budget,
                     'depart': pick(DEPART), 'stay': pick(STAY), 'imp': rnd.choice(IMPORTANT),
                     'comment': rnd.choice(COMMENTS[region])})
rnd.shuffle(cust)
# 함정: 경계값 예산, 지역과 자유의견 충돌, 지역만 맞고 다른 조건 불일치
cust[5]['budget'] = 80
cust[17]['budget'] = 150
cust[40]['budget'] = 79
conflict_targets = [c for c in cust if c['region'] in ('일본', '대만')][:2]
conflict_targets[0]['comment'] = '사실은 유럽으로 열흘 정도 길게 가고 싶음'
conflict_targets[1]['comment'] = '이번에는 국내 제주에서 쉬는 쪽이 더 좋음'
for c, d, t in ((next(c for c in cust if c['region'] == '일본' and c not in conflict_targets), 6, '온천'),
                (next(c for c in cust if c['region'] == '베트남'), 8, '골프')):
    c['days'], c['theme'] = d, t
    c['comment'] = '골프 위주로 길게 머물고 싶음' if t == '골프' else '온천 료칸에서 오래 쉬고 싶음'
for i, c in enumerate(cust):
    c['id'] = f'T{i + 1:03d}'


def classify(c):
    group = REGION_GROUP[c['region']]
    grade = '실속' if c['budget'] < 80 else ('표준' if c['budget'] < 150 else '프리미엄')
    if c in conflict_targets:
        return group, grade, '검토대상', '[확인 필요] 선호지역과 자유의견이 충돌함'
    for name, (reg, (lo, hi), themes) in PRODUCTS.items():
        if c['region'] != reg:
            continue
        days_ok = lo <= c['days'] <= hi
        theme_ok = c['theme'] in themes or any(k in c['comment'] for k in ('맛집', '쇼핑', '짧게', '야시장', '자유시간', '리조트', '마사지', '휴식'))
        if days_ok or theme_ok:
            return group, grade, name, f"{reg}+{'일수' if days_ok else ''}{'·' if days_ok and theme_ok else ''}{'테마' if theme_ok else ''} 일치"
        return group, grade, '검토대상', f'{reg} 선호이나 일수·테마 조건 불일치'
    return group, grade, '검토대상', '현재 세 후보 지역이 아님'


res1 = [(c, *classify(c)) for c in cust]
wb = openpyxl.Workbook()
ws = wb.active
ws.title = '고객선호데이터'
write_sheet(ws, '가상 고객 선호 여행지 분석 데이터 (문제 1)',
            '교육용 가상자료 | 원본 열(A~L)은 수정하지 말고, 분류기준 시트를 참고해 빈 열(M~Q)을 채우세요.',
            ['고객ID', '연령대', '최근 2년 여행횟수', '동반유형', '선호지역', '선호테마', '희망일수', '1인예산(만원)', '출발선호', '숙소선호',
             '중요요소', '자유의견', '여행지군', '예산등급', '추천상품후보', '분류근거', '검토메모'],
            [[c['id'], c['age'], c['trips'], c['comp'], c['region'], c['theme'], c['days'], c['budget'], c['depart'], c['stay'],
              c['imp'], c['comment'], None, None, None, None, None] for c in cust], 13)
rule_sheet(wb.create_sheet('분류기준'), '고객 선호 데이터 분류기준 (문제 1)', [
    ['여행지군', '동북아', '선호지역이 일본 또는 대만', '선호지역', '일본→동북아', '지역명만으로 상품을 확정하지 않음'],
    ['여행지군', '동남아', '선호지역이 베트남 또는 태국', '선호지역', '베트남→동남아', '태국은 현재 후보 외 검토대상'],
    ['여행지군', '국내', '선호지역이 제주 등 국내', '선호지역', '제주→국내', '워케이션 수요는 별도 확인'],
    ['여행지군', '장거리', '선호지역이 유럽 등 장거리', '선호지역', '유럽→장거리', '현재 후보 외 검토대상'],
    ['예산등급', '실속', '1인예산 80만원 미만', '1인예산(만원)', '79→실속', '금액 단위는 만원'],
    ['예산등급', '표준', '1인예산 80만원 이상 150만원 미만', '1인예산(만원)', '80→표준', '경계값 80 포함, 150 미포함'],
    ['예산등급', '프리미엄', '1인예산 150만원 이상', '1인예산(만원)', '150→프리미엄', '장거리 여행도 같은 기준 적용'],
    ['추천상품후보', '후쿠오카 2박 3일', '선호지역 일본 + [희망일수 2~3일 또는 미식·쇼핑·짧은 일정 관련 테마·의견] 중 1개 이상', '선호지역, 희망일수, 선호테마, 자유의견', '일본·3일·맛집', '지역만 맞으면 검토대상'],
    ['추천상품후보', '타이베이 3박 4일', '선호지역 대만 + [희망일수 3~4일 또는 미식·문화·자유시간 관련 테마·의견] 중 1개 이상', '선호지역, 희망일수, 선호테마, 자유의견', '대만·4일·야시장', '지역만 맞으면 검토대상'],
    ['추천상품후보', '다낭 4박 5일', '선호지역 베트남 + [희망일수 4~5일 또는 휴양·웰니스·리조트 관련 테마·의견] 중 1개 이상', '선호지역, 희망일수, 선호테마, 자유의견', '베트남·5일·리조트', '지역만 맞으면 검토대상'],
    ['추천상품후보', '검토대상', '현재 세 후보와 조건이 부족하거나 다른 지역 선호', '전체 열', '유럽·8일·문화', '임의로 후보에 배정하지 않음'],
    ['공통', '[확인 필요]', '정보가 충돌하거나 우선순위를 결정할 수 없음', '전체 열', '지역은 일본, 자유의견은 장기 유럽', '추천상품후보는 검토대상, 분류근거와 검토메모에 이유 기록'],
])
F1_DATA = '문제1_가상데이터_고객선호여행지.xlsx'
wb.save(os.path.join(OUT, F1_DATA))

cnt = {}
for _, _, _, cand, _ in res1:
    cnt[cand] = cnt.get(cand, 0) + 1
order = ['타이베이 3박 4일', '후쿠오카 2박 3일', '다낭 4박 5일', '검토대상']
cand_rows = [[k, cnt.get(k, 0), pct(cnt.get(k, 0), len(cust))] for k in order]
grade = {}
for _, _, g, _, _ in res1:
    grade[g] = grade.get(g, 0) + 1
review_reason = {}
for _, _, _, cand, why in res1:
    if cand == '검토대상':
        key = '[확인 필요] 지역·의견 충돌' if why.startswith('[확인') else ('지역은 맞으나 조건 불일치' if '불일치' in why else '후보 외 지역')
        review_reason[key] = review_reason.get(key, 0) + 1
top = max(cand_rows[:3], key=lambda r: r[1])
ans1 = {
    'total': len(cust),
    'cand': cand_rows,
    'grade': [[g, grade.get(g, 0)] for g in ('실속', '표준', '프리미엄')],
    'boundary': [[c['id'], c['budget'], classify(c)[1]] for c in cust if c['budget'] in (79, 80, 150)],
    'conflict': [[c['id'], c['region'], c['comment']] for c in conflict_targets],
    'mismatch': [[c['id'], c['region'], c['days'], c['theme']] for c, _, _, cand, why in res1 if '불일치' in why],
    'reviewReason': [[k, v] for k, v in review_reason.items()],
    'top': top,
}

# 회의 결과 (문제 1)
d = doc_base()
para(d, '신규 여행상품 아이데이션 회의 결과 (팀장 보고용 1P)', True, 15)
para(d, '교육·실습용 가상 자료', color='6E6E76')
para(d, '1. 회의 목적·배경', True)
para(d, '• 2027년 1분기 파일럿 신규 여행상품 후보 압축 및 데이터 분석 기준 수립')
para(d, '• 짧은 일정·자유시간·뚜렷한 여행 목적 수요가 실제로 있는지 데이터로 확인 필요')
para(d, '2. 후보 상품', True)
table(d, ['상품', '대상', '차별점', '우려사항'], [
    ['후쿠오카 2박 3일', '30~40대 직장인', '짧은 일정·미식', '항공료 상승'],
    ['타이베이 3박 4일', '가족·친구·부부', '미식·근교 균형', '현지 운영기준 필요'],
    ['다낭 4박 5일', '가족·부부', '휴양·웰니스', '객실 확보·가격 변동'],
    ['제주 워케이션(보류)', '[확인 필요]', '국내 이동 편의', '수요 미검증'],
])
para(d, '3. 결정사항', True)
para(d, '• 1차 분석 대상: 후쿠오카·타이베이·다낭')
para(d, '• 고객 선호 데이터는 분류기준 시트대로 분류함')
para(d, '• 보고서에는 회의 의견과 데이터 결과를 구분해 적음')
para(d, '4. 실행항목', True)
para(d, '• 데이터 담당: 고객 데이터 분류 · 운영 담당: 현지 운영조건 확인 · 기획 담당: 상품별 차별점 정리 · 팀장 보고: 한 장 보고서 초안')
para(d, '5. 미결사항', True)
para(d, '• 파일럿 1순위 상품 미정')
para(d, '• 판매가·마진·항공/숙박 조건 미확정')
F1_MEET = '문제1_회의결과_여행상품.docx'
d.save(os.path.join(OUT, F1_MEET))

# 예시 보고서 (문제 1)
d = doc_base()
para(d, '2027년 1분기 신규 여행상품 파일럿 후보 분석 보고서', True, 15)
para(d, f'검산(사실): 전체 고객 {len(cust)}명, 추천상품후보 합계 {sum(r[1] for r in cand_rows)}명으로 일치. 교육·실습용 가상 자료.', color='6E6E76')
para(d, '① 핵심요약', True)
para(d, '[사실] ' + ', '.join(f'{r[0]} {r[1]}명({r[2]}%)' for r in cand_rows[:3]) + f', 검토대상 {cand_rows[3][1]}명({cand_rows[3][2]}%).')
para(d, f'[해석] {top[0]}가 파일럿 우선 검토 대상임. 다만 후보 간 차이가 크지 않아 운영조건 확인 뒤 확정함.')
para(d, '② 고객 선호 분석', True)
para(d, '[사실] 예산등급: ' + ', '.join(f'{g} {n}명' for g, n in ans1['grade']) + ' (기준 인원 ' + str(len(cust)) + '명).')
para(d, '[사실] 검토대상 ' + str(cand_rows[3][1]) + '명 중 ' + ', '.join(f'{k} {v}명' for k, v in ans1['reviewReason']) + '.')
para(d, '③ 회의 의견과 데이터의 일치점·차이', True)
para(d, '[사실] 회의 후보 3개가 모두 데이터상 상위 선호군에 포함됨.')
para(d, '[해석] 수요가 한 상품에 몰리지 않으므로 1순위 하나보다 순서를 정해 단계적으로 시험하는 편이 적절함 (제안).')
para(d, f'④ 파일럿 1순위: {top[0]}', True)
para(d, f'[근거] 데이터상 최다 수요 {top[1]}명({top[2]}%), 회의에서 대상 범위가 가장 넓다고 본 상품.')
para(d, '⑤ 4주 실행계획 (제안)', True)
para(d, '1주 데이터 세분화 → 2주 운영조건 검증 → 3주 상품 구성 → 4주 보고서 확정')
para(d, '⑥ 위험·추가 확인', True)
para(d, '판매가·마진·항공/숙박 조건 미확정 [확인 필요]. 지역과 의견이 충돌한 ' + str(len(conflict_targets)) + '명은 담당자가 직접 확인.')
para(d, '⑦ 데이터 한계', True)
para(d, f'교육·실습용 가상 자료이며 실제 시장 대표성 없음. 기준 인원 {len(cust)}명으로 작은 집단 해석에 주의.')
para(d, f'근거 위치: {F1_DATA}(고객선호데이터·분류기준 시트), {F1_MEET}(결정사항·미결사항)', color='6E6E76')
F1_EX = '문제1_예시보고서.docx'
d.save(os.path.join(OUT, F1_EX))

# =====================================================================
# 문제 2 · 키보드 판매량 (같은 구성의 새 자료)
# =====================================================================
KB = [  # 제품명, 유형, 배열, 연결, 단가(원), 판매 가중치, 평점 평균, 반품률
    ('슬림 오피스 K100', '멤브레인', '풀배열', '유선', 29000, 3, 3.6, 0.05),
    ('무선 텐키리스 K200', '펜타그래프', '텐키리스', '무선', 49000, 4, 4.1, 0.14),
    ('기계식 K300 87키', '기계식', '텐키리스', '유선', 89000, 4, 4.4, 0.04),
    ('기계식 무선 K400', '기계식', '풀배열', '무선', 159000, 2, 4.6, 0.03),
]
CH = [('자사몰', 3), ('오픈마켓', 5), ('오프라인', 2)]
CUS = [('개인', 7), ('학생', 2), ('기업', 1)]
REV = {
    '슬림 오피스 K100': ['가격 대비 무난함', '키 소리가 조용해 사무실에 맞음', '키감이 조금 물렁함'],
    '무선 텐키리스 K200': ['가볍고 휴대가 편함', '재택근무용으로 좋음', '연결이 가끔 끊김'],
    '기계식 K300 87키': ['타건감이 좋음', '게임할 때 반응이 빠름', '소리가 커서 사무실에는 애매함'],
    '기계식 무선 K400': ['마감이 고급스러움', '무선인데 지연이 없음', '가격이 부담됨'],
}
orders = []
for i in range(96):
    p = pick([(k, k[5]) for k in KB])
    name, kind, layout, conn, price, _, rate_mean, ret = p
    qty = pick([(1, 8), (2, 2), (3, 1)])
    disc = pick([(0, 5), (5, 2), (10, 2), (15, 1)])
    returned = 'Y' if rnd.random() < ret else 'N'
    rating = None if rnd.random() < 0.15 else max(1, min(5, round(rnd.gauss(rate_mean, 0.6))))
    orders.append([None, f'2026-{rnd.choice(["07", "08", "09"])}-{rnd.randint(1, 28):02d}', pick(CH), pick(CUS),
                   name, price, qty, disc, returned, rating if returned == 'N' else None, rnd.choice(REV[name])])
orders.sort(key=lambda r: r[1])
for i, r in enumerate(orders):
    r[0] = f'K{i + 1:03d}'
# 함정: 기업 대량 단건 주문, 할인율 표기 섞임, 제품명 표기 불일치, 수량 0, 중복 주문
orders[30][3], orders[30][4], orders[30][5], orders[30][6], orders[30][7], orders[30][8], orders[30][9] = '기업', '슬림 오피스 K100', 29000, 200, 20, 'N', None
orders[30][10] = '사무실 일괄 교체용'
orders[61][3], orders[61][4], orders[61][5], orders[61][6], orders[61][7], orders[61][8] = '기업', '무선 텐키리스 K200', 49000, 60, 15, 'N'
orders[61][10] = '신규 입사자 지급용'
for k in (8, 44, 77):
    orders[k][7] = f'{orders[k][7]}%' if orders[k][7] else '0%'
for k in (22, 70):
    orders[k][7] = round(orders[k][7] / 100, 2) if isinstance(orders[k][7], int) else orders[k][7]
k200 = [r for r in orders if r[4] == '무선 텐키리스 K200']
k200[2][4] = '무선텐키리스 K200'
k200[9][4] = 'K200 무선 텐키리스'
orders[50][6] = 0
orders[50][10] = '주문 취소 문의'
dup = orders[40][:]
orders.insert(41, dup)

wb = openpyxl.Workbook()
ws = wb.active
ws.title = '판매데이터'
write_sheet(ws, '가상 키보드 판매 데이터 2026년 3분기 (문제 2)',
            '교육용 가상자료 | 원본 열(A~K)은 수정하지 말고, 분류기준 시트를 참고해 빈 열(L~P)을 채우세요.',
            ['주문ID', '주문일', '판매채널', '고객유형', '제품명', '단가(원)', '수량', '할인율', '반품여부', '리뷰평점', '리뷰요약',
             '순매출(원)', '가격대', '순위반영', '분류근거', '검토메모'],
            [r + [None, None, None, None, None] for r in orders], 12)
rule_sheet(wb.create_sheet('분류기준'), '키보드 판매 데이터 분류기준 (문제 2)', [
    ['정리', '제품명 통일', '같은 제품의 다른 표기는 공식 제품명 하나로 통일', '제품명', '무선텐키리스 K200→무선 텐키리스 K200', '공식 제품명은 제품목록 표의 4개'],
    ['정리', '할인율 통일', '할인율을 % 숫자로 통일 (10, 10%, 0.1은 모두 10)', '할인율', '0.1→10', '1보다 작은 소수는 백분율로 바꿈'],
    ['정리', '중복 주문', '같은 주문ID가 두 번 이상이면 한 건만 남김', '주문ID', 'K041 두 줄→한 줄', '남긴 기준을 검토메모에 적음'],
    ['순매출(원)', '계산식', '단가 × 수량 × (1 - 할인율/100). 반품여부 Y는 0', '단가, 수량, 할인율, 반품여부', '89,000×1×(1-0.1)=80,100', '원 단위, 반올림하지 않음'],
    ['가격대', '실속', '단가 3만원 미만', '단가(원)', '29,000→실속', ''],
    ['가격대', '표준', '단가 3만원 이상 10만원 미만', '단가(원)', '49,000→표준', '경계값 3만 포함, 10만 미포함'],
    ['가격대', '프리미엄', '단가 10만원 이상', '단가(원)', '159,000→프리미엄', ''],
    ['순위반영', 'Y', '반품이 아니고 수량 1~49인 일반 주문', '수량, 반품여부', '수량 2→Y', ''],
    ['순위반영', 'N', '반품, 수량 0, 수량 50 이상 대량 단건 주문', '수량, 반품여부', '수량 200→N', '대량 단건은 매출에는 넣되 판매량 순위에서는 뺌. 검토메모에 이유'],
    ['주력후보 판정', '주력 후보', '순위반영 판매수량 상위 3개 안 + 평균 리뷰평점 4.0 이상 + 반품률 10% 미만', '제품별 집계', '', '평점은 점수가 있는 주문만 평균'],
    ['주력후보 판정', '개선 필요', '평균 리뷰평점 4.0 미만 또는 반품률 10% 이상', '제품별 집계', '', '반품률 = 반품 건수 ÷ 수량 0을 뺀 주문 건수'],
    ['공통', '[확인 필요]', '수량 0, 표기를 판단할 수 없는 값 등', '전체 열', '수량 0→주문 취소 여부 확인', '임의로 고치지 않고 검토메모에 이유 기록'],
])
F2_DATA = '문제2_가상데이터_키보드판매.xlsx'
wb.save(os.path.join(OUT, F2_DATA))

# 정답 계산
NAMES = {k[0]: k for k in KB}
ALIAS = {'무선텐키리스 K200': '무선 텐키리스 K200', 'K200 무선 텐키리스': '무선 텐키리스 K200'}


def disc_pct(v):
    if isinstance(v, str):
        return float(v.rstrip('%'))
    if isinstance(v, float) and v < 1:
        return round(v * 100)
    return v


seen, uniq = set(), []
for r in orders:
    if r[0] in seen:
        continue
    seen.add(r[0])
    uniq.append(r)
net_total, per = 0, {k[0]: {'orders': 0, 'qty_rank': 0, 'net': 0, 'ret': 0, 'rated': [], 'valid_orders': 0} for k in KB}
bulk, zero = [], []
for r in uniq:
    name = ALIAS.get(r[4], r[4])
    d = disc_pct(r[7])
    net = 0 if r[8] == 'Y' else r[5] * r[6] * (100 - d) / 100
    net = int(net) if float(net).is_integer() else net
    net_total += net
    s = per[name]
    s['orders'] += 1
    s['net'] += net
    if r[6] == 0:
        zero.append(r[0])
        continue
    s['valid_orders'] += 1
    if r[8] == 'Y':
        s['ret'] += 1
        continue
    if r[6] >= 50:
        bulk.append([r[0], name, r[6]])
        continue
    s['qty_rank'] += r[6]
    if r[9] is not None:
        s['rated'].append(r[9])
prod_rows = []
for k in KB:
    s = per[k[0]]
    avg = round(sum(s['rated']) / len(s['rated']), 2)
    prod_rows.append({'name': k[0], 'price': k[4], 'orders': s['orders'], 'qty': s['qty_rank'], 'net': s['net'],
                      'ratedN': len(s['rated']), 'ratedSum': sum(s['rated']), 'avg': avg,
                      'retN': s['ret'], 'base': s['valid_orders'], 'retRate': pct(s['ret'], s['valid_orders'])})
rank = sorted(prod_rows, key=lambda x: -x['qty'])
for i, p in enumerate(rank):
    p['rank'] = i + 1
    p['verdict'] = '개선 필요' if (p['avg'] < 4.0 or p['retRate'] >= 10) else ('주력 후보' if p['rank'] <= 3 else '대상 아님')
main = [p for p in rank if p['verdict'] == '주력 후보']
ans2 = {
    'rows': len(orders), 'unique': len(uniq), 'dup': dup[0], 'returns': sum(1 for r in uniq if r[8] == 'Y'),
    'netTotal': net_total, 'bulk': bulk, 'zero': zero,
    'alias': [[k, v] for k, v in ALIAS.items()],
    'discMixed': [r[0] for r in uniq if isinstance(r[7], str) or (isinstance(r[7], float) and r[7] < 1)],
    'products': rank, 'main': [p['name'] for p in main],
}
assert main, 'no main candidate'

# 회의 결과 (문제 2)
d = doc_base()
para(d, '키보드 판매 전략 회의 결과 (팀장 보고용 1P)', True, 15)
para(d, '교육·실습용 가상 자료', color='6E6E76')
para(d, '1. 회의 목적·배경', True)
para(d, '• 2027년 1분기 주력 키보드 1종 선정 (광고비와 재고를 집중할 제품)')
para(d, '• 3분기 판매 데이터로 "많이 팔린 제품"과 "계속 팔릴 제품"을 구분해 보기로 함')
para(d, '2. 후보 제품', True)
table(d, ['제품', '단가', '회의 의견', '우려사항'], [
    ['무선 텐키리스 K200', '49,000원', '재택 수요로 판매가 꾸준함', '연결 끊김 리뷰, 반품'],
    ['기계식 K300 87키', '89,000원', '리뷰 평가가 좋음', '사무실용으로는 소음'],
    ['기계식 무선 K400', '159,000원', '마진이 가장 높음', '가격 부담, 판매량 적음'],
    ['슬림 오피스 K100(보류)', '29,000원', '판매량 1위라는 의견', '[확인 필요] 기업 대량 주문 영향'],
])
para(d, '3. 결정사항', True)
para(d, '• 판매량 순위는 반품과 대량 단건 주문(50개 이상)을 빼고 계산함')
para(d, '• 데이터는 분류기준 시트대로 정리함')
para(d, '• 보고서에는 회의 의견과 데이터 결과를 구분해 적음')
para(d, '4. 실행항목', True)
para(d, '• 데이터 담당: 판매 데이터 정리 · 상품 담당: 제품별 마진 확인 · 물류 담당: 1분기 재고 확인 · 팀장 보고: 한 장 보고서 초안')
para(d, '5. 미결사항', True)
para(d, '• 주력 제품 1종 미정')
para(d, '• 제품별 마진, 1분기 재고, 광고 예산 미확정')
F2_MEET = '문제2_회의결과_키보드판매.docx'
d.save(os.path.join(OUT, F2_MEET))

# 예시 보고서 (문제 2)
first = main[0]
d = doc_base()
para(d, '2027년 1분기 주력 키보드 선정 보고서', True, 15)
para(d, f'검산(사실): 원본 {len(orders)}행 중 중복 1행 제외 {len(uniq)}건. 반품 {ans2["returns"]}건은 순매출 0원 처리. 교육·실습용 가상 자료.', color='6E6E76')
para(d, '① 핵심요약', True)
para(d, f'[사실] 순위 반영 판매수량 1위는 {rank[0]["name"]} {rank[0]["qty"]}개. 대량 단건 주문 {len(bulk)}건은 순위에서 제외함.')
para(d, f'[해석] 주력 후보는 {", ".join(p["name"] for p in main)}. 1순위로 {first["name"]}를 제안함 (제안).')
para(d, '② 제품별 판매 분석', True)
table(d, ['제품', '순위 판매수량', '평균평점(평가 건수)', '반품률(기준 건수)', '판정'],
      [[p['name'], f"{p['qty']}개", f"{p['avg']}점 ({p['ratedN']}건)", f"{p['retRate']}% ({p['retN']}/{p['base']}건)", p['verdict']] for p in rank])
para(d, '③ 회의 의견과 데이터의 일치점·차이', True)
k100 = next(p for p in rank if p['name'] == '슬림 오피스 K100')
para(d, f'[사실] "K100 판매량 1위" 의견은 대량 단건 주문을 넣었을 때의 결과임. 빼면 K100은 {k100["rank"]}위.')
para(d, '[해석] 평점이 높은 제품이 반품률도 낮게 나타났으나, 이 자료로는 평점이 반품을 줄였는지 구분할 수 없음.')
para(d, f'④ 주력 1순위: {first["name"]}', True)
para(d, f'[근거] 순위 반영 판매수량 {first["qty"]}개({first["rank"]}위), 평균평점 {first["avg"]}점, 반품률 {first["retRate"]}%.')
para(d, '⑤ 실행계획 (제안)', True)
para(d, '1주 마진 확인 → 2주 재고 확인 → 3주 광고안 작성 → 4주 주력 제품 확정')
para(d, '⑥ 위험·추가 확인', True)
para(d, f'제품별 마진·재고·광고 예산 미확정 [확인 필요]. 수량 0 주문({", ".join(zero)})은 취소 여부 확인.')
para(d, '⑦ 데이터 한계', True)
para(d, '교육·실습용 가상 자료. 한 분기 판매만 보았으며 계절 영향은 이 자료로 알 수 없음.')
para(d, f'근거 위치: {F2_DATA}(판매데이터·분류기준 시트), {F2_MEET}(결정사항·미결사항)', color='6E6E76')
F2_EX = '문제2_예시보고서.docx'
d.save(os.path.join(OUT, F2_EX))

json.dump({'q1': {'files': [F1_DATA, F1_MEET, F1_EX], **ans1}, 'q2': {'files': [F2_DATA, F2_MEET, F2_EX], **ans2}},
          open(os.path.join(ROOT, 'tools', 'selftest_answers.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps({'q1': ans1, 'q2': {k: v for k, v in ans2.items()}}, ensure_ascii=False, indent=1, default=str))
