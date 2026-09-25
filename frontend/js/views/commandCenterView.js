/**
 * SURAKSHA-AI Command Center View
 * Primary operational workspace for disaster-management decision makers.
 */

import { appState } from '../state.js';

export function renderCommandCenter(container) {
  const analysis = appState.currentAnalysis;
  const inputs = appState.currentInputs;

  if (!analysis) {
    container.innerHTML = `
      <div class="history-empty-state">
        <p style="font-weight: 600; font-size: 1rem; color: var(--text-primary);">No active hydrological assessment loaded.</p>
        <p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">
          Navigate to <strong>ANALYZE</strong> to evaluate current hydrometeorological conditions and generate decision directives.
        </p>
      </div>
    `;
    return;
  }

  const { prediction, plan } = analysis;
  const tierName = prediction.hazard_tier_name.toUpperCase();
  const tierClass = `tier-${prediction.hazard_tier_name.toLowerCase()}`;
  const crestM = prediction.predicted_crest_m.toFixed(2);
  const bufferM = prediction.buffer_to_danger_level_m > 0
    ? `+${prediction.buffer_to_danger_level_m.toFixed(2)}`
    : `${prediction.buffer_to_danger_level_m.toFixed(2)}`;

  // Dynamic Situation Synopsis based purely on actual backend results
  let synopsisText = '';
  if (prediction.hazard_tier_code === 0) {
    synopsisText = `Hydrological conditions indicate normal flood-risk state for the analyzed scenario. The predicted crest of ${crestM} m remains comfortably below the CWC danger threshold, with routine river monitoring in effect.`;
  } else if (prediction.hazard_tier_code === 1) {
    synopsisText = `Hydrological stage approaching Warning Level (26.50 m) with forecasted crest at ${crestM} m. Civil administration advised to pre-position SDRF and inspect shelter readiness across riparian taluks.`;
  } else if (prediction.hazard_tier_code === 2) {
    synopsisText = `High flood risk detected. Predicted crest of ${crestM} m breaches the CWC Danger Level (27.50 m) by ${bufferM} m. Immediate pre-emptive evacuation and NDRF staging recommended in low-lying riparian taluks.`;
  } else {
    synopsisText = `Severe catastrophic flood threat. Predicted crest of ${crestM} m poses extreme inundation risk with Highest Flood Level (29.20 m) breach conditions. Mandatory floodplain evacuations and full civil defense deployment active.`;
  }

  // Dynamic Situation Assessment Text
  const assessmentText = `Current hydrological assessment forecasts a downstream peak river stage of ${crestM} m at Mundali Barrage (${bufferM} m buffer to Danger Level). Based on evaluated catchment rainfall and reservoir discharge, the situation is classified under ${tierName} protocol with ${plan.primary_directives?.length || 0} active operational directives issued.`;

  // Probabilities Map
  const probs = prediction.class_probabilities || {};
  const probNormal = ((probs['NORMAL'] || 0) * 100).toFixed(1);
  const probAlert = ((probs['ALERT'] || 0) * 100).toFixed(1);
  const probWarning = ((probs['WARNING'] || 0) * 100).toFixed(1);
  const probSevere = ((probs['SEVERE'] || 0) * 100).toFixed(1);

  // Directives list (Recommended Actions)
  const directivesHtml = (plan.primary_directives || [])
    .map(dir => `
      <li>
        <span class="decision-bullet-icon">▸</span>
        <span>${dir}</span>
      </li>
    `).join('');

  container.innerHTML = `
    <div class="command-center-layout">
      
      <!-- 1. Dominant Current Situation Banner & 2. Predicted Crest -->
      <section class="situation-banner ${tierClass}">
        <div class="situation-lead">
          <div class="situation-meta-row">
            <span class="situation-label">CURRENT HAZARD STATUS</span>
            <span class="situation-basin-tag">Mahanadi River Basin • Mundali Barrage</span>
          </div>
          <div class="situation-status-display">
            <span class="situation-tier-text">${tierName}</span>
          </div>
          <p class="situation-quick-desc">${synopsisText}</p>
        </div>

        <div class="situation-crest-highlight">
          <div class="crest-stat-box">
            <span class="crest-stat-label">Predicted Crest (24h)</span>
            <div class="crest-stat-val">${crestM} <span class="crest-stat-unit">m</span></div>
            <span class="crest-stat-sub">Buffer to Danger: <strong>${bufferM} m</strong></span>
          </div>
          <div class="crest-stat-box">
            <span class="crest-stat-label">Danger Level (27.50m)</span>
            <div class="crest-stat-val ${prediction.is_danger_breached ? 'status-breached' : 'status-safe'}" style="font-size: 1.25rem;">
              ${prediction.is_danger_breached ? 'BREACHED' : 'Not Breached'}
            </div>
            <span class="crest-stat-sub">HFL (29.20m): <strong>${prediction.is_hfl_breached ? 'BREACHED' : 'Not Breached'}</strong></span>
          </div>
        </div>
      </section>

      <!-- Operational Grid Row -->
      <div class="cc-grid-row">
        
        <!-- Left: 4. RECOMMENDED ACTIONS -->
        <section class="op-card decision-panel">
          <div class="op-card-header">
            <h2 class="op-card-title">RECOMMENDED ACTIONS</h2>
            <span class="hazard-badge ${prediction.hazard_tier_name.toLowerCase()}">
              ${tierName}
            </span>
          </div>

          <div class="decision-verdict-box">
            <span class="decision-verdict-title">Decision Support Protocol</span>
            <span class="decision-verdict-val">${tierName} RESPONSE ACTIVE</span>
          </div>

          <div class="decision-reason-block">
            <div class="decision-reason-title">Operational Context</div>
            <p>${synopsisText}</p>
          </div>

          <div>
            <div class="decision-directives-title">Action Directives Generated by Backend Engine</div>
            <ul class="decision-directives-list">
              ${directivesHtml}
            </ul>
          </div>
        </section>

        <!-- Right: 3. AI SITUATION ASSESSMENT & 5. RISK ASSESSMENT -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- 3. AI Situation Assessment -->
          <section class="op-card">
            <div class="op-card-header">
              <h2 class="op-card-title">AI Situation Assessment</h2>
            </div>
            <div class="ai-summary-text">
              "${assessmentText}"
            </div>

            <!-- Hydrological Benchmark Status -->
            <div class="benchmarks-grid">
              <div class="benchmark-stat-item">
                <span class="benchmark-stat-title">Warning Level</span>
                <div class="benchmark-stat-val">26.50 m</div>
              </div>
              <div class="benchmark-stat-item">
                <span class="benchmark-stat-title">Danger Level</span>
                <div class="benchmark-stat-val">27.50 m</div>
              </div>
              <div class="benchmark-stat-item">
                <span class="benchmark-stat-title">Highest Flood Level</span>
                <div class="benchmark-stat-val">29.20 m</div>
              </div>
            </div>
          </section>

          <!-- 5. RISK ASSESSMENT -->
          <section class="op-card">
            <div class="op-card-header">
              <h2 class="op-card-title">RISK ASSESSMENT</h2>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Hazard Tier Probability</span>
            </div>
            <div class="probabilities-list">
              <div class="prob-row">
                <div class="prob-label-row">
                  <span style="color: var(--hazard-normal);">NORMAL</span>
                  <span class="mono">${probNormal}%</span>
                </div>
                <div class="prob-bar-track">
                  <div class="prob-bar-fill fill-normal" style="width: ${probNormal}%;"></div>
                </div>
              </div>

              <div class="prob-row">
                <div class="prob-label-row">
                  <span style="color: var(--hazard-alert);">ALERT</span>
                  <span class="mono">${probAlert}%</span>
                </div>
                <div class="prob-bar-track">
                  <div class="prob-bar-fill fill-alert" style="width: ${probAlert}%;"></div>
                </div>
              </div>

              <div class="prob-row">
                <div class="prob-label-row">
                  <span style="color: var(--hazard-warning);">WARNING</span>
                  <span class="mono">${probWarning}%</span>
                </div>
                <div class="prob-bar-track">
                  <div class="prob-bar-fill fill-warning" style="width: ${probWarning}%;"></div>
                </div>
              </div>

              <div class="prob-row">
                <div class="prob-label-row">
                  <span style="color: var(--hazard-severe);">SEVERE</span>
                  <span class="mono">${probSevere}%</span>
                </div>
                <div class="prob-bar-track">
                  <div class="prob-bar-fill fill-severe" style="width: ${probSevere}%;"></div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <!-- 6. CURRENT CONDITIONS CONSIDERED -->
      <section class="op-card">
        <div class="op-card-header">
          <h2 class="op-card-title">CURRENT CONDITIONS CONSIDERED</h2>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Evaluated Scenario Parameters</span>
        </div>
        <div class="inputs-summary-grid">
          <div class="input-summary-card">
            <span class="input-summary-label">24h Rainfall</span>
            <div class="input-summary-val">${inputs.rainfall_imd_mm ?? 0} <span class="input-summary-unit">mm</span></div>
          </div>
          <div class="input-summary-card">
            <span class="input-summary-label">Current Water Level</span>
            <div class="input-summary-val">${inputs.water_level_m ?? 0} <span class="input-summary-unit">m</span></div>
          </div>
          <div class="input-summary-card">
            <span class="input-summary-label">River Discharge</span>
            <div class="input-summary-val">${Number(inputs.discharge_cumec ?? 0).toLocaleString()} <span class="input-summary-unit">cumec</span></div>
          </div>
          <div class="input-summary-card">
            <span class="input-summary-label">Dam Outflow</span>
            <div class="input-summary-val">${Number(inputs.upstream_dam_outflow_cumec ?? 0).toLocaleString()} <span class="input-summary-unit">cumec</span></div>
          </div>
          <div class="input-summary-card">
            <span class="input-summary-label">Relative Humidity</span>
            <div class="input-summary-val">${inputs.relative_humidity_pct ?? 0} <span class="input-summary-unit">%</span></div>
          </div>
          <div class="input-summary-card">
            <span class="input-summary-label">Soil Moisture (API)</span>
            <div class="input-summary-val">${inputs.api_soil_moisture ?? 0} <span class="input-summary-unit">index</span></div>
          </div>
          <div class="input-summary-card">
            <span class="input-summary-label">Wind Speed</span>
            <div class="input-summary-val">${inputs.wind_speed_kmh ?? 0} <span class="input-summary-unit">km/h</span></div>
          </div>
        </div>
      </section>

    </div>
  `;
}
