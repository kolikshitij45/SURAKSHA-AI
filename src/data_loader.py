"""
Data Loader & Dataset Generator for Suraksha-AI
Simulates authentic Indian meteorological (IMD) and hydrological (CWC) time-series datasets
for the Mahanadi River Basin (Hirakud Dam -> Cuttack / Coastal Odisha).
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from src.config import (
    IMD_WEATHER_FILE,
    CWC_RIVER_FILE,
    DISTRICT_VULNERABILITY_FILE,
    CWC_THRESHOLDS
)


def generate_synthetic_indian_datasets(num_years: int = 5) -> None:
    """
    Generates realistic historical datasets for Indian monsoon disaster prediction:
    1. IMD Gridded Weather Time-Series (Rainfall, Temp, Pressure, Humidity, Wind)
    2. CWC Hydrological Time-Series (Gauge Height, Upstream Dam Release, Discharge)
    3. District Vulnerability & Demographic Dataset (Census / SECC Data)
    """
    np.random.seed(42)
    start_date = datetime(2019, 1, 1)
    total_days = num_years * 365
    date_range = [start_date + timedelta(days=i) for i in range(total_days)]

    # ----------------------------------------------------
    # 1. IMD Meteorological Time-Series
    # ----------------------------------------------------
    records_weather = []
    for dt in date_range:
        month = dt.month
        is_monsoon = 6 <= month <= 9
        is_cyclone_season = (month in [5, 10, 11])

        # Baseline rainfall patterns in Odisha/Eastern India
        if is_monsoon:
            base_rain = np.random.exponential(scale=28.0)
            # Monsoon depressions / low pressure systems
            if np.random.rand() < 0.12:
                base_rain += np.random.uniform(70.0, 220.0) # Heavy/Extremely Heavy Rain
        elif is_cyclone_season and (np.random.rand() < 0.08):
            base_rain = np.random.uniform(90.0, 250.0) # Cyclonic cloudburst
        else:
            base_rain = np.random.exponential(scale=2.5) if np.random.rand() < 0.2 else 0.0

        temp_max = 38.0 - 5.0 * np.sin(2 * np.pi * dt.timetuple().tm_yday / 365) + np.random.normal(0, 2.0)
        temp_min = temp_max - np.random.uniform(6.0, 12.0)
        pressure = 1008.0 - (12.0 if is_monsoon else 0.0) - (base_rain * 0.06) + np.random.normal(0, 1.5)
        wind_speed = 14.0 + (base_rain * 0.25) + np.random.normal(0, 3.0) # km/h
        humidity = min(100.0, max(30.0, (82.0 if is_monsoon else 55.0) + (base_rain * 0.3) + np.random.normal(0, 5.0)))

        records_weather.append({
            "date": dt.strftime("%Y-%m-%d"),
            "rainfall_imd_mm": round(float(base_rain), 2),
            "temp_max_c": round(float(temp_max), 2),
            "temp_min_c": round(float(temp_min), 2),
            "pressure_hpa": round(float(pressure), 2),
            "wind_speed_kmh": round(float(max(2.0, wind_speed)), 2),
            "relative_humidity_pct": round(float(humidity), 2)
        })

    df_weather = pd.DataFrame(records_weather)
    df_weather.to_csv(IMD_WEATHER_FILE, index=False)
    print(f"[OK] Created IMD Weather Dataset: {IMD_WEATHER_FILE} ({len(df_weather)} records)")

    # ----------------------------------------------------
    # 2. CWC Hydrological Time-Series (Mahanadi at Mundali)
    # ----------------------------------------------------
    records_cwc = []
    prev_water_level = 21.0
    for i, row in df_weather.iterrows():
        dt_str = row["date"]
        rain = row["rainfall_imd_mm"]

        # Upstream Dam Outflow (Hirakud reservoir rules: releases water when heavy rain persists)
        dam_outflow_cumec = 400.0 + (rain * 30.0) + np.random.uniform(0, 200.0)
        if rain > 60.0:
            dam_outflow_cumec += np.random.uniform(3000.0, 8000.0)
        if rain > 120.0:
            dam_outflow_cumec += np.random.uniform(8000.0, 18000.0) # Major emergency sluice opening

        # River discharge rate in cumecs (cubic meters per sec)
        discharge_cumec = 800.0 + (dam_outflow_cumec * 1.3) + (rain * 80.0) + np.random.normal(0, 150.0)

        # River water level dynamics (in meters at Mundali Barrage)
        # Stage height responds to discharge logarithmically/exponentially
        stage_lift = (discharge_cumec / 28000.0) * 8.5 + (rain / 250.0) * 2.5
        target_water_level = 21.0 + stage_lift + np.random.normal(0, 0.15)
        
        # Smooth transition with river channel momentum
        water_level = prev_water_level * 0.65 + target_water_level * 0.35
        water_level = max(20.0, min(30.2, water_level))
        prev_water_level = water_level

        records_cwc.append({
            "date": dt_str,
            "station_name": "Mundali_Barrage_Cuttack",
            "river_basin": "Mahanadi",
            "upstream_dam_outflow_cumec": round(float(dam_outflow_cumec), 2),
            "discharge_cumec": round(float(max(100.0, discharge_cumec)), 2),
            "water_level_m": round(float(water_level), 2),
            "warning_level_m": CWC_THRESHOLDS["WARNING_LEVEL_M"],
            "danger_level_m": CWC_THRESHOLDS["DANGER_LEVEL_M"],
            "highest_flood_level_m": CWC_THRESHOLDS["HIGHEST_FLOOD_LEVEL_M"]
        })

    df_cwc = pd.DataFrame(records_cwc)
    df_cwc.to_csv(CWC_RIVER_FILE, index=False)
    print(f"[OK] Created CWC River Gauge Dataset: {CWC_RIVER_FILE} ({len(df_cwc)} records)")

    # ----------------------------------------------------
    # 3. District Demographics & Vulnerability (Census / SECC)
    # ----------------------------------------------------
    vulnerability_data = [
        {
            "district_id": "OD_CTC_01",
            "district_name": "Cuttack",
            "sub_division_taluk": "Athagarh",
            "population": 315000,
            "kutchha_house_pct": 34.5,
            "cattle_population": 84000,
            "avg_elevation_m": 24.2,
            "available_shelters": 28,
            "total_shelter_capacity": 42000
        },
        {
            "district_id": "OD_CTC_02",
            "district_name": "Cuttack",
            "sub_division_taluk": "Banki",
            "population": 245000,
            "kutchha_house_pct": 48.2,
            "cattle_population": 92000,
            "avg_elevation_m": 21.5, # Low-lying, high risk
            "available_shelters": 22,
            "total_shelter_capacity": 31000
        },
        {
            "district_id": "OD_KND_01",
            "district_name": "Kendrapara",
            "sub_division_taluk": "Aul",
            "population": 198000,
            "kutchha_house_pct": 52.6,
            "cattle_population": 76000,
            "avg_elevation_m": 15.0, # Coastal estuarine delta
            "available_shelters": 35,
            "total_shelter_capacity": 55000
        },
        {
            "district_id": "OD_KND_02",
            "district_name": "Kendrapara",
            "sub_division_taluk": "Rajnagar",
            "population": 172000,
            "kutchha_house_pct": 58.1,
            "cattle_population": 65000,
            "avg_elevation_m": 9.5, # Coastal cyclone prone
            "available_shelters": 40,
            "total_shelter_capacity": 60000
        },
        {
            "district_id": "OD_JAG_01",
            "district_name": "Jagatsinghpur",
            "sub_division_taluk": "Kujang",
            "population": 210000,
            "kutchha_house_pct": 46.0,
            "cattle_population": 58000,
            "avg_elevation_m": 12.0,
            "available_shelters": 30,
            "total_shelter_capacity": 48000
        }
    ]

    df_vuln = pd.DataFrame(vulnerability_data)
    df_vuln.to_csv(DISTRICT_VULNERABILITY_FILE, index=False)
    print(f"[OK] Created District Vulnerability Dataset: {DISTRICT_VULNERABILITY_FILE} ({len(df_vuln)} taluks)")


def load_raw_datasets():
    """Loads raw datasets into pandas DataFrames, auto-generating if absent."""
    if not (IMD_WEATHER_FILE.exists() and CWC_RIVER_FILE.exists() and DISTRICT_VULNERABILITY_FILE.exists()):
        print("[!] Datasets missing. Generating realistic Indian hydrological data...")
        generate_synthetic_indian_datasets()

    df_weather = pd.read_csv(IMD_WEATHER_FILE)
    df_cwc = pd.read_csv(CWC_RIVER_FILE)
    df_vuln = pd.read_csv(DISTRICT_VULNERABILITY_FILE)
    return df_weather, df_cwc, df_vuln


if __name__ == "__main__":
    generate_synthetic_indian_datasets()
