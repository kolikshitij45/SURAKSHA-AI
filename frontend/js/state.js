/**
 * SURAKSHA-AI State Management & Local Analysis History
 * Stores active analysis, persistent history in localStorage, and district data.
 */

const LOCAL_STORAGE_HISTORY_KEY = 'suraksha_local_history';

export const TEST_SCENARIOS = {
  normal: {
    id: 'normal',
    name: 'TEST SCENARIO: Normal Monsoon Baseline',
    tierLabel: 'NORMAL',
    dotClass: 'dot-normal',
    description: 'Routine monsoon conditions well within safe hydrological thresholds.',
    values: {
      rainfall_imd_mm: 45.0,
      temp_max_c: 32.0,
      pressure_hpa: 1005.0,
      wind_speed_kmh: 18.0,
      relative_humidity_pct: 78.0,
      upstream_dam_outflow_cumec: 3200.0,
      discharge_cumec: 6500.0,
      water_level_m: 23.50,
      api_soil_moisture: 95.0,
      rain_lag1_mm: 25.0,
      rain_lag2_mm: 15.0,
      rain_cum_3d_mm: 85.0,
      rain_cum_7d_mm: 140.0,
      water_level_lag1_m: 23.20,
      water_level_delta_24h: 0.30,
      discharge_rolling_3d: 6200.0,
      dam_outflow_rolling_2d: 3100.0,
      pressure_drop_hpa: 8.25,
      storm_wind_flag: 0
    }
  },
  alert: {
    id: 'alert',
    name: 'TEST SCENARIO: Upstream Catchment Surge (Alert)',
    tierLabel: 'ALERT',
    dotClass: 'dot-alert',
    description: 'Catchment precipitation with rising inflows approaching Warning Level.',
    values: {
      rainfall_imd_mm: 110.0,
      temp_max_c: 30.5,
      pressure_hpa: 1001.0,
      wind_speed_kmh: 35.0,
      relative_humidity_pct: 88.0,
      upstream_dam_outflow_cumec: 7500.0,
      discharge_cumec: 13200.0,
      water_level_m: 26.60,
      api_soil_moisture: 165.0,
      rain_lag1_mm: 75.0,
      rain_lag2_mm: 45.0,
      rain_cum_3d_mm: 230.0,
      rain_cum_7d_mm: 310.0,
      water_level_lag1_m: 25.40,
      water_level_delta_24h: 1.20,
      discharge_rolling_3d: 11800.0,
      dam_outflow_rolling_2d: 6800.0,
      pressure_drop_hpa: 12.25,
      storm_wind_flag: 0
    }
  },
  warning: {
    id: 'warning',
    name: 'TEST SCENARIO: Heavy Downpour & Reservoir Release (Warning)',
    tierLabel: 'WARNING',
    dotClass: 'dot-warning',
    description: 'Widespread torrential rain with heavy dam discharge breaching Danger Level.',
    values: {
      rainfall_imd_mm: 185.0,
      temp_max_c: 29.0,
      pressure_hpa: 994.0,
      wind_speed_kmh: 48.0,
      relative_humidity_pct: 95.0,
      upstream_dam_outflow_cumec: 12500.0,
      discharge_cumec: 19500.0,
      water_level_m: 27.65,
      api_soil_moisture: 240.0,
      rain_lag1_mm: 120.0,
      rain_lag2_mm: 90.0,
      rain_cum_3d_mm: 395.0,
      rain_cum_7d_mm: 530.0,
      water_level_lag1_m: 26.20,
      water_level_delta_24h: 1.45,
      discharge_rolling_3d: 17200.0,
      dam_outflow_rolling_2d: 11500.0,
      pressure_drop_hpa: 19.25,
      storm_wind_flag: 1
    }
  },
  severe: {
    id: 'severe',
    name: 'TEST SCENARIO: Extreme Cyclone & Flooding (Severe)',
    tierLabel: 'SEVERE',
    dotClass: 'dot-severe',
    description: 'Severe cyclonic storm surge and peak reservoir outflow threatening HFL breach.',
    values: {
      rainfall_imd_mm: 280.0,
      temp_max_c: 27.5,
      pressure_hpa: 982.0,
      wind_speed_kmh: 75.0,
      relative_humidity_pct: 99.0,
      upstream_dam_outflow_cumec: 17500.0,
      discharge_cumec: 28000.0,
      water_level_m: 29.40,
      api_soil_moisture: 320.0,
      rain_lag1_mm: 180.0,
      rain_lag2_mm: 140.0,
      rain_cum_3d_mm: 600.0,
      rain_cum_7d_mm: 820.0,
      water_level_lag1_m: 27.80,
      water_level_delta_24h: 1.60,
      discharge_rolling_3d: 24500.0,
      dam_outflow_rolling_2d: 16000.0,
      pressure_drop_hpa: 31.25,
      storm_wind_flag: 1
    }
  }
};

class StateStore {
  constructor() {
    this.history = this._loadHistoryFromStorage();
    
    // If persistent history exists, restore latest run on startup
    if (this.history.length > 0) {
      const latest = this.history[0];
      this.currentAnalysis = latest.result || this._reconstructResult(latest);
      this.currentInputs = { ...(latest.inputs || TEST_SCENARIOS.normal.values) };
    } else {
      this.currentAnalysis = null;
      this.currentInputs = { ...TEST_SCENARIOS.normal.values };
    }

    this.districts = [];
    this.activeTab = 'command-center';
    this.selectedAlertLang = 'en';
    this.listeners = [];
  }

  _loadHistoryFromStorage() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse localStorage history:', err);
    }
    return [];
  }

  _saveHistoryToStorage() {
    try {
      // Keep up to 50 most recent local analyses
      const trimmed = this.history.slice(0, 50);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('Failed to save history to localStorage:', err);
    }
  }

  _reconstructResult(item) {
    return {
      prediction: {
        predicted_crest_m: item.predicted_crest_m,
        hazard_tier_code: item.hazard_tier_code,
        hazard_tier_name: item.hazard_tier_name,
        hazard_color: item.hazard_color,
        class_probabilities: item.class_probabilities || {},
        buffer_to_danger_level_m: item.buffer_to_danger_level_m,
        is_danger_breached: item.is_danger_breached,
        is_hfl_breached: item.is_hfl_breached
      },
      plan: {
        timestamp: item.timestamp,
        hazard_tier: item.hazard_tier_name,
        predicted_crest_m: item.predicted_crest_m,
        primary_directives: item.primary_directives || [],
        dam_discharge_advisory: item.dam_discharge_advisory || {},
        ndrf_deployment: item.ndrf_deployment || [],
        shelter_allocation: item.shelter_allocation || [],
        cap_sachet_alerts: item.cap_sachet_alerts || {},
        utility_metrics: item.utility_metrics || {}
      }
    };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  setAnalysis(analysisResult, inputs) {
    this.currentAnalysis = analysisResult;
    if (inputs) {
      this.currentInputs = { ...inputs };
    }

    // Build comprehensive persistent history record
    const historyItem = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: analysisResult.plan?.timestamp || new Date().toISOString(),
      inputs: { ...this.currentInputs },
      predicted_crest_m: analysisResult.prediction.predicted_crest_m,
      hazard_tier_code: analysisResult.prediction.hazard_tier_code,
      hazard_tier_name: analysisResult.prediction.hazard_tier_name,
      hazard_color: analysisResult.prediction.hazard_color,
      class_probabilities: { ...analysisResult.prediction.class_probabilities },
      buffer_to_danger_level_m: analysisResult.prediction.buffer_to_danger_level_m,
      is_danger_breached: analysisResult.prediction.is_danger_breached,
      is_hfl_breached: analysisResult.prediction.is_hfl_breached,
      primary_directives: [...(analysisResult.plan?.primary_directives || [])],
      dam_discharge_advisory: { ...(analysisResult.plan?.dam_discharge_advisory || {}) },
      ndrf_deployment: [...(analysisResult.plan?.ndrf_deployment || [])],
      shelter_allocation: [...(analysisResult.plan?.shelter_allocation || [])],
      cap_sachet_alerts: { ...(analysisResult.plan?.cap_sachet_alerts || {}) },
      utility_metrics: { ...(analysisResult.plan?.utility_metrics || {}) },
      result: analysisResult
    };

    // Prepend (newest first)
    this.history.unshift(historyItem);
    this._saveHistoryToStorage();

    this.notify('ANALYSIS_UPDATED', this.currentAnalysis);
    this.notify('HISTORY_UPDATED', this.history);
  }

  clearHistory() {
    this.history = [];
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }
    this.notify('HISTORY_UPDATED', this.history);
  }

  setDistricts(districts) {
    this.districts = districts;
    this.notify('DISTRICTS_UPDATED', this.districts);
  }

  setActiveTab(tabName) {
    this.activeTab = tabName;
    this.notify('TAB_CHANGED', this.activeTab);
  }

  setAlertLang(langCode) {
    this.selectedAlertLang = langCode;
    this.notify('ALERT_LANG_CHANGED', this.selectedAlertLang);
  }

  loadHistoricalRun(historyId) {
    const item = this.history.find(h => h.id === historyId);
    if (item) {
      this.currentAnalysis = item.result || this._reconstructResult(item);
      this.currentInputs = { ...(item.inputs || {}) };
      this.notify('ANALYSIS_UPDATED', this.currentAnalysis);
      this.setActiveTab('command-center');
    }
  }
}

export const appState = new StateStore();
