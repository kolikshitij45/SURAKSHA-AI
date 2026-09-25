/**
 * SURAKSHA-AI Alerts View
 * AI-Generated SACHET Alert Output with multi-lingual toggles.
 */

import { appState } from '../state.js';

export function renderAlerts(container) {
  const analysis = appState.currentAnalysis;

  if (!analysis) {
    container.innerHTML = `
      <div class="history-empty-state">
        <p style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">No active alert output generated.</p>
        <p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">
          Execute an assessment in <strong>ANALYZE</strong> to generate SACHET alert message text.
        </p>
      </div>
    `;
    return;
  }

  const { plan, prediction } = analysis;
  const sachet = plan.cap_sachet_alerts || {};
  const currentLang = appState.selectedAlertLang || 'en';
  const alertText = sachet[currentLang] || sachet.en || 'No alert message text available.';
  const tierName = prediction.hazard_tier_name.toUpperCase();
  const tierClass = `tier-${prediction.hazard_tier_name.toLowerCase()}`;

  container.innerHTML = `
    <div class="alerts-layout">
      
      <!-- SACHET Alert Output Card -->
      <section class="sachet-broadcast-card">
        
        <div class="sachet-header-row">
          <div class="sachet-protocol-info">
            <div class="sachet-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div class="sachet-titles">
              <h1 class="sachet-main-title">
                <span>AI-Generated SACHET Alert Output</span>
                <span class="hazard-badge ${prediction.hazard_tier_name.toLowerCase()}">
                  ${sachet.severity || tierName}
                </span>
              </h1>
              <span class="sachet-sub-title">Common Alerting Protocol (CAP) Decision Support Output</span>
            </div>
          </div>

          <div class="sachet-meta-pills">
            <span class="cap-id-pill">CAP ID: ${sachet.cap_identifier || 'IN-NDMA-OD-MHD'}</span>
          </div>
        </div>

        <!-- Language Selector & Timestamp -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div class="alert-language-selector">
            <button type="button" class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">
              English
            </button>
            <button type="button" class="lang-btn ${currentLang === 'hi' ? 'active' : ''}" data-lang="hi">
              हिन्दी (Hindi)
            </button>
            <button type="button" class="lang-btn ${currentLang === 'or' ? 'active' : ''}" data-lang="or">
              ଓଡ଼ିଆ (Odia)
            </button>
          </div>

          <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono);">
            Assessment Timestamp: ${new Date(plan.timestamp).toLocaleString()}
          </div>
        </div>

        <!-- Broadcast Message Text Box -->
        <div class="alert-message-display-box ${tierClass}">
          <p class="alert-message-text" id="alert-text-content">
            ${alertText}
          </p>
        </div>

        <!-- Operational Disclaimer Note -->
        <div class="sachet-audit-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>
            AI/Backend-Generated Output for Decision Support • Prepared in NDMA CAP format. Does not constitute an official government broadcast until authorized by designated civil emergency authorities.
          </span>
        </div>

      </section>

    </div>
  `;

  // Attach language selector events
  const langBtns = container.querySelectorAll('.lang-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.getAttribute('data-lang');
      appState.setAlertLang(selectedLang);
      renderAlerts(container);
    });
  });
}
