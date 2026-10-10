"""OECD 원자료 CSV 3개 -> Stata 분석용 패널(pes_panel_21.dta)

원본 CSV는 읽기만 하며 변경하지 않는다.
사용법: python 01_preprocess.py <LMP.csv> <LFS.csv> <SOCX.csv> [출력폴더]
"""
import sys
from pathlib import Path
import pandas as pd

COUNTRIES = ("AUS AUT BEL CAN DNK FIN FRA DEU IRL HUN JPN "
             "KOR LUX NLD NOR POL PRT ESP SWE CHE USA").split()
YEARS = range(2010, 2025)


def read_raw(path):
    # 문자열로 읽어 코드값(_T 등)과 빈 상태코드를 그대로 보존
    return pd.read_csv(path, dtype=str, keep_default_na=False)


def select(df, name, conditions):
    for col, val in conditions.items():
        df = df[df[col] == val]
    df = df[df["REF_AREA"].isin(COUNTRIES)].copy()
    df["year"] = df["TIME_PERIOD"].astype(int)
    df["value"] = pd.to_numeric(df["OBS_VALUE"].replace("", None), errors="raise")
    assert not df.duplicated(["REF_AREA", "year"]).any(), f"{name}: 국가-연도 중복"
    print(f"{name}: {len(df)}행, {df.REF_AREA.nunique()}개국, "
          f"{df.year.min()}-{df.year.max()}, 수치결측 {df.value.isna().sum()}")
    return df[["REF_AREA", "year", "value", "OBS_STATUS"]].rename(
        columns={"REF_AREA": "iso3", "value": name, "OBS_STATUS": f"{name}_status"})


def main(lmp_path, lfs_path, socx_path, out_dir="."):
    lmp, lfs, socx = read_raw(lmp_path), read_raw(lfs_path), read_raw(socx_path)
    print(f"원자료: LMP {len(lmp)}행, LFS {len(lfs)}행, SOCX {len(socx)}행")

    names = (lmp[lmp.REF_AREA.isin(COUNTRIES)]
             .drop_duplicates("REF_AREA")[["REF_AREA", "Reference area"]]
             .rename(columns={"REF_AREA": "iso3", "Reference area": "country"}))

    pes = select(lmp, "pes_gdp", {"MEASURE": "EXP", "PROGRAMME": "LMP_10",
                                  "UNIT_MEASURE": "PT_B1GQ"})
    lfs_base = {"SEX": "_T", "AGE": "Y15T64"}
    unemp = select(lfs, "unemp", {**lfs_base, "MEASURE": "UNE_RATE",
                                  "LABOUR_FORCE_STATUS": "UNE", "UNIT_MEASURE": "PT_LF_SUB"})
    lfpr = select(lfs, "lfpr", {**lfs_base, "MEASURE": "LF_RATE",
                                "LABOUR_FORCE_STATUS": "LF", "UNIT_MEASURE": "PT_POP_SUB"})
    emp = select(lfs, "emp_rate", {**lfs_base, "MEASURE": "EMP_RATIO",
                                   "LABOUR_FORCE_STATUS": "EMP", "UNIT_MEASURE": "PT_POP_SUB"})
    socx_ = select(socx, "socx_gdp", {"FREQ": "A", "MEASURE": "SOCX", "EXPEND_SOURCE": "ES10",
                                      "SPENDING_TYPE": "_T", "PROGRAMME_TYPE": "_T",
                                      "UNIT_MEASURE": "PT_B1GQ"})

    # 21개국 x 15년 틀에 1:1 왼쪽 결합 (결측은 결측 그대로)
    panel = pd.DataFrame([(c, y) for c in COUNTRIES for y in YEARS], columns=["iso3", "year"])
    panel = panel.merge(names, on="iso3", how="left", validate="m:1")
    for part in (pes, unemp, lfpr, emp, socx_):
        panel = panel.merge(part, on=["iso3", "year"], how="left", validate="1:1")
    # 행이 아예 없던 국가-연도 표시 (SOCX: AUS/CAN/JPN 2023-24)
    panel["socx_row_absent"] = panel["socx_gdp_status"].isna().astype("int8")
    for c in [c for c in panel if c.endswith("_status")]:
        panel[c] = panel[c].fillna("")
    panel = panel.sort_values(["iso3", "year"]).reset_index(drop=True)
    assert len(panel) == 315 and not panel.duplicated(["iso3", "year"]).any()

    labels = {
        "iso3": "국가코드(REF_AREA)", "country": "국가명", "year": "연도",
        "pes_gdp": "PES 및 행정 지출, GDP 대비 % (LMP_10)",
        "pes_gdp_status": "PES 관측상태", "unemp": "실업률 15-64세 남녀전체, %",
        "unemp_status": "실업률 관측상태(공란 원자료 그대로)",
        "lfpr": "경제활동참가율 15-64세, %", "lfpr_status": "참가율 관측상태",
        "emp_rate": "고용률 15-64세, %", "emp_rate_status": "고용률 관측상태",
        "socx_gdp": "전체 공공사회지출, GDP 대비 % (기초통계용)",
        "socx_gdp_status": "SOCX 관측상태", "socx_row_absent": "SOCX 원자료에 행 없음=1",
    }
    out = Path(out_dir)
    panel.to_csv(out / "pes_panel_21.csv", index=False, encoding="utf-8-sig")
    panel.to_stata(out / "pes_panel_21.dta", write_index=False, version=118,
                   variable_labels=labels,
                   data_label="OECD 21개국 PES 지출·실업률 패널 2010-2024")
    print(f"저장: {out/'pes_panel_21.dta'} ({len(panel)}행)")


if __name__ == "__main__":
    main(*sys.argv[1:])
