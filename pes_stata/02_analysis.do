*==============================================================
* PES·행정 지출의 실업률 상승·하락에 대한 비대칭 반응
* 입력: pes_panel_21.dta (01_preprocess.py로 생성, 21개국 x 2010-2024)
* 주의: 현재 PES 지출은 2020-2024년뿐이므로 추정은 2021-2024년
*       84개 관측치의 예비분석이다.
*==============================================================
version 17
clear all
set more off
capture log close
* 이 do 파일이 있는 폴더로 이동한 뒤 실행
log using "pes_analysis.log", replace text

use "pes_panel_21.dta", clear

*--------------------------------------------------------------
* 1. 패널 선언과 점검
*--------------------------------------------------------------
isid iso3 year
encode iso3, gen(country_id)
xtset country_id year, yearly
assert _N == 315

* 상태코드 공란(AUS/AUT/BEL/CAN 2023-24)은 수치가 있으므로 결측이 아님
tab unemp_status, missing
tab socx_row_absent

*--------------------------------------------------------------
* 2. 변화량 (D./L.은 실제 전년도 기준, 중간연도 없으면 결측)
*--------------------------------------------------------------
gen double dpes  = D.pes_gdp
gen double du    = D.unemp
gen double up    = max(du, 0)  if !missing(du)
gen double down  = max(-du, 0) if !missing(du)
gen double Lup   = L.up
gen double Ldown = L.down
gen double dsocx = D.socx_gdp

label var dpes  "PES 지출 비중 변화 (%p)"
label var du    "실업률 변화 (%p)"
label var up    "실업률 상승 폭 U+ (%p)"
label var down  "실업률 하락 폭 U- (%p, 양수)"
label var Lup   "전년 실업률 상승 폭"
label var Ldown "전년 실업률 하락 폭"
label var dsocx "공공사회지출 비중 변화 (기초통계용)"

* 공통 추정표본: 시차모형 기준 (2021-2024, 84행 예상)
gen byte sample = !missing(dpes, up, down, Lup, Ldown)
count if sample

*--------------------------------------------------------------
* 3. 기초통계
*--------------------------------------------------------------
* 3-1 자료 확보 현황: 국가별 유효 관측 수
preserve
collapse (count) n_pes=pes_gdp n_unemp=unemp n_socx=socx_gdp ///
         (min) first_year=year, by(iso3)
list, noobs sep(0)
restore

* 3-2 수준 변수 기술통계 (변수별 N이 다름: 105 / 315 / 309)
tabstat pes_gdp unemp lfpr emp_rate socx_gdp, ///
    stat(n mean sd min max) col(stat) format(%9.3f)
* PES가 있는 2020-2024년으로 한정
tabstat pes_gdp unemp socx_gdp if !missing(pes_gdp), ///
    stat(n mean sd min max) col(stat) format(%9.3f)

* 3-3 국가 간/국가 내 변동
xtsum pes_gdp unemp if inrange(year, 2020, 2024)

* 3-4 국가별 평균 (2020-2024)
tabstat pes_gdp unemp if inrange(year, 2020, 2024), ///
    by(iso3) stat(mean sd) format(%9.3f) nototal

* 3-5 연도별 21개국 단순평균 (OECD 평균 아님)
tabstat pes_gdp unemp socx_gdp if inrange(year, 2020, 2024), ///
    by(year) stat(n mean) format(%9.3f)
* SOCX는 2023-24년에 18개국뿐 -> 같은 국가 집합으로도 확인
tabstat socx_gdp if inrange(year, 2020, 2024) & ///
    !inlist(iso3, "AUS", "CAN", "JPN"), by(year) stat(n mean) format(%9.3f)

* 3-6 변화량 통계와 방향별 횟수
tabstat dpes du up down if sample, stat(n mean sd min max) col(stat) format(%9.4f)
gen byte is_up   = up > 0   if !missing(up)
gen byte is_down = down > 0 if !missing(down)
tabstat is_up is_down if sample, by(iso3) stat(sum) nototal
* 한 방향만 관측된 국가는 제외 사유가 아니라 진단 결과로 기록 (예: ESP)

* 3-7 관계 탐색
pwcorr dpes du up down if sample, obs
twoway (scatter dpes du if sample & du > 0, mcolor(cranberry)) ///
       (scatter dpes du if sample & du < 0, mcolor(navy)), ///
       xline(0) yline(0) legend(order(1 "실업률 상승" 2 "실업률 하락")) ///
       xtitle("실업률 변화 (%p)") ytitle("PES 지출 비중 변화 (%p)")
graph export "scatter_dpes_du.png", replace

*--------------------------------------------------------------
* 4. 모형 추정 (Allison 2019: 차분 + 차분오차 GLS)
*    국가 확률절편 없음(noconstant), Toeplitz 1 잔차, 국가 군집 강건 SE
*    통제변수: 아직 미확보. SOCX는 통제변수로 넣지 않음.
*--------------------------------------------------------------
local controls ""    // 확보 후 예: dgdp ddebt dtax

* 모형 1: 대칭
mixed dpes du `controls' i.year if sample ///
    || country_id:, noconstant ///
    residuals(toeplitz 1, t(year)) vce(robust)
estimates store M1

* 모형 2: 당해 비대칭
mixed dpes up down `controls' i.year if sample ///
    || country_id:, noconstant ///
    residuals(toeplitz 1, t(year)) vce(robust)
estimates store M2
test up + down = 0

* 모형 3: 당해 + 1년 시차 비대칭 (주모형)
mixed dpes up down Lup Ldown `controls' i.year if sample ///
    || country_id:, noconstant ///
    residuals(toeplitz 1, t(year)) vce(robust)
estimates store M3

*--------------------------------------------------------------
* 5. 대칭성 검정 (하락 폭을 양수로 정의 -> 계수의 합 = 0)
*--------------------------------------------------------------
test up + down = 0                          // 당해
test Lup + Ldown = 0                        // 1년 뒤
test (up + down = 0) (Lup + Ldown = 0)      // 공동 검정 (사전 주검정)
lincom up + Lup                             // 상승 두 시점 합
lincom down + Ldown                         // 하락 두 시점 합
lincom up + Lup + down + Ldown              // 두 시점 합계의 대칭성

estimates table M1 M2 M3, b(%9.4f) se(%9.4f) stats(N) keep(du up down Lup Ldown)

*--------------------------------------------------------------
* 6. 비교모형: 같은 차분식 OLS + 국가 군집 SE
*--------------------------------------------------------------
regress dpes up down Lup Ldown `controls' i.year if sample, ///
    vce(cluster country_id)
estimates store OLS3
test (up + down = 0) (Lup + Ldown = 0)

* 군집 수가 21개로 적으므로 wild cluster bootstrap 보완 (Stata 18+)
capture noisily wildbootstrap regress dpes up down Lup Ldown ///
    `controls' i.year if sample, cluster(country_id) ///
    coefficients(up down) rseed(20261010)

*--------------------------------------------------------------
* 7. 저장
*--------------------------------------------------------------
save "pes_panel_21_analysis.dta", replace
log close
