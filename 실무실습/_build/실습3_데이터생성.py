import random, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
random.seed(1108)
OUT = "/home/user/-/실무실습/실습3_신규서비스기획/가상데이터_수강생VOC.xlsx"
F = "Arial"
courses = {"AI 오피스 실무": "대면", "데이터 분석 기초": "온라인", "노코드 업무 자동화": "혼합", "디지털 마케팅": "온라인", "사무회계 실무": "대면", "취업 이미지 메이킹": "대면", "경력 재설계 집단상담": "혼합", "온라인 쇼핑몰 창업": "온라인"}
ages = ["20대", "30대", "40대", "50대 이상"]
hard = ["수업 진도가 빠름", "실습 후 복습할 자료 부족", "질문할 곳이 없음", "수업 시간 맞추기 어려움", "기기·프로그램 사용", "특별히 없음"]
want = ["수료 후 이력서·포트폴리오 피드백", "수업 녹화본·복습 자료", "수업 외 질문 창구", "취업처 연결·채용 정보", "심화 과정", "동기 모임·스터디"]
free = {
 "수료 후 이력서·포트폴리오 피드백": ["배운 걸 이력서에 어떻게 써야 할지 모르겠어요.", "수료하고 나서 포트폴리오를 봐줄 사람이 있으면 좋겠습니다.", "자기소개서에 이번 교육 경험을 넣고 싶은데 방법을 모르겠어요.", "실습 결과물을 정리해서 지원할 때 쓰고 싶어요."],
 "수업 녹화본·복습 자료": ["집에서 다시 해보려니 기억이 안 나요.", "실습 단계별 자료가 있으면 좋겠어요.", "결석한 날 내용을 따라가기 어려웠습니다."],
 "수업 외 질문 창구": ["밤에 과제하다 막히면 물어볼 데가 없어요.", "단톡방에 질문하기가 눈치 보여요.", "질문 답변이 다음 수업까지 기다려야 해서 아쉬웠어요."],
 "취업처 연결·채용 정보": ["실제로 어디에 지원할 수 있는지 알려주면 좋겠어요.", "수료생 대상 채용 정보가 있으면 좋겠습니다."],
 "심화 과정": ["다음 단계 과정이 있으면 듣고 싶어요.", "기초는 알겠는데 실무 수준까지 가고 싶어요."],
 "동기 모임·스터디": ["수료 후에도 같이 공부할 사람이 있으면 좋겠어요.", "동기들과 정보를 나누고 싶어요."],
}
wb = Workbook(); thin = Side(style="thin", color="D9DEE5"); hf = PatternFill("solid", fgColor="E8EDFF")
def header(ws, vals, widths):
    for j, v in enumerate(vals, 1):
        c = ws.cell(1, j, v); c.font = Font(name=F, bold=True); c.fill = hf; c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True); c.border = Border(bottom=thin)
    for j, w in enumerate(widths, 1): ws.column_dimensions[get_column_letter(j)].width = w
    ws.freeze_panes = "A2"
ws = wb.active; ws.title = "안내"
info = [("자료명", "B여성센터 2026년 상반기 수강생 만족도 설문(주관식 포함)과 문의 기록 (가상)"),
        ("자료 성격", "교육·실습용으로 만든 가상 자료입니다. 실제 기관·인물과 관계없습니다."),
        ("설문응답", "수료자 120명 응답: 과정, 연령대, 만족도, 가장 어려웠던 점, 추가로 원하는 지원, 자유 의견"),
        ("문의기록", "2026년 3~6월 수강생 문의 90건: 접수 시각, 과정, 유형, 내용 요약, 답변까지 걸린 시간"),
        ("실습 목표", "고객(수강생)의 불편을 데이터로 찾고, 이를 해결할 새 서비스를 기획한다.")]
ws["A1"] = "가상 실습 자료 안내"; ws["A1"].font = Font(name=F, bold=True, size=14)
for i, (k, v) in enumerate(info, 3):
    ws.cell(i, 1, k).font = Font(name=F, bold=True); ws.cell(i, 2, v).font = Font(name=F)
ws.column_dimensions["A"].width = 12; ws.column_dimensions["B"].width = 90

s = wb.create_sheet("설문응답")
header(s, ["응답ID", "과정명", "운영형태", "연령대", "만족도(5점)", "가장 어려웠던 점", "추가로 원하는 지원", "자유 의견"], [8, 20, 9, 10, 10, 22, 28, 52])
for i in range(1, 121):
    c = random.choice(list(courses)); mode = courses[c]
    a = random.choices(ages, [12, 35, 35, 18])[0]
    hw = [8, 22, 14, 14, 10, 18] if mode == "대면" else [8, 18, 30, 12, 14, 8] if mode == "온라인" else [8, 20, 18, 14, 10, 14]
    h = random.choices(hard, hw)[0]
    ww = [34, 20, 14, 16, 8, 8]
    if mode == "온라인": ww = [26, 20, 30, 12, 6, 6]
    if a == "50대 이상": ww = [w + (10 if k in (0, 3) else 0) for k, w in enumerate(ww)]
    w = random.choices(want, ww)[0]
    sat = round(min(5, max(1, random.gauss(4.5 if mode != "온라인" else 4.0, 0.6))))
    txt = random.choice(free[w]) if random.random() < 0.85 else ""
    row = [f"R{i:03d}", c, mode, a, sat, h, w, txt]
    for j, v in enumerate(row, 1): s.cell(i + 1, j, v).font = Font(name=F)
s.auto_filter.ref = "A1:H121"

q = wb.create_sheet("문의기록")
header(q, ["문의ID", "접수 일시", "과정명", "운영형태", "문의 유형", "내용 요약", "답변까지 걸린 시간(시간)"], [8, 18, 20, 9, 14, 40, 14])
types = {"과제·실습 질문": ["실습 파일 단계에서 오류", "과제 제출 방법 문의", "함수·기능 사용법 질문"],
         "자료 요청": ["지난 시간 자료 재요청", "강의 자료 다운로드 문의"],
         "일정·출결": ["결석 처리 문의", "보강 일정 문의"],
         "취업·진로 상담": ["수료 후 이력서 작성 문의", "지원할 만한 직무 문의", "포트폴리오 구성 문의"],
         "기기·계정": ["프로그램 설치 오류", "로그인 문제"]}
base = dt.datetime(2026, 3, 2, 9, 0)
for i in range(1, 91):
    c = random.choice(list(courses)); mode = courses[c]
    tw = [40, 15, 15, 18, 12] if mode == "온라인" else [28, 18, 22, 22, 10]
    ty = random.choices(list(types), tw)[0]
    day = base + dt.timedelta(days=random.randint(0, 115))
    night = random.random() < (0.55 if ty == "과제·실습 질문" else 0.25)
    hour = random.randint(20, 23) if night else random.randint(9, 18)
    when = day.replace(hour=hour, minute=random.choice([0, 10, 20, 30, 40, 50]))
    wait = random.uniform(10, 40) if night else random.uniform(1, 12)
    if mode == "온라인": wait *= 1.3
    if ty == "취업·진로 상담": wait += random.uniform(24, 72)
    row = [f"Q{i:03d}", when, c, mode, ty, random.choice(types[ty]), round(wait, 1)]
    for j, v in enumerate(row, 1):
        cell = q.cell(i + 1, j, v); cell.font = Font(name=F)
        if j == 2: cell.number_format = "yyyy-mm-dd hh:mm"
q.auto_filter.ref = "A1:G91"
wb.save(OUT); print(OUT)
