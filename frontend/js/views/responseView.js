/**
 * SURAKSHA-AI Response View
 * Operational mitigation recommendations, dam outflow regulation, NDRF deployments, and shelter logistics.
 */

import { appState } from '../state.js';

export function renderResponse(container) {
  const analysis = appState.currentAnalysis;

  if (!analysis) {
    container.innerHTML = `
      <div class="history-empty-state">
        <p style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">No operational response plan active.</p>
        <p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">
          Execute an assessment in <strong>ANALYZE</strong> to generate mitigation recommendations and directives.
        </p>
      </div>
    `;
    return;
  }

  const { plan, prediction } = analysis;
  const dam = plan.dam_discharge_advisory || {};
  const ndrfList = plan.ndrf_deployment || [];
  const shelterList = plan.shelter_allocation || [];
  const utility = plan.utility_metrics || {};

  // Directives HTML (Recommended Actions)
  const directivesHtml = (plan.primary_directives || []).map((dir, idx) => `
    <div class="directive-card">
      <div class="directive-number">${idx + 1}</div>
      <div class="directive-content">${dir}</div>
    </div>
  `).join('');

  // NDRF Deployment HTML
  let ndrfHtml = '';
  if (ndrfList.length > 0) {
    ndrfHtml = `
      <div class="table-scroll-wrap">
        <table class="op-table">
          <thead>
            <tr>
              <th>District</th>
              <th>Taluk</th>
              <th>NDRF Teams Deployed</th>
              <th>Inflatable Boats</th>
              <th>Mobilization Priority</th>
            </tr>
          </thead>
          <tbody>
            ${ndrfList.map(item => `
              <tr>
                <td style="font-weight: 600;">${item.district}</td>
                <td>${item.taluk}</td>
                <td class="mono" style="color: var(--color-brand); font-weight: 700;">${item.ndrf_teams_deployed} Battalion Team(s)</td>
                <td class="mono">${item.rescue_boats_assigned} Boats</td>
                <td>
                  <span class="hazard-badge ${item.mobilization_priority === 'High' ? 'severe' : 'warning'}">
                    ${item.mobilization_priority} Priority
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    ndrfHtml = `
      <div class="ndrf-standdown-box">
        <p style="font-weight: 600; color: var(--text-primary);">No NDRF deployment recommended for the current assessment.</p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
          Hydrological crest forecast does not exceed tactical threshold for national rescue battalion mobilization. Local civil administration and SDRF maintain routine standby.
        </p>
      </div>
    `;
  }

  // Shelter Allocation Table HTML
  const shelterHtml = shelterList.map(s => {
    const isOverload = s.status && s.status.includes('OVERLOADED');
    const badgeClass = isOverload ? 'status-overload' : 'status-adequate';
    const fillStyle = isOverload ? 'background-color: var(--hazard-severe);' : 'background-color: var(--hazard-normal);';

    return `
      <tr>
        <td style="font-weight: 600;">${s.district}</td>
        <td>${s.taluk}</td>
        <td class="mono">${Number(s.target_evacuees).toLocaleString()}</td>
        <td class="mono">${Number(s.target_cattle).toLocaleString()}</td>
        <td class="mono">${Number(s.shelter_capacity).toLocaleString()}</td>
        <td>
          <div class="shelter-cap-bar-track">
            <div class="shelter-cap-bar-fill" style="width: ${Math.min(100, s.capacity_utilization_pct)}%; ${fillStyle}"></div>
          </div>
          <span class="mono" style="font-size: 0.8rem;">${s.capacity_utilization_pct}%</span>
        </td>
        <td>
          <span class="shelter-status-badge ${badgeClass}">${s.status}</span>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="response-layout">
      
      <!-- Top Action Title -->
      <section class="response-header-card">
        <div>
          <h1 class="response-lead-title">Operational Mitigation Plan</h1>
          <p class="response-lead-sub">Decision Support & Operational Directives</p>
        </div>
        <div>
          <span class="hazard-badge ${prediction.hazard_tier_name.toLowerCase()}" style="font-size: 0.82rem; padding: 5px 12px;">
            ${prediction.hazard_tier_name} Response Active
          </span>
        </div>
      </section>

      <!-- 1. Recommended Actions -->
      <section class="op-card">
        <div class="op-card-header">
          <h2 class="op-card-title">Recommended Actions</h2>
          <span style="font-size: 0.72rem; color: var(--text-muted);">
            Operational Directives for Civil Administration
          </span>
        </div>
        <div class="directives-container">
          ${directivesHtml}
        </div>
      </section>

      <!-- 2. Dam Outflow Regulation (Hirakud) -->
      <section class="op-card">
        <div class="op-card-header">
          <h2 class="op-card-title">Dam Discharge Advisory</h2>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Hirakud Reservoir Command</span>
        </div>
        
        <div class="dam-grid-metrics">
          <div class="dam-metric-box">
            <span class="dam-metric-label">Current Dam Outflow</span>
            <div class="dam-metric-val">${(dam.current_outflow_cumec || 0).toLocaleString()} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 400;">cumec</span></div>
          </div>
          <div class="dam-metric-box">
            <span class="dam-metric-label">Recommended Target Outflow</span>
            <div class="dam-metric-val" style="color: var(--color-brand);">${(dam.recommended_outflow_cumec || 0).toLocaleString()} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 400;">cumec</span></div>
          </div>
        </div>

        <div class="dam-advisory-directive-box">
          <strong>Hydrological Advisory:</strong> ${dam.advisory_directive || 'Maintain standard outflow curve.'}
        </div>
      </section>

      <!-- 3. NDRF Tactical Deployment -->
      <section class="op-card">
        <div class="op-card-header">
          <h2 class="op-card-title">NDRF / SDRF Deployment</h2>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Tactical Dispatch Recommendations</span>
        </div>
        ${ndrfHtml}
      </section>

      <!-- 4. Shelter Logistics & Evacuation Capacities -->
      <section class="op-card">
        <div class="op-card-header">
          <h2 class="op-card-title">Shelter Allocation</h2>
          <span style="font-size: 0.72rem; color: var(--text-muted);">
            Multi-Purpose Cyclone & Flood Shelters
          </span>
        </div>

        <div class="table-scroll-wrap">
          <table class="op-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Taluk</th>
                <th>Target Evacuees</th>
                <th>Livestock Target</th>
                <th>Shelter Capacity</th>
                <th>Capacity Utilization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${shelterHtml || `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No shelter allocations calculated.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      <!-- 5. Decision Utility Metrics -->
      <section class="op-card">
        <div class="op-card-header">
          <h2 class="op-card-title">Utility Metrics</h2>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Multi-objective optimization impact</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
          <div style="background-color: var(--bg-secondary); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Total Estimated Evacuees</span>
            <div style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-mono); color: var(--text-primary); margin-top: 2px;">
              ${Number(utility.total_estimated_evacuees || 0).toLocaleString()}
            </div>
          </div>
          <div style="background-color: var(--bg-secondary); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Total Livestock At Risk</span>
            <div style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-mono); color: var(--text-primary); margin-top: 2px;">
              ${Number(utility.total_cattle_at_risk || 0).toLocaleString()}
            </div>
          </div>
          <div style="background-color: var(--bg-secondary); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Expected Utility Score</span>
            <div style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-mono); color: var(--color-brand); margin-top: 2px;">
              ${utility.expected_utility_score ?? 'N/A'}
            </div>
          </div>
        </div>
      </section>

    </div>
  `;
}
