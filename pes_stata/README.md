# PES 지출 비대칭 분석 (Stata)

| 파일 | 내용 |
|---|---|
| `raw/` | OECD 원자료 CSV 3개 (2026-10-10 다운로드, 수정하지 않음) |
| `01_preprocess.py` | raw CSV → 패널 |
| `pes_panel_21.dta` / `.csv` | 21개국 × 2004–2024 = 441행, 국가-연도당 1행 |
| `02_analysis.do` | 패널 선언, 변화량, 기초통계, Allison GLS 모형, 대칭성 검정, 민감도 |

## 실행
1. (선택) 다시 만들기:
   `python 01_preprocess.py raw/OECD_LMP_*.csv raw/OECD_LFS_*.csv raw/OECD_SOCX_*.csv`
2. Stata: `cd "C:\OECD data\pes_stata"` → `do 02_analysis.do`

## 변수와 범위
- `pes_gdp`: PES·행정 지출/GDP % (LMP_10), 2004–2024 전부 관측 (441)
- `unemp`: 실업률 15–64세 남녀 전체 %, 2010–2024 (315). 2004–2009 결측
- `socx_gdp`: 전체 공공사회지출/GDP %, 2010–2024 (309). 기초통계용, 회귀 통제변수 아님
- `*_status`: 원자료 OBS_STATUS 그대로 (실업률 공란 8개 보존)
- `socx_row_absent`: AUS·CAN·JPN 2023–24 원자료 행 없음 = 1

결측은 0이나 보간으로 채우지 않았다. 시차모형 추정표본은 2012–2024년 273행이다.
