# python -m backend.main"""
# Suraksha-AI FastAPI Backend Server
# Provides RESTful APIs for:
# 1. Hydrometeorological inference (Flood crest regression & hazard classification)
# 2. Agent Utility Decision Engine (NDRF allocation, shelter routing, CAP-SACHET alerts)
# 3. District vulnerability records & ML model performance metrics
# """

import json
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from src.config import (
    MODEL_METADATA_PATH,
    DISTRICT_VULNERABILITY_FILE,
    CWC_THRESHOLDS,
    HAZARD_TIERS
)
from src.agent_core import SurakshaAIAgent
from src.train_models import train_models
from backend.schemas import (
    WeatherHydrologyInput,
    PredictionResponse,
    DecisionPlanResponse,
    AgentCycleResponse,
    RetrainResponse
)

# Initialize FastAPI App
app = FastAPI(
    title="Suraksha-AI: Disaster Management Agent Backend",
    description=(
        "Production-grade Backend & Decision Engine for Indian Monsoon Flood & "
        "Extreme Weather Management (CWC & IMD Benchmarks)."
    ),
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Agent Instance
agent = SurakshaAIAgent()


@app.get("/", tags=["System"])
def root():
    return {
        "system": "Suraksha-AI (सुरक्षा-AI)",
        "role": "India-Oriented Disaster Management Intelligent Agent Backend",
        "status": "Online",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "decision_cycle": "POST /agent/run-decision-cycle",
            "predict_crest": "POST /predict/crest",
            "vulnerable_districts": "GET /data/districts",
            "model_metrics": "GET /models/metrics"
        }
    }


@app.get("/health", tags=["System"])
def health_check():
    models_loaded = (agent.regressor is not None and agent.classifier is not None)
    return {
        "status": "healthy" if models_loaded else "degraded",
        "models_loaded": models_loaded,
        "basin": "Mahanadi River Basin (Mundali Barrage, Cuttack)",
        "benchmarks": CWC_THRESHOLDS
    }


@app.post("/predict/crest", response_model=dict, tags=["ML Inference"])
def predict_crest_level(payload: WeatherHydrologyInput):
    """
    Predicts the expected downstream river stage height (meters) in 24 hours.
    """
    try:
        feature_dict = payload.model_dump()
        prediction = agent.predict_hydrological_state(feature_dict)
        return {
            "predicted_crest_m": prediction["predicted_crest_m"],
            "buffer_to_danger_level_m": prediction["buffer_to_danger_level_m"],
            "is_danger_breached": prediction["is_danger_breached"],
            "cwc_danger_level_m": CWC_THRESHOLDS["DANGER_LEVEL_M"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/hazard", response_model=dict, tags=["ML Inference"])
def predict_hazard_tier(payload: WeatherHydrologyInput):
    """
    Classifies the flood hazard into Green (Normal), Yellow (Alert), Orange (Warning), or Red (Severe).
    """
    try:
        feature_dict = payload.model_dump()
        prediction = agent.predict_hydrological_state(feature_dict)
        return {
            "hazard_tier_code": prediction["hazard_tier_code"],
            "hazard_tier_name": prediction["hazard_tier_name"],
            "hazard_color": prediction["hazard_color"],
            "probabilities": prediction["class_probabilities"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/run-decision-cycle", response_model=AgentCycleResponse, tags=["Intelligent Agent"])
def run_agent_decision_cycle(payload: WeatherHydrologyInput):
    """
    Executes the complete Intelligent Agent reasoning loop:
    1. Senses multi-modal weather & river features.
    2. Thinks: Runs ML prediction on downstream flood crest level.
    3. Deliberates: Maximizes Disaster Utility Function U(Action).
    4. Acts: Emits CAP-SACHET multi-lingual alerts, shelter allocations, and NDRF battalion dispatch schedules.
    """
    try:
        feature_dict = payload.model_dump()
        dam_outflow = payload.upstream_dam_outflow_cumec
        result = agent.run_cycle(feature_dict, dam_outflow=dam_outflow)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/data/districts", tags=["Data Repositories"])
def get_vulnerable_districts():
    """
    Returns demographic vulnerability, kutchha housing percentage, and shelter capacities across target taluks.
    """
    if not DISTRICT_VULNERABILITY_FILE.exists():
        raise HTTPException(status_code=404, detail="District vulnerability data not found.")
    df = pd.read_csv(DISTRICT_VULNERABILITY_FILE)
    return df.to_dict(orient="records")


@app.get("/models/metrics", tags=["ML Evaluation"])
def get_model_metrics():
    """
    Returns the latest training evaluation metrics (MAE, RMSE, R2, Accuracy, F1-Score, Top Features).
    """
    if not MODEL_METADATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Model metrics file not found. Run /models/retrain first.")
    with open(MODEL_METADATA_PATH, "r") as f:
        metrics = json.load(f)
    return metrics


@app.post("/models/retrain", response_model=RetrainResponse, tags=["ML Training"])
def retrain_models_endpoint(background_tasks: BackgroundTasks):
    """
    Triggers model retraining pipeline and reloads model weights into the agent.
    """
    try:
        metrics = train_models()
        agent._load_agent_assets() # Hot-reload models
        return {
            "status": "Successfully retrained and reloaded models.",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
