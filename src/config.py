import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"

# Ensure directories exist
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# File Paths
IMD_WEATHER_FILE = RAW_DATA_DIR / "imd_weather_data.csv"
CWC_RIVER_FILE = RAW_DATA_DIR / "cwc_river_gauges.csv"
DISTRICT_VULNERABILITY_FILE = RAW_DATA_DIR / "district_vulnerability.csv"
TRAINING_DATASET_FILE = PROCESSED_DATA_DIR / "processed_training_data.csv"

# Model Artifact Paths
REGRESSOR_MODEL_PATH = MODELS_DIR / "flood_crest_regressor.joblib"
CLASSIFIER_MODEL_PATH = MODELS_DIR / "hazard_classifier.joblib"
SCALER_PATH = MODELS_DIR / "feature_scaler.joblib"
MODEL_METADATA_PATH = MODELS_DIR / "model_metrics.json"

# CWC Benchmark Thresholds for Mahanadi Basin at Mundali Barrage (Cuttack, Odisha)
# Baseline historical references:
# Warning Level (WL) = 26.50 m
# Danger Level (DL) = 27.50 m
# Highest Flood Level (HFL) = 29.20 m
CWC_THRESHOLDS = {
    "WARNING_LEVEL_M": 26.50,
    "DANGER_LEVEL_M": 27.50,
    "HIGHEST_FLOOD_LEVEL_M": 29.20,
    "NORMAL_LEVEL_M": 22.00
}

# Hazard Tiers
HAZARD_TIERS = {
    0: {"name": "NORMAL", "color": "Green", "action": "Routine Monitoring"},
    1: {"name": "ALERT", "color": "Yellow", "action": "Pre-position SDRF & Issue Advisory"},
    2: {"name": "WARNING", "color": "Orange", "action": "Mobilize NDRF & Prepare Shelters"},
    3: {"name": "SEVERE", "color": "Red", "action": "Mandatory Evacuation & Emergency Declared"}
}

# Utility Function Weights (Indian context: Life > Livestock > Economy > Panic)
UTILITY_WEIGHTS = {
    "W_LIFE": 10.0,         # Heavy penalty on human casualty risk
    "W_LIVESTOCK": 4.0,     # Significant weight on livestock preservation in rural India
    "W_CROP": 1.5,          # Agricultural harvest disruption penalty
    "W_FALSE_ALARM": 1.0,   # Cost of unwarranted panic and economic stoppage
    "W_SHELTER_OVERLOAD": 3.0 # Penalty for exceeding shelter maximum capacity
}
