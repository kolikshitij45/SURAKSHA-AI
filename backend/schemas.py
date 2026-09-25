"""
Pydantic Data Schemas for Suraksha-AI Backend API
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class WeatherHydrologyInput(BaseModel):
    rainfall_imd_mm: float = Field(..., description="Daily IMD gridded rainfall in mm", ge=0.0, example=120.5)
    temp_max_c: float = Field(32.0, description="Max temperature in Celsius", example=32.5)
    pressure_hpa: float = Field(1002.0, description="Atmospheric pressure in hPa", example=998.0)
    wind_speed_kmh: float = Field(25.0, description="Wind speed in km/h", ge=0.0, example=45.0)
    relative_humidity_pct: float = Field(85.0, description="Relative humidity percentage", ge=0.0, le=100.0, example=92.0)
    upstream_dam_outflow_cumec: float = Field(..., description="Hirakud dam outflow in cumecs (m3/s)", ge=0.0, example=8500.0)
    discharge_cumec: float = Field(..., description="Mundali river discharge in cumecs", ge=0.0, example=14000.0)
    water_level_m: float = Field(..., description="Current river gauge stage in meters", ge=10.0, le=35.0, example=26.80)
    api_soil_moisture: Optional[float] = Field(150.0, description="Antecedent Precipitation Index (soil moisture)", ge=0.0)
    rain_lag1_mm: Optional[float] = Field(50.0, description="Rainfall 24h prior in mm", ge=0.0)
    rain_lag2_mm: Optional[float] = Field(30.0, description="Rainfall 48h prior in mm", ge=0.0)
    rain_cum_3d_mm: Optional[float] = Field(200.0, description="Cumulative 3-day rainfall in mm", ge=0.0)
    rain_cum_7d_mm: Optional[float] = Field(320.0, description="Cumulative 7-day rainfall in mm", ge=0.0)
    water_level_lag1_m: Optional[float] = Field(25.50, description="River gauge level 24h prior in meters")
    water_level_delta_24h: Optional[float] = Field(1.30, description="Change in water level over 24h in meters")
    discharge_rolling_3d: Optional[float] = Field(12000.0, description="3-day average discharge in cumecs")
    dam_outflow_rolling_2d: Optional[float] = Field(7000.0, description="2-day average dam outflow in cumecs")
    pressure_drop_hpa: Optional[float] = Field(11.25, description="Pressure drop below standard sea level (1013.25)")
    storm_wind_flag: Optional[int] = Field(1, description="Binary flag indicating storm-force winds (>45 km/h)", ge=0, le=1)


class PredictionResponse(BaseModel):
    predicted_crest_m: float
    hazard_tier_code: int
    hazard_tier_name: str
    hazard_color: str
    class_probabilities: Dict[str, float]
    buffer_to_danger_level_m: float
    is_danger_breached: bool
    is_hfl_breached: bool


class SachetAlerts(BaseModel):
    en: str
    hi: str
    or_: str = Field(..., alias="or")
    severity: str
    cap_identifier: str


class NDRFDeployment(BaseModel):
    district: str
    taluk: str
    ndrf_teams_deployed: int
    rescue_boats_assigned: int
    mobilization_priority: str


class ShelterAllocation(BaseModel):
    district: str
    taluk: str
    target_evacuees: int
    target_cattle: int
    shelter_capacity: int
    capacity_utilization_pct: float
    status: str


class DamAdvisory(BaseModel):
    current_outflow_cumec: float
    recommended_outflow_cumec: float
    advisory_directive: str


class UtilityMetrics(BaseModel):
    total_estimated_evacuees: int
    total_cattle_at_risk: int
    expected_utility_score: float


class DecisionPlanResponse(BaseModel):
    timestamp: str
    hazard_tier: str
    predicted_crest_m: float
    primary_directives: List[str]
    dam_discharge_advisory: DamAdvisory
    ndrf_deployment: List[NDRFDeployment]
    shelter_allocation: List[ShelterAllocation]
    cap_sachet_alerts: SachetAlerts
    utility_metrics: UtilityMetrics


class AgentCycleResponse(BaseModel):
    prediction: PredictionResponse
    plan: DecisionPlanResponse


class RetrainResponse(BaseModel):
    status: str
    metrics: Dict[str, Any]
