# Suraksha-AI (सुरक्षा-AI)
### India-Oriented Riverine Flood, Cyclone & Extreme Monsoon Weather Intelligent Agent & Civil Defense Dashboard

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4%2B-F7931E.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Suraksha-AI** is a production-grade, Utility-Based Intelligent Agent and civil defense operations dashboard engineered for the **Mahanadi River Basin (Hirakud Dam to Mundali Barrage / Coastal Odisha, India)**. The system ingests hydrometeorological datasets benchmarked against the **India Meteorological Department (IMD)**, **Central Water Commission (CWC)**, and **Census of India** to predict river crest stages 24–48 hours in advance, classify flood hazard tiers, optimize NDRF battalion deployment, allocate cyclone/flood shelters, and generate multi-lingual **NDMA CAP-SACHET** emergency alerts.

---

## Key System Capabilities

* **Predictive Hydrometeorological ML Pipeline:**
  * **Flood Crest Regressor (Random Forest Regressor):** Forecasts downstream peak water level ($H_{\text{pred}}$) at Mundali Barrage in meters (MAE $\approx 0.62\text{ m}$, $R^2 \approx 0.67$).
  * **Hazard Tier Classifier (Gradient Boosting Classifier):** Classifies operational threat tiers into **Normal (Green)**, **Alert (Yellow)**, **Warning (Orange)**, and **Severe (Red)** with $\approx 91\%$ accuracy and $0.88$ Weighted F1 score.
  * **Dynamic Antecedent Precipitation Index (API):** Models cumulative soil saturation and 24h/72h rainfall and water level temporal lags.
* **Utility-Maximizing Autonomous Agent:**
  * Implements a multi-objective disaster utility function:
    $$U(a) = 100 - \big[ w_1 \cdot \text{CasualtyRisk}(a) + w_2 \cdot \text{LivestockRisk}(a) + w_3 \cdot \text{AgriLoss}(a) + w_4 \cdot \text{FalseAlarmCost}(a) + w_5 \cdot \text{OverloadPenalty}(a) \big]$$
  * Balances human life protection ($w_1=10.0$), livestock security ($w_2=4.0$), agrarian protection ($w_3=1.5$), evacuation panic avoidance ($w_4=1.0$), and shelter overcrowding penalties ($w_5=3.0$).
* **Civil Operations & Mission Control Frontend:**
  * High-fidelity, responsive Single-Page Application (SPA) with dark/light themes.
  * Six dedicated operational views: **Command Center**, **Analyze (Scenario Simulator)**, **Situation**, **Response**, **Alerts**, and **History**.
  * Zero build-step requirement (pure modern ES6 JavaScript + Vanilla CSS design tokens).
* **Multi-Lingual NDMA CAP-SACHET Broadcasting:**
  * Auto-generates standardized emergency broadcast payloads in **English**, **Hindi (हिन्दी)**, and **Odia (ଓଡ଼ିଆ)**.
* **Full-Featured FastAPI REST API:**
  * Real-time inference endpoints, district vulnerability queries, dynamic model retraining, and health telemetry.

---

## Directory Structure

```
AI_SL/
├── backend/
│   ├── __init__.py
│   ├── main.py                        # FastAPI REST API Server with CORS & endpoints
│   └── schemas.py                     # Pydantic request and response schemas
├── frontend/
│   ├── index.html                     # Mission control Single-Page Application shell
│   ├── css/
│   │   ├── tokens.css                 # Color tokens, glassmorphism, spacing, typography
│   │   ├── base.css                   # Header, navigation, layout, shared widgets
│   │   ├── command-center.css         # Command Center styles & gauge widgets
│   │   ├── analyze.css                # Scenario simulation sliders & controls
│   │   ├── situation.css              # Hydrological gauge dials & threshold cards
│   │   ├── response.css               # Utility breakdown, shelter tables, NDRF grid
│   │   ├── alerts.css                 # CAP-SACHET multi-lingual broadcast cards
│   │   └── history.css                # Telemetry timeline & model evaluation cards
│   └── js/
│       ├── api.js                     # REST API client connecting to FastAPI backend
│       ├── app.js                     # Application entry point & theme management
│       ├── router.js                  # View routing & active tab coordination
│       ├── state.js                   # Reactive state store & scenario presets
│       └── views/
│           ├── commandCenterView.js   # Real-time overview & action directives
│           ├── analyzeView.js         # Scenario stress testing & custom feature controls
│           ├── situationView.js       # CWC gauge benchmarks & crest safety buffers
│           ├── responseView.js        # Shelter optimization & NDRF battalion logistics
│           ├── alertsView.js          # Multi-lingual CAP-SACHET broadcast manager
│           └── historyView.js         # Historical monsoon crest logs & feature importances
├── data/
│   ├── raw/
│   │   ├── imd_weather_data.csv       # IMD Gridded Rainfall, Temp, Pressure, Wind
│   │   ├── cwc_river_gauges.csv       # CWC River Stage, Discharge & Dam Releases
│   │   └── district_vulnerability.csv # Taluk Demographics, Kutchha Houses, Shelters
│   └── processed/
│       └── processed_training_data.csv# Aligned features with temporal lags & API indices
├── src/
│   ├── __init__.py
│   ├── config.py                      # CWC Thresholds, Hazard Tiers & Utility Weights
│   ├── data_loader.py                 # Dataset ingestion & synthetic Indian generator
│   ├── feature_engineering.py         # Antecedent Precipitation Index (API) & rolling lags
│   ├── train_models.py                # ML Training pipeline (Regressor + Classifier)
│   └── agent_core.py                  # Utility Function Maximizer & SACHET Alert Engine
├── models/
│   ├── flood_crest_regressor.joblib   # Trained Random Forest Regressor artifact
│   ├── hazard_classifier.joblib       # Trained Gradient Boosting Classifier artifact
│   ├── feature_scaler.joblib          # StandardScaler normalization artifact
│   └── model_metrics.json             # MAE, RMSE, R2, Accuracy, F1-Scores, Top Features
├── tests/
│   ├── __init__.py
│   └── test_agent.py                  # Comprehensive unit & integration test suite
├── PROJECT_REPORT.md                  # Complete 8-point academic project report
├── requirements.txt                   # Production Python dependencies
└── README.md                          # Project documentation & operational guide
```

---

## Quickstart Guide

### 1. Environment Setup & Dependency Installation
Ensure Python 3.10+ is installed:
```bash
# Clone or navigate to the project directory
cd AI_SL

# Create and activate a virtual environment (optional but recommended)
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

### 2. (Optional) Re-train the Machine Learning Models
To run the full training pipeline across historical IMD and CWC data:
```bash
python -m src.train_models
```
*Outputs generated in `models/`:*
* `flood_crest_regressor.joblib` (Random Forest Regressor, MAE $\approx 0.62\text{ m}$, $R^2 \approx 0.67$)
* `hazard_classifier.joblib` (Gradient Boosting Classifier, Accuracy $\approx 91\%$, F1 $\approx 0.88$)
* `feature_scaler.joblib` & `model_metrics.json`

### 3. Run the Automated Verification Suite
Verify data pipelines, ML inferences, utility optimization, and backend handlers:
```bash
python tests/test_agent.py
```
*(All 7 unit and integration tests execute and pass in under 1 second).*

### 4. Start the FastAPI Backend Server
Start the backend REST API with auto-reload:
```bash
python -m backend.main
```
Or directly with Uvicorn:
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
* API Server runs at: `http://127.0.0.1:8000`
* Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
* ReDoc Specification: `http://127.0.0.1:8000/redoc`

### 5. Launch the Civil Defense Dashboard (Frontend)
In a separate terminal window, serve the frontend:
```bash
python -m http.server 3000 --directory frontend
```
Open your browser at: **`http://localhost:3000`**

---

## Frontend Mission Control Dashboard

The UI provides emergency commanders with six integrated operational modules:

1. **Command Center:**
   * Live operational hazard banner (Normal, Alert, Warning, Severe).
   * Key telemetry indicators: Rainfall, Dam Inflow/Outflow, River Stage, API Soil Moisture.
   * Executive Directives Checklist for rapid district deployment.
2. **Analyze (Scenario Stress Simulator):**
   * Instant pre-set loading:
     * *Preset 1: Dry Pre-Monsoon Baseline (Normal)*
     * *Preset 2: Active Monsoon Rainfall (Alert)*
     * *Preset 3: Severe Cyclonic Depression (Warning)*
     * *Preset 4: Catastrophic Super Cyclone (Severe)*
   * 19 interactive sliders for weather variables, river stages, dam outflows, and rain lags.
   * One-click "Execute Agent Decision Cycle" assessing real-time utility.
3. **Situation:**
   * CWC benchmark comparative gauges against **Warning Level (26.50m)**, **Danger Level (27.50m)**, and **Historical High Flood Level (29.20m)**.
   * Real-time calculation of safety buffer / crest breach status.
4. **Response:**
   * Expected Utility Score breakdown ($U(Action)$) across lives, livestock, crops, and panic.
   * Taluk shelter distribution table with capacity utilization meters and overflow safeguards.
   * NDRF battalion and motorized rescue boat mobilization matrix.
   * Hirakud Dam outflow throttling advisory.
5. **Alerts:**
   * NDMA CAP-SACHET multi-lingual emergency broadcasting cards.
   * Formatted emergency dispatches in **English**, **Hindi (हिन्दी)**, and **Odia (ଓଡ଼ିଆ)** with one-click copy.
6. **History:**
   * Chronological river stage telemetry log across monsoon crest events.
   * Model evaluation scorecards (MAE, RMSE, $R^2$, Accuracy, F1).
   * Feature importance bar charts highlighting primary hydrological drivers.

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root service descriptor and endpoint directory. |
| `GET` | `/health` | Health telemetry, model loading state, and CWC basin thresholds. |
| `POST` | `/agent/run-decision-cycle` | **Primary Agent Cycle:** Senses 19 weather/hydrological features, runs ML models, deliberates utility, and outputs action directives. |
| `POST` | `/predict/crest` | Predicts expected downstream peak crest stage ($H_{\text{pred}}$) in 24 hours. |
| `POST` | `/predict/hazard` | Classifies hazard tier (Normal, Alert, Warning, Severe) with class probabilities. |
| `GET` | `/data/districts` | Returns taluk demographic vulnerability, % kutchha housing, and shelter capacities. |
| `GET` | `/models/metrics` | Returns active ML validation metrics (MAE, RMSE, $R^2$, Accuracy, F1, Top Features). |
| `POST` | `/models/retrain` | Triggers retraining pipeline and hot-reloads model weights in memory. |

### Sample Decision Cycle Request (`POST /agent/run-decision-cycle`)
```json
{
  "rainfall_imd_mm": 185.0,
  "temp_max_c": 31.0,
  "pressure_hpa": 994.0,
  "wind_speed_kmh": 65.0,
  "relative_humidity_pct": 98.0,
  "upstream_dam_outflow_cumec": 14500.0,
  "discharge_cumec": 22000.0,
  "water_level_m": 27.10,
  "api_soil_moisture": 240.0,
  "rain_lag1_mm": 110.0,
  "rain_lag2_mm": 85.0,
  "rain_cum_3d_mm": 380.0,
  "rain_cum_7d_mm": 520.0,
  "water_level_lag1_m": 25.80,
  "water_level_delta_24h": 1.30,
  "discharge_rolling_3d": 19500.0,
  "dam_outflow_rolling_2d": 13000.0,
  "pressure_drop_hpa": 19.25,
  "storm_wind_flag": 1
}
```

---

## Academic Project Report

A comprehensive 8-point theoretical and engineering report covering:
1. **Problem Definition** (Hydrometeorological vulnerability in India, institutional bottlenecks)
2. **PEAS Model Analysis** (Performance, Environment, Actuators, Sensors)
3. **Type of Intelligent Agent** (Mathematical justification for Utility-Based Learning Agent)
4. **Agent Architecture & Block Diagram** (Mermaid architecture diagram)
5. **Working of the Agent** (Sense-Think-Deliberate-Act cycle)
6. **Input and Output Specifications** (Feature telemetry & actuator signals)
7. **Real-Life Application & Case Study** (Coastal Odisha monsoon flood scenario)
8. **Advantages & Limitations** (Cultural modeling, trans-boundary latency mitigations)

Refer to [`PROJECT_REPORT.md`](PROJECT_REPORT.md) for the complete academic document.
