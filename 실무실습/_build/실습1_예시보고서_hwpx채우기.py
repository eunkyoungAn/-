import zipfile, os, shutil, sys
from lxml import etree
src = "/home/user/-/실무실습/양식/한장보고서_양식.hwpx"
out = "/home/user/-/실무실습/실습1_데이터분석_한장보고서/예시결과_한장보고서.hwpx"
work = "/tmp/hwpx_work"
shutil.rmtree(work, ignore_errors=True); os.makedirs(work)
with zipfile.ZipFile(src) as z: z.extractall(work)
sec = f"{work}/Contents/section0.xml"
HP = 'http://www.hancom.co.kr/hwpml/2011/paragraph'
tree = etree.parse(sec, etree.XMLParser(remove_blank_text=False)); root = tree.getroot()
t = list(root.iter(f'{{{HP}}}t'))
assert len(t) == 19 and t[1].text.startswith("제목") and t[18].text.startswith("논문명")
R = {
 1: "B여성센터 2026년 상반기 직업교육과정 운영 성과 분석 및 하반기 개선 방안",
 2: "",
 4: "개요",
 5: "상반기 8개 과정 240명 운영 결과 수료율 85.0%, 취업·창업률 44.6%이며, AI·디지털 과정 수요 집중과 온라인 과정 성과 저하가 확인되어 하반기 과정 구성 개선이 필요함",
 6: "본문",
 7: "[실행계획] 과정별 실적 진단(신청·수료·만족도·취업) → 운영형태·경력단절 기간별 격차 분석 → 하반기 과정 재편안 수립 → 개편 과정 시범 운영 및 분기별 점검",
 8: "[분석1] 수요 집중: AI·디지털 3개 과정 신청 234명으로 전체 신청(431명)의 54.3%를 차지하며, AI 오피스 실무 경쟁률 3.1배로 최고임. 취업지원 과정은 1.1배 수준임",
 9: "[분석2] 운영형태별 격차: 온라인 과정 수료율 72.2%로 대면(94.4%) 대비 22.2%p 낮고, 수료자 취업·창업률도 29.2%로 대면(55.3%)의 약 절반임. 온라인 쇼핑몰 창업 과정은 수료율 60.0%, 수료자 1인당 비용 58.3만 원으로 1인당 운영비(35만 원)의 약 1.7배임",
 10: "[분석3] 취업 취약 집단: 경력단절 5년 이상 수료자 취업·창업률 33.3%, 50대 이상 36.6%로 전체(44.6%)보다 낮음. 다만 집단별 수료자 41~42명으로 해석에 주의가 필요함",
 11: "[해결방안] AI·디지털 과정 기수 추가, 온라인 과정의 혼합형 전환(혼합형 수료율 90.0%, 만족도 4.54), 경력단절 5년 이상·50대 수료자 대상 1:1 취업 연계 강화를 제안함",
 13: "결론",
 14: "수요가 높은 AI·디지털 과정을 확대하고, 온라인 과정 혼합형 전환과 취업 취약 집단 사후 지원으로 하반기 취업·창업률 제고를 추진함",
 15: "(단기) 하반기 AI·디지털 과정 1개 기수 추가, 온라인 2개 과정 혼합형 시범 전환",
 16: "(중장기) 수료 후 3개월 추적 결과를 분기별로 점검해 과정 개편과 예산 배분 기준으로 활용",
 17: "참고문헌",
 18: "B여성센터(가상), 「2026년 상반기 직업교육과정 운영 실적」, 교육·실습용 가상 자료, 2026.",
}
for i, v in R.items(): t[i].text = v
for lsa in root.iter(f'{{{HP}}}linesegarray'):
    for c in list(lsa): lsa.remove(c)
tree.write(sec, xml_declaration=True, encoding='UTF-8', standalone=True)
with zipfile.ZipFile(out, 'w') as zo:
    zo.write(f"{work}/mimetype", "mimetype", compress_type=zipfile.ZIP_STORED)
    for d, _, fs in os.walk(work):
        for f in fs:
            p = os.path.join(d, f); a = os.path.relpath(p, work)
            if a != "mimetype": zo.write(p, a, compress_type=zipfile.ZIP_DEFLATED)
# 검증: 다시 열어 텍스트 확인
z = zipfile.ZipFile(out); r2 = etree.fromstring(z.read('Contents/section0.xml'))
print(z.namelist()[0], z.getinfo('mimetype').compress_type)
for i, x in enumerate(r2.iter(f'{{{HP}}}t')): print(i, (x.text or '')[:60])
