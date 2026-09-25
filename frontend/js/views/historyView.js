/**
 * SURAKSHA-AI History View & Detailed Analysis Drawer
 * Local Analysis History stored persistently in browser localStorage.
 */

import { appState } from '../state.js';

// Human-readable dictionary for all 19 hydrometeorological input parameters
const INPUT_LABELS = {
  rainfall_imd_mm: { label: 'Rainfall (24 Hours)', unit: 'mm' },
  temp_max_c: { label: 'Maximum Temperature', unit: '°C' },
  pressure_hpa: { label: 'Atmospheric Pressure', unit: 'hPa' },
  wind_speed_kmh: { label: 'Wind Speed', unit: 'km/h' },
  relative_humidity_pct: { label: 'Relative Humidity', unit: '%' },
  storm_wind_flag: { label: 'Storm Force Winds (>45 km/h)', unit: 'flag' },
  water_level_m: { label: 'Current River Stage Height', unit: 'm' },
  discharge_cumec: { label: 'Downstream Discharge', unit: 'cumec' },
  water_level_lag1_m: { label: 'Previous Stage (24 Hours Prior)', unit: 'm' },
  water_level_delta_24h: { label: '24h River Stage Change', unit: 'm' },
  discharge_rolling_3d: { label: '3-Day Average Discharge', unit: 'cumec' },
  upstream_dam_outflow_cumec: { label: 'Upstream Dam Outflow (Hirakud)', unit: 'cumec' },
  dam_outflow_rolling_2d: { label: '2-Day Average Dam Outflow', unit: 'cumec' },
  rain_lag1_mm: { label: 'Rainfall — Previous 24 Hours', unit: 'mm' },
  rain_lag2_mm: { label: 'Rainfall — 48 Hours Prior', unit: 'mm' },
  rain_cum_3d_mm: { label: '3-Day Cumulative Rainfall', unit: 'mm' },
  rain_cum_7d_mm: { label: '7-Day Cumulative Rainfall', unit: 'mm' },
  api_soil_moisture: { label: 'Soil Moisture Saturation Index (API)', unit: 'index' },
  pressure_drop_hpa: { label: 'Pressure Drop Below Sea Level', unit: 'hPa' }
};

export function renderHistory(container) {
  const historyList = appState.history || [];

  if (historyList.length === 0) {
    container.innerHTML = `
      <div class="history-layout">
        <section class="history-header-card">
          <div class="history-header-title-wrap">
            <h1 class="history-header-title">Local Analysis History</h1>
            <span class="history-session-tag">0 Records</span>
          </div>
        </section>

        <div class="history-empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--text-muted); margin-bottom: 12px;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
          <p style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">No local analysis history found.</p>
          <p style="margin-top: 6px; font-size: 0.85rem; color: var(--text-muted); max-width: 480px; margin-left: auto; margin-right: auto;">
            Evaluations run in <strong>ANALYZE</strong> will automatically be saved locally on this browser so you can audit past scenarios, predictions, and operational responses.
          </p>
        </div>
      </div>
    `;
    return;
  }

  // Render list of history cards (newest first)
  const cardsHtml = historyList.map(item => {
    const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const tierName = item.hazard_tier_name.toUpperCase();
    const tierClass = `tier-${item.hazard_tier_name.toLowerCase()}`;
    const crestM = Number(item.predicted_crest_m).toFixed(2);

    // Probabilities summary
    const probs = item.class_probabilities || {};
    const probSummary = Object.entries(probs)
      .map(([tier, p]) => `${tier}: ${(p * 100).toFixed(0)}%`)
      .join(' • ');

    // Primary directive preview
    const directivePreview = item.primary_directives && item.primary_directives.length > 0
      ? item.primary_directives[0]
      : 'Maintain routine hydrological vigilance.';

    return `
      <article class="history-entry-card ${tierClass}">
        <div class="history-entry-top">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="hazard-badge ${item.hazard_tier_name.toLowerCase()}">${tierName}</span>
            <span class="history-entry-date">${dateStr}</span>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">
            ${item.is_danger_breached ? 'DL Breached' : 'DL Safe'} • ${item.is_hfl_breached ? 'HFL Breached' : 'HFL Safe'}
          </span>
        </div>

        <div class="history-entry-body">
          <div class="history-entry-crest">
            <span class="history-crest-label">Predicted Crest</span>
            <div class="history-crest-val">${crestM} <span style="font-size: 0.85rem; font-weight: 400; color: var(--text-muted);">m</span></div>
            <span style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">
              Buffer: <strong>${item.buffer_to_danger_level_m > 0 ? '+' : ''}${Number(item.buffer_to_danger_level_m).toFixed(2)}m</strong>
            </span>
          </div>

          <div class="history-entry-summary">
            <div class="history-prob-summary">${probSummary}</div>
            <div class="history-directive-preview">${directivePreview}</div>
          </div>

          <div class="history-entry-actions">
            <button type="button" class="btn-view-details" data-id="${item.id}">
              VIEW DETAILS
            </button>
            <button type="button" class="btn-secondary" data-load-id="${item.id}" title="Load into Command Center">
              Load State
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = `
    <div class="history-layout">
      
      <!-- History Header -->
      <section class="history-header-card">
        <div class="history-header-title-wrap">
          <h1 class="history-header-title">Local Analysis History</h1>
          <span class="history-session-tag">${historyList.length} Recorded Runs (Browser Storage)</span>
        </div>

        <div>
          <button type="button" class="btn-danger-outline" id="btn-clear-history">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Clear History</span>
          </button>
        </div>
      </section>

      <!-- History Entries Cards -->
      <div class="history-cards-list">
        ${cardsHtml}
      </div>

      <!-- Detailed Analysis Modal -->
      <div class="history-modal-overlay" id="history-detail-modal">
        <div class="history-modal-card">
          <div class="history-modal-header">
            <div class="history-modal-title">
              <span id="modal-hazard-badge" class="hazard-badge normal">NORMAL</span>
              <span id="modal-title-date">Analysis Details</span>
            </div>
            <button type="button" class="btn-close-modal" id="btn-modal-close" aria-label="Close modal">✕</button>
          </div>

          <div class="history-modal-body" id="modal-body-content">
            <!-- Dynamically populated when opening modal -->
          </div>

          <div class="history-modal-footer">
            <button type="button" class="btn-secondary" id="btn-modal-close-footer">Close</button>
            <button type="button" class="btn-primary" id="btn-modal-load-command-center">Load into Command Center</button>
          </div>
        </div>
      </div>

    </div>
  `;

  // Attach event handlers
  setupHistoryEvents(container, historyList);
}

function setupHistoryEvents(container, historyList) {
  const modal = container.querySelector('#history-detail-modal');
  const modalBody = container.querySelector('#modal-body-content');
  const modalBadge = container.querySelector('#modal-hazard-badge');
  const modalTitle = container.querySelector('#modal-title-date');
  const modalLoadBtn = container.querySelector('#btn-modal-load-command-center');
  let activeModalRunId = null;

  // View Details Handler
  const viewBtns = container.querySelectorAll('.btn-view-details');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = historyList.find(h => h.id === id);
      if (item) {
        activeModalRunId = item.id;
        populateHistoryModal(item, modal, modalBody, modalBadge, modalTitle);
      }
    });
  });

  // Load State directly from card
  const loadBtns = container.querySelectorAll('[data-load-id]');
  loadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-load-id');
      appState.loadHistoricalRun(id);
    });
  });

  // Modal Load Button
  if (modalLoadBtn) {
    modalLoadBtn.addEventListener('click', () => {
      if (activeModalRunId) {
        modal.classList.remove('active');
        appState.loadHistoricalRun(activeModalRunId);
      }
    });
  }

  // Close Modal Buttons
  const closeBtn = container.querySelector('#btn-modal-close');
  const closeFooterBtn = container.querySelector('#btn-modal-close-footer');
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  if (closeFooterBtn) closeFooterBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Clear History Handler
  const clearBtn = container.querySelector('#btn-clear-history');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your local analysis history? This will remove all stored analysis runs from your browser.')) {
        appState.clearHistory();
        renderHistory(container);
      }
    });
  }
}

function populateHistoryModal(item, modal, modalBody, modalBadge, modalTitle) {
  const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  modalBadge.textContent = item.hazard_tier_name.toUpperCase();
  modalBadge.className = `hazard-badge ${item.hazard_tier_name.toLowerCase()}`;
  modalTitle.textContent = dateStr;

  const crestM = Number(item.predicted_crest_m).toFixed(2);
  const bufferM = item.buffer_to_danger_level_m > 0
    ? `+${Number(item.buffer_to_danger_level_m).toFixed(2)}`
    : `${Number(item.buffer_to_danger_level_m).toFixed(2)}`;

  // 1. Inputs Grid with Human-Readable Labels
  const inputsHtml = Object.entries(item.inputs || {}).map(([key, val]) => {
    const meta = INPUT_LABELS[key] || { label: key, unit: '' };
    let displayVal = val;
    if (key === 'storm_wind_flag') {
      displayVal = val === 1 ? 'Yes (>45 km/h)' : 'No';
    } else if (typeof val === 'number') {
      displayVal = val.toLocaleString();
    }
    return `
      <div class="history-input-item">
        <span class="history-input-label">${meta.label}</span>
        <span class="history-input-value">${displayVal} <span style="font-size: 0.72rem; font-weight: 400; color: var(--text-muted);">${meta.unit}</span></span>
      </div>
    `;
  }).join('');

  // 3. Risk Assessment (Probabilities)
  const probs = item.class_probabilities || {};
  const probListHtml = Object.entries(probs).map(([tier, prob]) => `
    <div style="background-color: var(--bg-secondary); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
      <span style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">${tier}</span>
      <div style="font-size: 1.1rem; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary);">
        ${(prob * 100).toFixed(1)}%
      </div>
    </div>
  `).join('');

  // 4. Recommended Actions
  const actionsHtml = (item.primary_directives || []).map(dir => `
    <li style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; font-size: 0.85rem; color: var(--text-primary);">
      <span style="color: var(--color-brand); font-weight: 700;">▸</span>
      <span>${dir}</span>
    </li>
  `).join('');

  // 5. Dam Advisory
  const dam = item.dam_discharge_advisory || {};

  // 6. NDRF Deployment
  let ndrfHtml = '';
  if (item.ndrf_deployment && item.ndrf_deployment.length > 0) {
    ndrfHtml = `
      <div class="table-scroll-wrap">
        <table class="op-table">
          <thead>
            <tr>
              <th>District</th>
              <th>Taluk</th>
              <th>NDRF Teams</th>
              <th>Boats</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            ${item.ndrf_deployment.map(n => `
              <tr>
                <td>${n.district}</td>
                <td>${n.taluk}</td>
                <td class="mono" style="font-weight: 700;">${n.ndrf_teams_deployed}</td>
                <td class="mono">${n.rescue_boats_assigned}</td>
                <td><span class="hazard-badge ${n.mobilization_priority === 'High' ? 'severe' : 'warning'}">${n.mobilization_priority}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    ndrfHtml = `
      <p style="font-size: 0.85rem; color: var(--text-muted); background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-sm);">
        No NDRF deployment recommended for the current assessment.
      </p>
    `;
  }

  // 7. Shelter Allocation
  let shelterHtml = '';
  if (item.shelter_allocation && item.shelter_allocation.length > 0) {
    shelterHtml = `
      <div class="table-scroll-wrap">
        <table class="op-table">
          <thead>
            <tr>
              <th>District</th>
              <th>Taluk</th>
              <th>Target Evacuees</th>
              <th>Cattle</th>
              <th>Capacity</th>
              <th>Utilization</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${item.shelter_allocation.map(s => `
              <tr>
                <td>${s.district}</td>
                <td>${s.taluk}</td>
                <td class="mono">${Number(s.target_evacuees).toLocaleString()}</td>
                <td class="mono">${Number(s.target_cattle).toLocaleString()}</td>
                <td class="mono">${Number(s.shelter_capacity).toLocaleString()}</td>
                <td class="mono">${s.capacity_utilization_pct}%</td>
                <td><span class="shelter-status-badge ${s.status.includes('OVERLOADED') ? 'status-overload' : 'status-adequate'}">${s.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    shelterHtml = `<p style="font-size: 0.85rem; color: var(--text-muted);">No shelter allocations calculated.</p>`;
  }

  // 8. SACHET Alert
  const sachet = item.cap_sachet_alerts || {};
  const alertEn = sachet.en || 'No alert message text available.';

  // 9. Utility Metrics
  const utility = item.utility_metrics || {};

  modalBody.innerHTML = `
    <!-- 2. Prediction Metrics -->
    <div class="history-detail-section">
      <h3 class="history-section-title">2. Hydrological Prediction & Thresholds</h3>
      <div class="history-metrics-grid">
        <div class="history-metric-box">
          <span class="history-metric-label">Predicted Crest</span>
          <div class="history-metric-val">${crestM} <span style="font-size: 0.8rem; font-weight: 400;">m</span></div>
        </div>
        <div class="history-metric-box">
          <span class="history-metric-label">Buffer to Danger Level</span>
          <div class="history-metric-val">${bufferM} <span style="font-size: 0.8rem; font-weight: 400;">m</span></div>
        </div>
        <div class="history-metric-box">
          <span class="history-metric-label">Danger Level (27.50m)</span>
          <div class="history-metric-val ${item.is_danger_breached ? 'status-breached' : 'status-safe'}" style="font-size: 1.05rem;">
            ${item.is_danger_breached ? 'BREACHED' : 'Not Breached'}
          </div>
        </div>
        <div class="history-metric-box">
          <span class="history-metric-label">HFL (29.20m)</span>
          <div class="history-metric-val ${item.is_hfl_breached ? 'status-breached' : 'status-safe'}" style="font-size: 1.05rem;">
            ${item.is_hfl_breached ? 'BREACHED' : 'Not Breached'}
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Risk Assessment -->
    <div class="history-detail-section">
      <h3 class="history-section-title">3. Risk Assessment (Class Probabilities)</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
        ${probListHtml}
      </div>
    </div>

    <!-- 4. Recommended Actions -->
    <div class="history-detail-section">
      <h3 class="history-section-title">4. Recommended Actions (Operational Directives)</h3>
      <ul style="list-style: none; padding-left: 0;">
        ${actionsHtml}
      </ul>
    </div>

    <!-- 5. Dam Advisory -->
    <div class="history-detail-section">
      <h3 class="history-section-title">5. Dam Discharge Advisory (Hirakud)</h3>
      <div style="display: flex; gap: 14px; margin-bottom: 8px; flex-wrap: wrap;">
        <span style="font-size: 0.8rem; color: var(--text-secondary);">
          Current Outflow: <strong class="mono" style="color: var(--text-primary);">${Number(dam.current_outflow_cumec || 0).toLocaleString()} cumec</strong>
        </span>
        <span style="font-size: 0.8rem; color: var(--color-brand);">
          Target Outflow: <strong class="mono">${Number(dam.recommended_outflow_cumec || 0).toLocaleString()} cumec</strong>
        </span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-primary); background: var(--bg-secondary); padding: 10px 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--color-brand);">
        ${dam.advisory_directive || 'Maintain standard outflow curve.'}
      </p>
    </div>

    <!-- 6. NDRF Tactical Deployment -->
    <div class="history-detail-section">
      <h3 class="history-section-title">6. NDRF / SDRF Tactical Dispatch</h3>
      ${ndrfHtml}
    </div>

    <!-- 7. Shelter Allocation -->
    <div class="history-detail-section">
      <h3 class="history-section-title">7. Shelter Allocation & Capacities</h3>
      ${shelterHtml}
    </div>

    <!-- 8. Generated SACHET Alert Output -->
    <div class="history-detail-section">
      <h3 class="history-section-title">8. AI-Generated SACHET Alert Output</h3>
      <div style="display: flex; gap: 12px; margin-bottom: 6px; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
        <span>CAP ID: ${sachet.cap_identifier || 'IN-NDMA-OD-MHD'}</span>
        <span>Severity: ${sachet.severity || item.hazard_tier_name}</span>
      </div>
      <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); background: var(--bg-secondary); padding: 12px 16px; border-radius: var(--radius-sm); border-left: 3px solid var(--hazard-${item.hazard_tier_name.toLowerCase()});">
        ${alertEn}
      </p>
    </div>

    <!-- 9. Utility Metrics -->
    <div class="history-detail-section">
      <h3 class="history-section-title">9. Utility Metrics</h3>
      <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.85rem;">
        <div>At-Risk Evacuees: <strong class="mono" style="color: var(--text-primary);">${Number(utility.total_estimated_evacuees || 0).toLocaleString()}</strong></div>
        <div>Livestock at Risk: <strong class="mono" style="color: var(--text-primary);">${Number(utility.total_cattle_at_risk || 0).toLocaleString()}</strong></div>
        <div>Expected Utility Score: <strong class="mono" style="color: var(--color-brand);">${utility.expected_utility_score ?? 'N/A'}</strong></div>
      </div>
    </div>

    <!-- 1. Input Conditions -->
    <div class="history-detail-section">
      <h3 class="history-section-title">1. Evaluated Input Conditions (19 Parameters)</h3>
      <div class="history-inputs-grid">
        ${inputsHtml}
      </div>
    </div>
  `;

  modal.classList.add('active');
}
