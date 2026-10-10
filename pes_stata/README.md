# PES 지출 비대칭 분석 (Stata)

| 파일 | 내용 |
|---|---|
| `01_preprocess.py` | 원자료 CSV 3개 → 패널 (원본은 읽기만 함) |
| `pes_panel_21.dta` / `.csv` | 21개국 × 2010–2024 = 315행, 국가-연도당 1행 |
| `02_analysis.do` | 패널 선언, 변화량, 기초통계, Allison GLS 모형, 대칭성 검정 |

## 실행
1. (선택) 다시 만들기: `python 01_preprocess.py <LMP.csv> <LFS.csv> <SOCX.csv>`
2. Stata에서 이 폴더로 `cd` 한 뒤 `do 02_analysis.do`

## 변수
- `pes_gdp`: PES·행정 지출/GDP % (LMP_10, 2020–2024만 존재, 100 곱하지 않음)
- `unemp`, `lfpr`, `emp_rate`: 15–64세 남녀 전체 %
- `socx_gdp`: 전체 공공사회지출/GDP %. 기초통계용이며 회귀 통제변수 아님
- `*_status`: 원자료 OBS_STATUS 그대로 (실업률 등 8개 공란 보존)
- `socx_row_absent`: AUS·CAN·JPN 2023–24 원자료 행 없음 = 1

결측은 0이나 보간으로 채우지 않았다. 현재 추정표본은 2021–2024년 84행(예비분석)이다.
