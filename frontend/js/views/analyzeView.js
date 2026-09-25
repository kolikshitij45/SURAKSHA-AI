/**
 * SURAKSHA-AI Analyze View
 * Operational input console organized into logical hydrometeorological groups.
 */

import { appState, TEST_SCENARIOS } from '../state.js';
import { runDecisionCycle } from '../api.js';

export function renderAnalyze(container) {
  const current = appState.currentInputs || TEST_SCENARIOS.normal.values;

  container.innerHTML = `
    <div class="analyze-layout">
      
      <!-- Explicit Test Scenario Selector -->
      <section class="test-scenario-container">
        <div class="test-scenario-header">
          <div class="test-scenario-title-wrap">
            <span class="test-scenario-badge">TEST SCENARIOS</span>
            <span class="test-scenario-desc">
              Pre-configured hydrological scenarios for testing decision response across hazard states.
            </span>
          </div>
        </div>

        <div class="test-preset-buttons">
          <button type="button" class="preset-btn" data-scenario="normal">
            <span class="preset-dot dot-normal"></span>
            <span>Test Scenario: Normal Monsoon Baseline</span>
          </button>
          <button type="button" class="preset-btn" data-scenario="alert">
            <span class="preset-dot dot-alert"></span>
            <span>Test Scenario: Upstream Surge (Alert)</span>
          </button>
          <button type="button" class="preset-btn" data-scenario="warning">
            <span class="preset-dot dot-warning"></span>
            <span>Test Scenario: Heavy Downpour & Dam Release (Warning)</span>
          </button>
          <button type="button" class="preset-btn" data-scenario="severe">
            <span class="preset-dot dot-severe"></span>
            <span>Test Scenario: Extreme Cyclone & Flooding (Severe)</span>
          </button>
        </div>
      </section>

      <!-- Operational Error Banner -->
      <div class="form-error-banner" id="form-error-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span id="form-error-text">Unable to complete analysis. Please verify that the SURAKSHA-AI backend is running and try again.</span>
      </div>

      <!-- 19 Operational Parameter Input Console -->
      <form id="analyze-form">
        
        <div class="input-groups-grid">
          
          <!-- Section A: Weather Conditions -->
          <div class="op-card">
            <div class="op-card-header">
              <h2 class="op-card-title">A. Weather & Atmospheric Conditions</h2>
              <span class="param-helper-text">Meteorological readings</span>
            </div>
            <div class="param-fields-grid">
              
              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-rainfall">Rainfall</label>
                  <span class="param-unit-tag">mm</span>
                </div>
                <input class="param-input" type="number" step="0.1" min="0" id="inp-rainfall" name="rainfall_imd_mm" value="${current.rainfall_imd_mm ?? 120.5}" required />
                <span class="param-helper-text">Daily gridded rainfall over catchment</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-temp">Temperature (Max)</label>
                  <span class="param-unit-tag">°C</span>
                </div>
                <input class="param-input" type="number" step="0.1" id="inp-temp" name="temp_max_c" value="${current.temp_max_c ?? 32.0}" />
                <span class="param-helper-text">Maximum daytime ambient temperature</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-pressure">Atmospheric Pressure</label>
                  <span class="param-unit-tag">hPa</span>
                </div>
                <input class="param-input" type="number" step="0.1" id="inp-pressure" name="pressure_hpa" value="${current.pressure_hpa ?? 1002.0}" />
                <span class="param-helper-text">Surface barometric pressure</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-wind">Wind Speed</label>
                  <span class="param-unit-tag">km/h</span>
                </div>
                <input class="param-input" type="number" step="0.1" min="0" id="inp-wind" name="wind_speed_kmh" value="${current.wind_speed_kmh ?? 25.0}" />
                <span class="param-helper-text">Sustained surface wind velocity</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-humidity">Relative Humidity</label>
                  <span class="param-unit-tag">%</span>
                </div>
                <input class="param-input" type="number" step="0.1" min="0" max="100" id="inp-humidity" name="relative_humidity_pct" value="${current.relative_humidity_pct ?? 85.0}" />
                <span class="param-helper-text">Atmospheric moisture saturation</span>
              </div>

            </div>
          </div>

          <!-- Section B: River & Hydrology -->
          <div class="op-card">
            <div class="op-card-header">
              <h2 class="op-card-title">B. River & Hydrology Status</h2>
              <span class="param-helper-text">Mundali Barrage & Hirakud</span>
            </div>
            <div class="param-fields-grid">
              
              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-water-level">Water Level</label>
                  <span class="param-unit-tag">m</span>
                </div>
                <input class="param-input" type="number" step="0.01" min="10" max="35" id="inp-water-level" name="water_level_m" value="${current.water_level_m ?? 26.80}" required />
                <span class="param-helper-text">Current river gauge stage height</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-discharge">River Discharge</label>
                  <span class="param-unit-tag">cumec</span>
                </div>
                <input class="param-input" type="number" step="1" min="0" id="inp-discharge" name="discharge_cumec" value="${current.discharge_cumec ?? 14000}" required />
                <span class="param-helper-text">Downstream river flow rate</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-dam-outflow">Upstream Dam Outflow</label>
                  <span class="param-unit-tag">cumec</span>
                </div>
                <input class="param-input" type="number" step="1" min="0" id="inp-dam-outflow" name="upstream_dam_outflow_cumec" value="${current.upstream_dam_outflow_cumec ?? 8500}" required />
                <span class="param-helper-text">Hirakud Dam current spillway release</span>
              </div>

            </div>
          </div>

          <!-- Section C: Historical / Lag Conditions -->
          <div class="op-card">
            <div class="op-card-header">
              <h2 class="op-card-title">C. Historical & Lag Conditions</h2>
              <span class="param-helper-text">Preceding 24h to 7d trends</span>
            </div>
            <div class="param-fields-grid">
              
              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-rain-lag1">Previous Rainfall (24h)</label>
                  <span class="param-unit-tag">mm</span>
                </div>
                <input class="param-input" type="number" step="0.1" min="0" id="inp-rain-lag1" name="rain_lag1_mm" value="${current.rain_lag1_mm ?? 50.0}" />
                <span class="param-helper-text">Rainfall 24 hours prior</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-rain-lag2">Rainfall (48h Prior)</label>
                  <span class="param-unit-tag">mm</span>
                </div>
                <input class="param-input" type="number" step="0.1" min="0" id="inp-rain-lag2" name="rain_lag2_mm" value="${current.rain_lag2_mm ?? 30.0}" />
                <span class="param-helper-text">Rainfall 48 hours prior</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-rain-cum3">3-Day Cumulative Rainfall</label>
                  <span class="param-unit-tag">mm</span>
                </div>
                <input class="param-input" type="number" step="0.1" min="0" id="inp-rain-cum3" name="rain_cum_3d_mm" value="${current.rain_cum_3d_mm ?? 200.0}" />
                <span class="param-helper-text">Total 3-day accumulated precipitation</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-rain-cum7">7-Day Cumulative Rainfall</label>
                  <span class="param-unit-tag">mm</span>
                </div>
                <input class="param-input" type="number" step="0.1" min="0" id="inp-rain-cum7" name="rain_cum_7d_mm" value="${current.rain_cum_7d_mm ?? 320.0}" />
                <span class="param-helper-text">Total 7-day accumulated precipitation</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-wl-lag1">Previous Water Level</label>
                  <span class="param-unit-tag">m</span>
                </div>
                <input class="param-input" type="number" step="0.01" id="inp-wl-lag1" name="water_level_lag1_m" value="${current.water_level_lag1_m ?? 25.50}" />
                <span class="param-helper-text">River stage 24 hours prior</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-wl-delta">24h Water Level Change</label>
                  <span class="param-unit-tag">m</span>
                </div>
                <input class="param-input" type="number" step="0.01" id="inp-wl-delta" name="water_level_delta_24h" value="${current.water_level_delta_24h ?? 1.30}" />
                <span class="param-helper-text">24h delta in gauge height</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-discharge-3d">Rolling Discharge (3-Day)</label>
                  <span class="param-unit-tag">cumec</span>
                </div>
                <input class="param-input" type="number" step="1" min="0" id="inp-discharge-3d" name="discharge_rolling_3d" value="${current.discharge_rolling_3d ?? 12000}" />
                <span class="param-helper-text">3-day rolling average river discharge</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-dam-2d">Rolling Dam Outflow (2-Day)</label>
                  <span class="param-unit-tag">cumec</span>
                </div>
                <input class="param-input" type="number" step="1" min="0" id="inp-dam-2d" name="dam_outflow_rolling_2d" value="${current.dam_outflow_rolling_2d ?? 7000}" />
                <span class="param-helper-text">2-day rolling average reservoir release</span>
              </div>

            </div>
          </div>

          <!-- Section D: Derived & Event Indicators -->
          <div class="op-card">
            <div class="op-card-header">
              <h2 class="op-card-title">D. Derived & Event Indicators</h2>
              <span class="param-helper-text">Hydrological risk factors</span>
            </div>
            <div class="param-fields-grid">
              
              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-soil">Soil Moisture Saturation (API)</label>
                  <span class="param-unit-tag">index</span>
                </div>
                <input class="param-input" type="number" step="0.1" min="0" id="inp-soil" name="api_soil_moisture" value="${current.api_soil_moisture ?? 150.0}" />
                <span class="param-helper-text">Antecedent Precipitation Index (0.85 decay)</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-pressure-drop">Pressure Drop</label>
                  <span class="param-unit-tag">hPa</span>
                </div>
                <input class="param-input" type="number" step="0.1" min="0" id="inp-pressure-drop" name="pressure_drop_hpa" value="${current.pressure_drop_hpa ?? 11.25}" />
                <span class="param-helper-text">Deficit below standard sea level (1013.25)</span>
              </div>

              <div class="param-field">
                <div class="param-label-wrap">
                  <label class="param-label" for="inp-storm-wind">Storm Force Winds</label>
                  <span class="param-unit-tag">>45 km/h</span>
                </div>
                <select class="param-select" id="inp-storm-wind" name="storm_wind_flag">
                  <option value="0" ${current.storm_wind_flag === 0 ? 'selected' : ''}>No (Normal wind velocity)</option>
                  <option value="1" ${current.storm_wind_flag === 1 ? 'selected' : ''}>Yes (Gale/storm winds >45 km/h)</option>
                </select>
                <span class="param-helper-text">Tropical depression / cyclone flag</span>
              </div>

            </div>
          </div>

        </div>

        <!-- Action Bar -->
        <div class="analyze-action-bar" style="margin-top: 20px;">
          <div class="analyze-action-info">
            <span class="analyze-action-title">Run Decision Support Analysis</span>
            <span class="analyze-action-sub">Submits input parameters to the AI disaster management decision engine.</span>
          </div>

          <button type="submit" class="btn-analyze-execute" id="btn-submit-analysis">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>RUN ANALYSIS</span>
          </button>
        </div>

      </form>

      <!-- AI Analysis Workflow Modal -->
      <div class="workflow-modal-overlay" id="workflow-modal">
        <div class="workflow-modal-card">
          <div class="workflow-modal-header">
            <div class="workflow-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-brand);">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>AI Analysis Workflow</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">In Progress</span>
          </div>

          <div class="workflow-steps-list">
            <div class="workflow-step-item" id="step-1">
              <div class="workflow-step-icon">1</div>
              <span class="workflow-step-label">Analyzing current conditions...</span>
            </div>
            <div class="workflow-step-item" id="step-2">
              <div class="workflow-step-icon">2</div>
              <span class="workflow-step-label">Evaluating hydrometeorological inputs...</span>
            </div>
            <div class="workflow-step-item" id="step-3">
              <div class="workflow-step-icon">3</div>
              <span class="workflow-step-label">Generating operational recommendations...</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Attach event handlers
  setupAnalyzeEvents(container);
}

function setupAnalyzeEvents(container) {
  const form = container.querySelector('#analyze-form');
  const modal = container.querySelector('#workflow-modal');
  const errorBanner = container.querySelector('#form-error-banner');
  const errorText = container.querySelector('#form-error-text');

  // Scenario preset button handler
  const presetBtns = container.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const scenarioId = btn.getAttribute('data-scenario');
      const scenario = TEST_SCENARIOS[scenarioId];
      if (scenario) {
        populateForm(form, scenario.values);
        if (errorBanner) errorBanner.classList.remove('active');
      }
    });
  });

  // Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorBanner) errorBanner.classList.remove('active');

    const formData = new FormData(form);
    const payload = {};
    for (const [key, value] of formData.entries()) {
      payload[key] = parseFloat(value);
    }

    // Launch AI analysis workflow modal
    modal.classList.add('active');
    const steps = [
      modal.querySelector('#step-1'),
      modal.querySelector('#step-2'),
      modal.querySelector('#step-3')
    ];

    // Reset steps state
    steps.forEach(s => {
      s.className = 'workflow-step-item pending';
    });

    const runStepAnimation = async () => {
      for (let i = 0; i < steps.length; i++) {
        steps[i].className = 'workflow-step-item active';
        await new Promise(resolve => setTimeout(resolve, 300));
        steps[i].className = 'workflow-step-item completed';
      }
    };

    try {
      const [analysisResult] = await Promise.all([
        runDecisionCycle(payload),
        runStepAnimation()
      ]);

      // Save to state and persistent localStorage
      appState.setAnalysis(analysisResult, payload);

      await new Promise(resolve => setTimeout(resolve, 250));
      modal.classList.remove('active');

      // Navigate to Command Center
      appState.setActiveTab('command-center');
    } catch (err) {
      modal.classList.remove('active');
      if (errorBanner && errorText) {
        errorText.textContent = 'Unable to complete analysis. Please verify that the SURAKSHA-AI backend is running and try again.';
        errorBanner.classList.add('active');
      }
    }
  });
}

function populateForm(form, values) {
  for (const [key, val] of Object.entries(values)) {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      input.value = val;
    }
  }
}
