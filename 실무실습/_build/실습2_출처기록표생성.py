from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
F = "Arial"; OUT = "/home/user/-/실무실습/실습2_데이터리서치/출처기록표.xlsx"
wb = Workbook(); ws = wb.active; ws.title = "출처기록"
cols = ["번호", "조사 질문", "핵심 수치·주장", "출처 기관", "자료명", "발행일", "링크", "원문 직접 확인", "교차 확인 출처", "신뢰도", "보고서 사용", "비고"]
widths = [6, 26, 34, 16, 30, 11, 30, 12, 26, 9, 10, 28]
hf = PatternFill("solid", fgColor="E8EDFF"); thin = Side(style="thin", color="D9DEE5")
for j, (c, w) in enumerate(zip(cols, widths), 1):
    x = ws.cell(1, j, c); x.font = Font(name=F, bold=True); x.fill = hf; x.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True); x.border = Border(bottom=thin)
    ws.column_dimensions[get_column_letter(j)].width = w
ex = [1, "직장인은 생성형 AI를 얼마나 쓰는가", "직장인 1,000명 중 71.3%가 AI 플랫폼 사용 중", "나우앤서베이", "직장인의 AI 활용 실태와 인식 조사", "2025-05-23", "[원문 링크 입력]", "N", "[다른 조사로 교차 확인]", "중", "보류", "예시 행: 강사 1회차 교안 인용. 원문 확인 전이라 '보류'"]
ex_font = Font(name=F, italic=True, color="6B7684")
for j, v in enumerate(ex, 1):
    c = ws.cell(2, j, v); c.font = ex_font; c.alignment = Alignment(wrap_text=True, vertical="top")
for r in range(3, 32):
    ws.cell(r, 1, r - 1).font = Font(name=F)
    for j in range(2, 13):
        ws.cell(r, j).font = Font(name=F, color="0000FF"); ws.cell(r, j).alignment = Alignment(wrap_text=True, vertical="top")
for col, opts in (("H", '"Y,N"'), ("J", '"상,중,하"'), ("K", '"사용,보류,제외"')):
    dv = DataValidation(type="list", formula1=opts, allow_blank=True); ws.add_data_validation(dv); dv.add(f"{col}2:{col}31")
ws.freeze_panes = "C2"
sm = wb.create_sheet("요약")
sm["A1"] = "기록 현황 (2행 예시 제외)"; sm["A1"].font = Font(name=F, bold=True, size=13)
rows = [("기록한 출처 수", '=COUNTA(출처기록!C3:C31)'), ("원문 직접 확인(Y)", '=COUNTIF(출처기록!H3:H31,"Y")'),
        ("교차 확인한 출처", '=COUNTIFS(출처기록!I3:I31,"<>",出처X)'), ("보고서에 사용", '=COUNTIF(출처기록!K3:K31,"사용")'),
        ("사용인데 원문 미확인 (0이어야 함)", '=COUNTIFS(출처기록!K3:K31,"사용",출처기록!H3:H31,"N")')]
rows[2] = ("교차 확인 칸을 채운 출처", '=SUMPRODUCT((출처기록!I3:I31<>"")*(LEFT(출처기록!I3:I31,1)<>"["))')
for i, (k, f) in enumerate(rows, 3):
    sm.cell(i, 1, k).font = Font(name=F); sm.cell(i, 2, f).font = Font(name=F, bold=True)
sm.column_dimensions["A"].width = 34; sm.column_dimensions["B"].width = 10
g = wb.create_sheet("작성법")
guide = ["2행은 작성 예시(회색 기울임)입니다. 3행부터 파란 칸에 입력합니다.",
         "핵심 수치·주장: 숫자는 단위·대상·기간까지 그대로 옮깁니다. (예: 직장인 1,000명 중 71.3%)",
         "원문 직접 확인: AI 답변이나 기사 요약이 아니라 발표 기관의 원문(보도자료·보고서)을 직접 열어 봤으면 Y.",
         "교차 확인 출처: 같은 주제를 다룬 다른 기관 자료. 없으면 비워 둡니다.",
         "신뢰도: 상 = 정부·공공기관·학술 / 중 = 언론·민간 조사기관 / 하 = 블로그·출처 불명",
         "보고서 사용: 원문 확인(Y)한 것만 '사용'. 요약 시트의 마지막 줄이 0이어야 합니다."]
g["A1"] = "작성법"; g["A1"].font = Font(name=F, bold=True, size=13)
for i, t in enumerate(guide, 3): g.cell(i, 1, f"{i-2}. {t}").font = Font(name=F)
g.column_dimensions["A"].width = 110
wb.save(OUT); print("ok")
