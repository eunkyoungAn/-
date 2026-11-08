import random
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
random.seed(20261108)
OUT = "/home/user/-/실무실습/실습1_데이터분석_한장보고서/가상데이터_교육과정운영실적.xlsx"
F = "Arial"
courses = [  # 과정명, 분야, 운영형태, 정원, 신청자, 1인당운영비(만원), 수료확률, 취업확률, 만족 평균
    ("AI 오피스 실무", "AI·디지털", "대면", 30, 92, 48, 0.90, 0.55, 4.6),
    ("데이터 분석 기초", "AI·디지털", "온라인", 30, 78, 32, 0.68, 0.50, 4.1),
    ("노코드 업무 자동화", "AI·디지털", "혼합", 30, 64, 52, 0.86, 0.68, 4.7),
    ("디지털 마케팅", "마케팅", "온라인", 30, 51, 30, 0.70, 0.40, 4.0),
    ("사무회계 실무", "사무", "대면", 30, 38, 45, 0.92, 0.60, 4.3),
    ("취업 이미지 메이킹", "취업지원", "대면", 30, 33, 28, 0.95, 0.35, 4.5),
    ("경력 재설계 집단상담", "취업지원", "혼합", 30, 34, 25, 0.93, 0.42, 4.4),
    ("온라인 쇼핑몰 창업", "창업", "온라인", 30, 41, 35, 0.66, 0.30, 3.9),
]
ages = ["20대", "30대", "40대", "50대 이상"]
gaps = ["없음", "1년 미만", "1~3년", "3~5년", "5년 이상"]
gap_pen = {"없음": 0.10, "1년 미만": 0.05, "1~3년": 0.0, "3~5년": -0.08, "5년 이상": -0.18}
age_w = {"AI·디지털": [15, 35, 35, 15], "마케팅": [25, 40, 25, 10], "사무": [10, 30, 40, 20], "취업지원": [10, 25, 40, 25], "창업": [15, 35, 35, 15]}
rows = []
n = 0
for c in courses:
    name, field, mode, cap, appl, cost, p_fin, p_job, sat = c
    for _ in range(cap):
        n += 1
        age = random.choices(ages, age_w[field])[0]
        gap = random.choices(gaps, [15, 15, 25, 20, 25])[0]
        fin = random.random() < p_fin
        job = fin and random.random() < max(0.05, p_job + gap_pen[gap] + (-0.08 if age == "50대 이상" else 0))
        s = None
        if fin:
            s = round(min(5, max(1, random.gauss(sat, 0.45))))
        rows.append([f"S{n:03d}", name, age, gap, "수료" if fin else "중도탈락", s, "취업·창업" if job else ("미취업" if fin else "-")])

wb = Workbook()
thin = Side(style="thin", color="D9DEE5")
hdr_fill = PatternFill("solid", fgColor="E8EDFF")
inp = Font(name=F, color="0000FF")
def header(ws, r, vals):
    for j, v in enumerate(vals, 1):
        c = ws.cell(r, j, v); c.font = Font(name=F, bold=True); c.fill = hdr_fill
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True); c.border = Border(bottom=thin)

ws = wb.active; ws.title = "안내"
info = [("자료명", "B여성센터 2026년 상반기 직업교육과정 운영 실적 (가상)"),
        ("자료 성격", "교육·실습용으로 만든 가상 자료입니다. 실제 기관·인물과 관계없습니다."),
        ("조사 대상", "8개 과정 수강생 240명 (과정별 30명)"),
        ("기간", "2026년 1월~6월 운영, 취업·창업은 수료 후 3개월 추적"),
        ("시트 구성", "과정별실적(요약·수식) / 수강생(원자료) / 정의"),
        ("사용법", "원자료(수강생)를 바꾸면 과정별실적이 자동 계산됩니다. 파란 글씨는 입력값입니다.")]
ws["A1"] = "가상 실습 자료 안내"; ws["A1"].font = Font(name=F, bold=True, size=14)
for i, (k, v) in enumerate(info, 3):
    ws.cell(i, 1, k).font = Font(name=F, bold=True); ws.cell(i, 2, v).font = Font(name=F)
ws.column_dimensions["A"].width = 14; ws.column_dimensions["B"].width = 80

# 수강생 원자료
wr = wb.create_sheet("수강생")
header(wr, 1, ["수강생ID", "과정명", "연령대", "경력단절 기간", "수료 여부", "만족도(5점)", "취업·창업 여부"])
for i, r in enumerate(rows, 2):
    for j, v in enumerate(r, 1):
        wr.cell(i, j, v).font = Font(name=F)
for j, w in enumerate([10, 22, 10, 14, 11, 12, 14], 1):
    wr.column_dimensions[get_column_letter(j)].width = w
wr.freeze_panes = "A2"; wr.auto_filter.ref = f"A1:G{len(rows)+1}"
last = len(rows) + 1
R = lambda col: f"수강생!${col}$2:${col}${last}"

# 과정별 실적 (수식)
ws2 = wb.create_sheet("과정별실적", 1)
cols = ["과정명", "분야", "운영형태", "모집정원", "신청자 수", "경쟁률", "수강 인원", "수료 인원", "수료율", "평균 만족도", "취업·창업 인원", "취업·창업률(수료자 기준)", "1인당 운영비(만원)", "수료자 1인당 비용(만원)"]
header(ws2, 1, cols)
for i, c in enumerate(courses, 2):
    name, field, mode, cap, appl, cost = c[:6]
    ws2.cell(i, 1, name); ws2.cell(i, 2, field); ws2.cell(i, 3, mode)
    ws2.cell(i, 4, cap).font = inp; ws2.cell(i, 5, appl).font = inp
    ws2.cell(i, 6, f"=E{i}/D{i}")
    ws2.cell(i, 7, f'=COUNTIFS({R("B")},A{i})')
    ws2.cell(i, 8, f'=COUNTIFS({R("B")},A{i},{R("E")},"수료")')
    ws2.cell(i, 9, f"=IF(G{i}=0,0,H{i}/G{i})")
    ws2.cell(i, 10, f'=IFERROR(AVERAGEIFS({R("F")},{R("B")},A{i},{R("E")},"수료"),0)')
    ws2.cell(i, 11, f'=COUNTIFS({R("B")},A{i},{R("G")},"취업·창업")')
    ws2.cell(i, 12, f"=IF(H{i}=0,0,K{i}/H{i})")
    ws2.cell(i, 13, cost).font = inp
    ws2.cell(i, 14, f"=IF(H{i}=0,0,M{i}*G{i}/H{i})")
t = len(courses) + 2
ws2.cell(t, 1, "전체").font = Font(name=F, bold=True)
for col in "DEGHK":
    ws2[f"{col}{t}"] = f"=SUM({col}2:{col}{t-1})"
ws2[f"F{t}"] = f"=E{t}/D{t}"; ws2[f"I{t}"] = f"=H{t}/G{t}"
ws2[f"J{t}"] = f'=AVERAGEIFS({R("F")},{R("E")},"수료")'; ws2[f"L{t}"] = f"=K{t}/H{t}"
ws2[f"M{t}"] = f"=SUMPRODUCT(M2:M{t-1},G2:G{t-1})/G{t}"; ws2[f"N{t}"] = f"=SUMPRODUCT(M2:M{t-1},G2:G{t-1})/H{t}"
for r in range(2, t + 1):
    for j in range(1, 15):
        c = ws2.cell(r, j)
        if c.font.color is None or c.font.color.rgb != "000000FF":
            c.font = Font(name=F, bold=(r == t))
    ws2.cell(r, 6).number_format = '0.0"배"'
    for j in (9, 12): ws2.cell(r, j).number_format = "0.0%"
    ws2.cell(r, 10).number_format = "0.00"
    for j in (13, 14): ws2.cell(r, j).number_format = "#,##0.0"
for j, w in enumerate([22, 11, 10, 9, 9, 9, 9, 9, 9, 10, 11, 14, 12, 14], 1):
    ws2.column_dimensions[get_column_letter(j)].width = w
ws2.row_dimensions[1].height = 34
ws2.cell(t + 2, 1, "파란 글씨: 입력값(가상). 나머지는 수강생 시트에서 계산되는 수식.").font = Font(name=F, italic=True, color="6B7684")

wd = wb.create_sheet("정의")
defs = [("경쟁률", "신청자 수 / 모집정원"), ("수료율", "수료 인원 / 수강 인원"), ("평균 만족도", "수료자의 5점 만족도 평균 (중도탈락자는 응답 없음)"),
        ("취업·창업률", "수료 후 3개월 내 취업·창업 인원 / 수료 인원"), ("수료자 1인당 비용", "1인당 운영비 × 수강 인원 / 수료 인원 (중도탈락을 반영한 실질 비용)")]
header(wd, 1, ["지표", "계산 방법"])
for i, (k, v) in enumerate(defs, 2):
    wd.cell(i, 1, k).font = Font(name=F, bold=True); wd.cell(i, 2, v).font = Font(name=F)
wd.column_dimensions["A"].width = 18; wd.column_dimensions["B"].width = 70
wb.save(OUT); print(OUT, len(rows))
