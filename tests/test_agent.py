"""
Automated Test Suite for Suraksha-AI Backend & ML Pipeline
Uses Python's standard unittest framework for zero-dependency execution.
"""

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.agent_core import SurakshaAIAgent
from backend.main import (
    health_check,
    predict_crest_level,
    predict_hazard_tier,
    run_agent_decision_cycle,
    get_vulnerable_districts,
    get_model_metrics
)
from backend.schemas import WeatherHydrologyInput

SAMPLE_INPUT = {
    "rainfall_imd_mm": 160.0,
    "temp_max_c": 30.5,
    "pressure_hpa": 995.0,
    "wind_speed_kmh": 55.0,
    "relative_humidity_pct": 95.0,
    "upstream_dam_outflow_cumec": 12000.0,
    "discharge_cumec": 20000.0,
    "water_level_m": 27.20,
    "api_soil_moisture": 210.0,
    "rain_lag1_mm": 90.0,
    "rain_lag2_mm": 70.0,
    "rain_cum_3d_mm": 320.0,
    "rain_cum_7d_mm": 450.0,
    "water_level_lag1_m": 26.10,
    "water_level_delta_24h": 1.10,
    "discharge_rolling_3d": 17500.0,
    "dam_outflow_rolling_2d": 11000.0,
    "pressure_drop_hpa": 18.25,
    "storm_wind_flag": 1
}


class TestSurakshaAIAgent(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.agent = SurakshaAIAgent()
        cls.input_model = WeatherHydrologyInput(**SAMPLE_INPUT)

    def test_01_agent_models_loaded(self):
        self.assertIsNotNone(self.agent.regressor, "Regressor model should be loaded.")
        self.assertIsNotNone(self.agent.classifier, "Classifier model should be loaded.")
        self.assertIsNotNone(self.agent.scaler, "Scaler should be loaded.")

    def test_02_health_endpoint(self):
        res = health_check()
        self.assertEqual(res["status"], "healthy")
        self.assertTrue(res["models_loaded"])
        self.assertIn("Mahanadi", res["basin"])

    def test_03_predict_crest_endpoint(self):
        res = predict_crest_level(self.input_model)
        self.assertIn("predicted_crest_m", res)
        self.assertGreaterEqual(res["predicted_crest_m"], 20.0)
        self.assertLessEqual(res["predicted_crest_m"], 32.0)
        self.assertIn("cwc_danger_level_m", res)

    def test_04_predict_hazard_endpoint(self):
        res = predict_hazard_tier(self.input_model)
        self.assertIn("hazard_tier_name", res)
        self.assertIn(res["hazard_tier_name"], ["NORMAL", "ALERT", "WARNING", "SEVERE"])
        self.assertIn("probabilities", res)

    def test_05_decision_cycle_endpoint(self):
        res = run_agent_decision_cycle(self.input_model)
        # Check prediction
        self.assertIsNotNone(res["prediction"]["predicted_crest_m"])
        self.assertIn(res["prediction"]["hazard_color"], ["Green", "Yellow", "Orange", "Red"])

        # Check action plan
        plan = res["plan"]
        self.assertTrue(len(plan["primary_directives"]) > 0)
        self.assertIsNotNone(plan["dam_discharge_advisory"])
        self.assertTrue(len(plan["shelter_allocation"]) > 0)

        # Check multi-lingual CAP-SACHET alerts
        alerts = plan["cap_sachet_alerts"]
        self.assertIn("Mahanadi", alerts["en"])
        self.assertIn("मुंडाली", alerts["hi"])
        self.assertIn("ମୁଣ୍ଡଳୀ", alerts["or"])

    def test_06_district_vulnerability_data(self):
        districts = get_vulnerable_districts()
        self.assertGreaterEqual(len(districts), 5)
        self.assertIn("district_name", districts[0])
        self.assertIn("kutchha_house_pct", districts[0])

    def test_07_model_metrics(self):
        metrics = get_model_metrics()
        self.assertIn("regressor", metrics)
        self.assertIn("classifier", metrics)
        self.assertGreater(metrics["classifier"]["accuracy"], 0.80)
        self.assertLess(metrics["regressor"]["mae_meters"], 1.50)


if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING AUTOMATED UNIT & INTEGRATION TESTS FOR SURAKSHA-AI")
    print("=" * 60)
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSurakshaAIAgent)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n[OK] ALL 7 TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n[FAIL] SOME TESTS FAILED.")
        sys.exit(1)
