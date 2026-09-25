"""
Suraksha-AI Intelligent Agent Core Module
Implements the Utility-Based Decision Engine:
1. Evaluates incoming hydrometeorological state using trained ML models.
2. Assesses vulnerability across districts using Census/SECC datasets.
3. Maximizes Indian Disaster Utility Function U(Action).
4. Generates NDMA CAP-SACHET compliant multi-lingual emergency alerts.
5. Optimizes NDRF/SDRF team deployments and shelter space allocations.
"""

import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from datetime import datetime

from src.config import (
    REGRESSOR_MODEL_PATH,
    CLASSIFIER_MODEL_PATH,
    SCALER_PATH,
    DISTRICT_VULNERABILITY_FILE,
    CWC_THRESHOLDS,
    HAZARD_TIERS,
    UTILITY_WEIGHTS
)
from src.feature_engineering import FEATURE_COLUMNS


class SurakshaAIAgent:
    """
    Utility-Based Intelligent Agent for Indian Flood & Cyclone Disaster Management.
    """

    def __init__(self):
        self.regressor = None
        self.classifier = None
        self.scaler = None
        self.vulnerability_df = None
        self._load_agent_assets()

    def _load_agent_assets(self):
        """Loads trained ML models, scalers, and district demographics."""
        if REGRESSOR_MODEL_PATH.exists() and CLASSIFIER_MODEL_PATH.exists() and SCALER_PATH.exists():
            self.regressor = joblib.load(REGRESSOR_MODEL_PATH)
            self.classifier = joblib.load(CLASSIFIER_MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)
        else:
            print("[!] Warning: ML models not found. Run train_models.py first.")

        if DISTRICT_VULNERABILITY_FILE.exists():
            self.vulnerability_df = pd.read_csv(DISTRICT_VULNERABILITY_FILE)
        else:
            self.vulnerability_df = pd.DataFrame()

    def predict_hydrological_state(self, feature_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Runs ML inference on incoming weather and hydrological readings.
        """
        if self.regressor is None or self.classifier is None or self.scaler is None:
            self._load_agent_assets()
            if self.regressor is None:
                raise RuntimeError("Models are not trained. Please run training pipeline first.")

        # Prepare feature vector as DataFrame with feature names
        feature_df = pd.DataFrame([[feature_dict.get(col, 0.0) for col in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
        scaled_features = self.scaler.transform(feature_df)

        # 1. Regress predicted crest height (meters)
        predicted_crest_m = float(self.regressor.predict(scaled_features)[0])

        # 2. Classify hazard severity tier (0, 1, 2, 3)
        predicted_tier_idx = int(self.classifier.predict(scaled_features)[0])
        tier_probs = self.classifier.predict_proba(scaled_features)[0].tolist()

        tier_info = HAZARD_TIERS.get(predicted_tier_idx, HAZARD_TIERS[0])

        # Calculate buffer to Danger Level (DL = 27.50m)
        dl = CWC_THRESHOLDS["DANGER_LEVEL_M"]
        hfl = CWC_THRESHOLDS["HIGHEST_FLOOD_LEVEL_M"]
        buffer_to_dl_m = round(predicted_crest_m - dl, 2)

        return {
            "predicted_crest_m": round(predicted_crest_m, 2),
            "hazard_tier_code": predicted_tier_idx,
            "hazard_tier_name": tier_info["name"],
            "hazard_color": tier_info["color"],
            "class_probabilities": {
                HAZARD_TIERS[i]["name"]: round(prob, 4) for i, prob in enumerate(tier_probs)
            },
            "buffer_to_danger_level_m": buffer_to_dl_m,
            "is_danger_breached": predicted_crest_m >= dl,
            "is_hfl_breached": predicted_crest_m >= hfl
        }

    def evaluate_utility_and_plan(self, prediction: Dict[str, Any], current_dam_outflow: float) -> Dict[str, Any]:
        """
        Utility Function Decision Engine:
        U(a) = - [w_life * CasualtyRisk + w_livestock * CattleRisk + w_crop * AgLoss + w_panic * Disruption]
        Finds the optimal action plan for civil defense, NDRF deployment, and shelter logistics.
        """
        tier = prediction["hazard_tier_code"]
        crest_m = prediction["predicted_crest_m"]
        danger_m = CWC_THRESHOLDS["DANGER_LEVEL_M"]

        action_plan = {
            "timestamp": datetime.now().isoformat(),
            "hazard_tier": prediction["hazard_tier_name"],
            "predicted_crest_m": crest_m,
            "primary_directives": [],
            "dam_discharge_advisory": {},
            "ndrf_deployment": [],
            "shelter_allocation": [],
            "cap_sachet_alerts": {},
            "utility_metrics": {}
        }

        # 1. Dam Outflow Rule-Curve Advisory
        if crest_m >= danger_m and current_dam_outflow > 5000:
            recommended_dam_outflow = max(2000.0, current_dam_outflow * 0.6)
            dam_action = (
                f"Advisory: Reduce Hirakud Dam outflow to {recommended_dam_outflow:.0f} cumecs. "
                "Downstream reaches at Mundali are peaking. Hold reservoir storage temporarily."
            )
        elif crest_m < CWC_THRESHOLDS["WARNING_LEVEL_M"]:
            recommended_dam_outflow = current_dam_outflow
            dam_action = "Routine reservoir discharge within safe hydro-electric generation capacity."
        else:
            recommended_dam_outflow = current_dam_outflow
            dam_action = "Maintain continuous vigil on reservoir inflows. Prepare sluice gates for controlled regulation."

        action_plan["dam_discharge_advisory"] = {
            "current_outflow_cumec": current_dam_outflow,
            "recommended_outflow_cumec": recommended_dam_outflow,
            "advisory_directive": dam_action
        }

        # 2. Risk Assessment across Taluks
        if self.vulnerability_df is not None and not self.vulnerability_df.empty:
            total_at_risk_population = 0
            total_at_risk_cattle = 0
            ndrf_allocations = []
            shelter_plans = []

            for _, row in self.vulnerability_df.iterrows():
                taluk = row["sub_division_taluk"]
                district = row["district_name"]
                pop = int(row["population"])
                kutchha_pct = float(row["kutchha_house_pct"])
                cattle = int(row["cattle_population"])
                elevation = float(row["avg_elevation_m"])
                shelter_capacity = int(row["total_shelter_capacity"])

                # Vulnerability score calculation: lower elevation + higher kutchha houses
                elevation_risk_factor = max(0.1, (30.0 - elevation) / 20.0)
                vulnerability_score = (kutchha_pct / 100.0) * 0.6 + elevation_risk_factor * 0.4

                # Estimate vulnerable evacuees based on hazard tier
                evac_ratio_map = {0: 0.0, 1: 0.05, 2: 0.25, 3: 0.65}
                estimated_evacuees = int(pop * evac_ratio_map[tier] * vulnerability_score)
                estimated_cattle_evac = int(cattle * evac_ratio_map[tier] * 0.7)

                total_at_risk_population += estimated_evacuees
                total_at_risk_cattle += estimated_cattle_evac

                # Shelter Allocation & Capacity Check
                utilization_pct = round((estimated_evacuees / shelter_capacity) * 100, 1) if shelter_capacity > 0 else 0
                shelter_status = "Adequate" if utilization_pct <= 95 else "OVERLOADED - Expand to Schools"

                shelter_plans.append({
                    "district": district,
                    "taluk": taluk,
                    "target_evacuees": estimated_evacuees,
                    "target_cattle": estimated_cattle_evac,
                    "shelter_capacity": shelter_capacity,
                    "capacity_utilization_pct": utilization_pct,
                    "status": shelter_status
                })

                # NDRF Deployment (1 NDRF team per ~15,000 evacuees or high risk)
                if tier >= 2 and estimated_evacuees > 2000:
                    teams_needed = max(1, int(np.ceil(estimated_evacuees / 15000)))
                    boats_needed = teams_needed * 5
                    ndrf_allocations.append({
                        "district": district,
                        "taluk": taluk,
                        "ndrf_teams_deployed": teams_needed,
                        "rescue_boats_assigned": boats_needed,
                        "mobilization_priority": "High" if tier == 3 else "Medium"
                    })

            action_plan["ndrf_deployment"] = ndrf_allocations
            action_plan["shelter_allocation"] = shelter_plans

            # 3. Calculate Utility Score for Selected Action Plan
            # Penalty components:
            penalty_life = (total_at_risk_population * 0.0001) if tier == 3 else 0.0
            penalty_cattle = (total_at_risk_cattle * 0.00005)
            penalty_disruption = (total_at_risk_population * 0.00002) if tier >= 2 else 0.0
            calculated_utility = 100.0 - (
                UTILITY_WEIGHTS["W_LIFE"] * penalty_life +
                UTILITY_WEIGHTS["W_LIVESTOCK"] * penalty_cattle +
                UTILITY_WEIGHTS["W_FALSE_ALARM"] * penalty_disruption
            )
            action_plan["utility_metrics"] = {
                "total_estimated_evacuees": total_at_risk_population,
                "total_cattle_at_risk": total_at_risk_cattle,
                "expected_utility_score": round(max(0.0, calculated_utility), 2)
            }

        # 4. Generate Multi-Lingual NDMA CAP-SACHET Emergency Alerts
        action_plan["cap_sachet_alerts"] = self._generate_sachet_alerts(prediction, crest_m)

        # 5. Primary Directives for Civil Administration
        if tier == 0:
            action_plan["primary_directives"] = [
                "Maintain normal river monitoring protocols.",
                "Continue daily IMD gridded telemetry updates."
            ]
        elif tier == 1:
            action_plan["primary_directives"] = [
                "Issue Advisory to District Collectors of Cuttack, Kendrapara, Jagatsinghpur.",
                "Inspect operational readiness of Multi-purpose Cyclone & Flood Shelters.",
                "Alert SDRF units to remain on standby."
            ]
        elif tier == 2:
            action_plan["primary_directives"] = [
                "Activate District Emergency Operations Centers (DEOCs) 24x7.",
                "Initiate pre-emptive evacuation in low-lying riparian taluks (Banki, Aul, Rajnagar).",
                "Deploy NDRF teams with motorized inflatable boats to strategic staging locations.",
                "Broadcast CAP-SACHET Alert (Orange Tier) via local telecom towers."
            ]
        else: # Severe
            action_plan["primary_directives"] = [
                "STATE OF EMERGENCY: Enforce mandatory evacuation along Mahanadi floodplains.",
                "Mobilize full NDRF, SDRF, and Indian Army Engineering Columns.",
                "Suspend river ferry services and close inundated causeways.",
                "Broadcast emergency sirens and Red Alert Cell Broadcast messages to all active mobile devices."
            ]

        return action_plan

    def _generate_sachet_alerts(self, prediction: Dict[str, Any], crest_m: float) -> Dict[str, str]:
        """
        Generates standard NDMA CAP-SACHET alerts in English, Hindi, and Odia.
        """
        tier_name = prediction["hazard_tier_name"]

        # English
        alert_en = (
            f"[NDMA / OSDMA SACHET ALERT - {tier_name}] "
            f"Mahanadi river water level at Mundali is projected to reach {crest_m:.2f}m in next 24 hours. "
            "Residents in low-lying riverine areas are advised to stay alert and move to nearest Cyclone/Flood Shelters. "
            "Helpline: 1070 / 112."
        )

        # Hindi (हिन्दी)
        alert_hi = (
            f"[एनडीएमए सचेत चेतावनी - {tier_name}] "
            f"मुंडाली (महानदी) में जलस्तर अगले 24 घंटों में {crest_m:.2f} मीटर तक पहुंचने का अनुमान है। "
            "तटीय और निचले इलाकों के निवासी तुरंत सुरक्षित बाढ़ आश्रय स्थलों में जाएं। "
            "आपातकालीन नंबर: 1070 / 112।"
        )

        # Odia (ଓଡ଼ିଆ)
        alert_or = (
            f"[ଏନଡିଏମଏ ସଚେତ ସତର୍କତା - {tier_name}] "
            f"ମୁଣ୍ଡଳୀ ବ୍ୟାରେଜ୍ ଠାରେ ମହାନଦୀର ଜଳସ୍ତର ଆଗାମୀ ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ {crest_m:.2f} ମିଟର ଛୁଇଁବା ଆଶଙ୍କା ରହିଛି। "
            "ତଳିଆ ଅଞ୍ଚଳବାସୀ ସତର୍କ ରୁହନ୍ତୁ ଏବଂ ନିକଟସ୍ଥ ବନ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀକୁ ଯାଆନ୍ତୁ। "
            "ଜରୁରୀକାଳୀନ ହେଲ୍ପଲାଇନ: ୧୦୭୦ / ୧୧୨।"
        )

        return {
            "en": alert_en,
            "hi": alert_hi,
            "or": alert_or,
            "severity": tier_name,
            "cap_identifier": f"IN-NDMA-OD-MHD-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        }

    def run_cycle(self, input_features: Dict[str, float], dam_outflow: float = 6500.0) -> Dict[str, Any]:
        """Full Agent execution loop: Sense -> Think -> Deliberate -> Act."""
        prediction = self.predict_hydrological_state(input_features)
        plan = self.evaluate_utility_and_plan(prediction, current_dam_outflow=dam_outflow)
        return {
            "prediction": prediction,
            "plan": plan
        }


if __name__ == "__main__":
    agent = SurakshaAIAgent()
    
    # Test sample scenario: High monsoon rainfall + heavy upstream dam discharge
    sample_monsoon_event = {
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

    print("[*] Running Suraksha-AI Decision Cycle on High Flood Event...")
    result = agent.run_cycle(sample_monsoon_event, dam_outflow=14500.0)
    print("\n--- PREDICTION ---")
    print(f"Predicted Crest Level: {result['prediction']['predicted_crest_m']} m")
    print(f"Hazard Tier: {result['prediction']['hazard_tier_name']} ({result['prediction']['hazard_color']})")
    print(f"Buffer to Danger Level (27.50m): {result['prediction']['buffer_to_danger_level_m']} m")

    print("\n--- MITIGATION PLAN ---")
    print(f"Expected Utility Score: {result['plan']['utility_metrics'].get('expected_utility_score')}")
    print(f"Total Target Evacuees: {result['plan']['utility_metrics'].get('total_estimated_evacuees')}")
    print(f"NDRF Deployments: {len(result['plan']['ndrf_deployment'])} taluks")
    print(f"English Alert: {result['plan']['cap_sachet_alerts']['en']}")

