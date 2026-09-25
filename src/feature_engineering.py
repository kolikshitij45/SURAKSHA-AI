"""
Feature Engineering Pipeline for Suraksha-AI
Extracts hydrological and meteorological features including Antecedent Precipitation Index (API),
rolling window aggregations, and lag indicators for flood forecasting.
"""

import pandas as pd
import numpy as np
from src.config import (
    TRAINING_DATASET_FILE,
    CWC_THRESHOLDS
)
from src.data_loader import load_raw_datasets


def compute_antecedent_precipitation_index(rainfall_series: pd.Series, decay_factor: float = 0.85) -> pd.Series:
    """
    Computes Antecedent Precipitation Index (API):
    API_t = Rain_t + (decay_factor * API_{t-1})
    Standard metric representing residual soil moisture saturation in hydrology.
    """
    api = np.zeros(len(rainfall_series))
    current_val = 0.0
    for idx, rain in enumerate(rainfall_series):
        current_val = rain + (decay_factor * current_val)
        api[idx] = current_val
    return pd.Series(api, index=rainfall_series.index)


def prepare_training_features(save_to_disk: bool = True) -> pd.DataFrame:
    """
    Merges IMD and CWC time series, builds temporal features, and generates labels.
    """
    df_weather, df_cwc, _ = load_raw_datasets()

    # Merge on date
    df = pd.merge(df_weather, df_cwc, on="date", how="inner")
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # 1. Hydrological Domain Features
    df["api_soil_moisture"] = compute_antecedent_precipitation_index(df["rainfall_imd_mm"], decay_factor=0.85)

    # 2. Precipitation Accumulations
    df["rain_lag1_mm"] = df["rainfall_imd_mm"].shift(1).fillna(0)
    df["rain_lag2_mm"] = df["rainfall_imd_mm"].shift(2).fillna(0)
    df["rain_cum_3d_mm"] = df["rainfall_imd_mm"].rolling(window=3, min_periods=1).sum()
    df["rain_cum_7d_mm"] = df["rainfall_imd_mm"].rolling(window=7, min_periods=1).sum()

    # 3. River Level Dynamics
    df["water_level_lag1_m"] = df["water_level_m"].shift(1).fillna(df["water_level_m"].iloc[0])
    df["water_level_delta_24h"] = df["water_level_m"] - df["water_level_lag1_m"]
    df["discharge_rolling_3d"] = df["discharge_cumec"].rolling(window=3, min_periods=1).mean()
    df["dam_outflow_rolling_2d"] = df["upstream_dam_outflow_cumec"].rolling(window=2, min_periods=1).mean()

    # 4. Atmospheric / Cyclone Indicators
    df["pressure_drop_hpa"] = np.maximum(0, 1013.25 - df["pressure_hpa"])
    df["storm_wind_flag"] = (df["wind_speed_kmh"] > 45.0).astype(int)

    # 5. Future Targets (24-Hour Horizon)
    df["next_day_water_level_m"] = df["water_level_m"].shift(-1)

    # Filter out the final row where future target is NaN
    df = df.dropna(subset=["next_day_water_level_m"]).reset_index(drop=True)

    # 6. Classification Target (Hazard Tiers based on CWC thresholds)
    wl = CWC_THRESHOLDS["WARNING_LEVEL_M"]
    dl = CWC_THRESHOLDS["DANGER_LEVEL_M"]
    hfl = CWC_THRESHOLDS["HIGHEST_FLOOD_LEVEL_M"]

    def assign_hazard_tier(level: float) -> int:
        if level < wl:
            return 0  # Normal
        elif wl <= level < dl:
            return 1  # Alert
        elif dl <= level < hfl:
            return 2  # Warning
        else:
            return 3  # Severe / Catastrophic

    df["hazard_tier"] = df["next_day_water_level_m"].apply(assign_hazard_tier)

    if save_to_disk:
        df.to_csv(TRAINING_DATASET_FILE, index=False)
        print(f"[OK] Feature engineering complete. Saved to: {TRAINING_DATASET_FILE} ({len(df)} records)")

    return df


# Feature Column Definitions
FEATURE_COLUMNS = [
    "rainfall_imd_mm",
    "temp_max_c",
    "pressure_hpa",
    "wind_speed_kmh",
    "relative_humidity_pct",
    "upstream_dam_outflow_cumec",
    "discharge_cumec",
    "water_level_m",
    "api_soil_moisture",
    "rain_lag1_mm",
    "rain_lag2_mm",
    "rain_cum_3d_mm",
    "rain_cum_7d_mm",
    "water_level_lag1_m",
    "water_level_delta_24h",
    "discharge_rolling_3d",
    "dam_outflow_rolling_2d",
    "pressure_drop_hpa",
    "storm_wind_flag"
]

REGRESSION_TARGET = "next_day_water_level_m"
CLASSIFICATION_TARGET = "hazard_tier"


if __name__ == "__main__":
    prepare_training_features(save_to_disk=True)
