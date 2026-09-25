/**
 * SURAKSHA-AI Situation Awareness View
 * River basin conditions, CWC benchmark gauge, recent trends, and district vulnerability profile.
 */

import { appState } from '../state.js';

export function renderSituation(container) {
  const analysis = appState.currentAnalysis;
  const districts = appState.districts || [];
  const inputs = appState.currentInputs || {};

  const crestM = analysis ? analysis.prediction.predicted_crest_m : (inputs.water_level_m || 23.50);
  const currentWaterLevel = inputs.water_level_m || 23.50;

  // Gauge calculation (Scale from 20.0m to 31.0m)
  const minG = 20.0;
  const maxG = 31.0;
  const calcPct = (val) => Math.min(100, Math.max(0, ((val - minG) / (maxG - minG)) * 100));

  const currentLevelPct = calcPct(currentWaterLevel);
  const crestPct = calcPct(crestM);

  // District rows html
  const districtRowsHtml = districts.map(d => {
    const elev = parseFloat(d.avg_elevation_m);
    let elevClass = 'elev-high';
    if (elev < 12.0) elevClass = 'elev-low';
    else if (elev < 20.0) elevClass = 'elev-mid';

    return `
      <tr>
        <td style="font-weight: 600;">${d.district_name}</td>
        <td>${d.sub_division_taluk}</td>
        <td class="mono">${Number(d.population).toLocaleString()}</td>
        <td class="mono">${d.kutchha_house_pct}%</td>
        <td class="mono">${Number(d.cattle_population).toLocaleString()}</td>
        <td><span class="elevation-pill ${elevClass}">${elev.toFixed(1)} m</span></td>
        <td class="mono">${d.available_shelters}</td>
        <td class="mono">${Number(d.total_shelter_capacity).toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="situation-layout">
      
      <!-- CWC Benchmark River Gauge Visualization -->
      <section class="cwc-gauge-container">
        <div class="gauge-header-wrap">
          <div>
            <h2 class="gauge-title">Mahanadi River Hydrological Gauge Profile</h2>
            <span class="gauge-sub">Mundali Barrage Station • CWC Reference Thresholds</span>
          </div>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
              Current Stage: <strong class="mono" style="color: var(--text-primary);">${currentWaterLevel.toFixed(2)} m</strong>
            </div>
            <div style="font-size: 0.8rem; color: var(--color-brand);">
              Forecasted Crest: <strong class="mono">${crestM.toFixed(2)} m</strong>
            </div>
          </div>
        </div>

        <!-- Gauge Bar -->
        <div class="gauge-visual-track">
          <div class="gauge-zone zone-normal">Safe ( < 26.50m )</div>
          <div class="gauge-zone zone-warning">Warning ( 26.50 - 27.50m )</div>
          <div class="gauge-zone zone-danger">Danger ( 27.50 - 29.20m )</div>
          <div class="gauge-zone zone-hfl">HFL ( > 29.20m )</div>

          <!-- Current Stage Marker -->
          <div class="gauge-marker" style="left: ${currentLevelPct}%; background-color: #38bdf8;" data-label="Current: ${currentWaterLevel.toFixed(2)}m"></div>

          <!-- Forecast Crest Marker -->
          <div class="gauge-marker" style="left: ${crestPct}%; background-color: #ef4444;" data-label="Crest: ${crestM.toFixed(2)}m"></div>
        </div>

        <!-- Gauge Legend & Benchmarks -->
        <div class="gauge-legend-grid">
          <div class="gauge-legend-item legend-normal">
            <span class="legend-tier-name" style="color: var(--hazard-normal);">Routine Stage</span>
            <span class="legend-tier-range">22.00 m - 26.49 m</span>
          </div>
          <div class="gauge-legend-item legend-alert">
            <span class="legend-tier-name" style="color: var(--hazard-alert);">CWC Warning Level</span>
            <span class="legend-tier-range">26.50 m (WL)</span>
          </div>
          <div class="gauge-legend-item legend-warning">
            <span class="legend-tier-name" style="color: var(--hazard-warning);">CWC Danger Level</span>
            <span class="legend-tier-range">27.50 m (DL)</span>
          </div>
          <div class="gauge-legend-item legend-severe">
            <span class="legend-tier-name" style="color: var(--hazard-severe);">Highest Flood Level</span>
            <span class="legend-tier-range">29.20 m (HFL Benchmark)</span>
          </div>
        </div>
      </section>

      <!-- Three-Column Grouped Conditions: Weather, River Conditions, Recent Trends -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
        
        <!-- Weather Card -->
        <div class="op-card">
          <div class="op-card-header">
            <h3 class="op-card-title">Weather Conditions</h3>
            <span class="text-muted" style="font-size: 0.72rem;">Atmospheric</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.84rem;">
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Rainfall (24h)</span>
              <strong class="mono">${inputs.rainfall_imd_mm ?? 0} mm</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Maximum Temperature</span>
              <strong class="mono">${inputs.temp_max_c ?? 0} °C</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Atmospheric Pressure</span>
              <strong class="mono">${inputs.pressure_hpa ?? 0} hPa</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Wind Speed</span>
              <strong class="mono">${inputs.wind_speed_kmh ?? 0} km/h</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Relative Humidity</span>
              <strong class="mono">${inputs.relative_humidity_pct ?? 0}%</strong>
            </div>
          </div>
        </div>

        <!-- River Conditions Card -->
        <div class="op-card">
          <div class="op-card-header">
            <h3 class="op-card-title">River Conditions</h3>
            <span class="text-muted" style="font-size: 0.72rem;">Hydrology</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.84rem;">
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Current Water Level</span>
              <strong class="mono">${inputs.water_level_m ?? 0} m</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Downstream Discharge</span>
              <strong class="mono">${Number(inputs.discharge_cumec ?? 0).toLocaleString()} cumec</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Upstream Dam Outflow</span>
              <strong class="mono">${Number(inputs.upstream_dam_outflow_cumec ?? 0).toLocaleString()} cumec</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Soil Moisture Saturation</span>
              <strong class="mono">${inputs.api_soil_moisture ?? 0} index</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Storm Wind Condition</span>
              <strong class="mono">${inputs.storm_wind_flag === 1 ? 'Yes (Gale force)' : 'No (Standard)'}</strong>
            </div>
          </div>
        </div>

        <!-- Recent Trends Card -->
        <div class="op-card">
          <div class="op-card-header">
            <h3 class="op-card-title">Recent Trends</h3>
            <span class="text-muted" style="font-size: 0.72rem;">Temporal Lags</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.84rem;">
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">24h Water Level Change</span>
              <strong class="mono">${inputs.water_level_delta_24h > 0 ? '+' : ''}${inputs.water_level_delta_24h ?? 0} m</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Previous 24h Rainfall</span>
              <strong class="mono">${inputs.rain_lag1_mm ?? 0} mm</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">3-Day Cumulative Rain</span>
              <strong class="mono">${inputs.rain_cum_3d_mm ?? 0} mm</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">7-Day Cumulative Rain</span>
              <strong class="mono">${inputs.rain_cum_7d_mm ?? 0} mm</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">3-Day Rolling Discharge</span>
              <strong class="mono">${Number(inputs.discharge_rolling_3d ?? 0).toLocaleString()} cumec</strong>
            </div>
          </div>
        </div>

      </div>

      <!-- District & Riparian Demographic Exposure -->
      <section class="op-card">
        <div class="op-card-header">
          <div>
            <h2 class="op-card-title">Downstream District & Riparian Taluk Profiles</h2>
            <span style="font-size: 0.74rem; color: var(--text-muted);">
              Census Demographic Exposure & Cyclone/Flood Shelter Capacities
            </span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">
            5 Sub-Divisions Monitored
          </span>
        </div>

        <div class="table-scroll-wrap">
          <table class="op-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Taluk / Sub-Division</th>
                <th>Population</th>
                <th>Kutchha Housing</th>
                <th>Livestock</th>
                <th>Elevation</th>
                <th>Shelters</th>
                <th>Shelter Capacity</th>
              </tr>
            </thead>
            <tbody>
              ${districtRowsHtml || `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Loading district data...</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  `;
}
