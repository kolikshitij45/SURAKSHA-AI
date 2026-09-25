/**
 * SURAKSHA-AI Router & View Orchestrator
 */

import { appState } from './state.js';
import { renderCommandCenter } from './views/commandCenterView.js';
import { renderAnalyze } from './views/analyzeView.js';
import { renderSituation } from './views/situationView.js';
import { renderResponse } from './views/responseView.js';
import { renderAlerts } from './views/alertsView.js';
import { renderHistory } from './views/historyView.js';

export class AppRouter {
  constructor(mainContainer, navButtons) {
    this.mainContainer = mainContainer;
    this.navButtons = navButtons;
    this.navMenu = document.getElementById('app-nav');
    this.views = {
      'command-center': renderCommandCenter,
      'analyze': renderAnalyze,
      'situation': renderSituation,
      'response': renderResponse,
      'alerts': renderAlerts,
      'history': renderHistory
    };

    this.init();
  }

  init() {
    // Bind tab clicks
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          appState.setActiveTab(tab);
          // Close mobile menu drawer if open
          if (this.navMenu && this.navMenu.classList.contains('open')) {
            this.navMenu.classList.remove('open');
          }
        }
      });
    });

    // Subscribe to state changes
    appState.subscribe((event, data) => {
      if (event === 'TAB_CHANGED') {
        this.renderCurrentView();
        this.updateNavUi(data);
      } else if (event === 'ANALYSIS_UPDATED') {
        this.updateHeaderHazardBadge();
        if (appState.activeTab === 'command-center' || appState.activeTab === 'response' || appState.activeTab === 'alerts' || appState.activeTab === 'situation') {
          this.renderCurrentView();
        }
      } else if (event === 'DISTRICTS_UPDATED') {
        if (appState.activeTab === 'situation') {
          this.renderCurrentView();
        }
      } else if (event === 'HISTORY_UPDATED') {
        if (appState.activeTab === 'history') {
          this.renderCurrentView();
        }
      }
    });

    // Initial render
    this.updateHeaderHazardBadge();
    this.renderCurrentView();
    this.updateNavUi(appState.activeTab);
  }

  renderCurrentView() {
    const renderFn = this.views[appState.activeTab] || renderCommandCenter;
    this.mainContainer.innerHTML = '';
    renderFn(this.mainContainer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateNavUi(activeTab) {
    this.navButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === activeTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  updateHeaderHazardBadge() {
    const analysis = appState.currentAnalysis;
    const headerBadge = document.getElementById('header-hazard-badge');
    if (headerBadge && analysis && analysis.prediction) {
      const tierName = analysis.prediction.hazard_tier_name;
      headerBadge.textContent = tierName.toUpperCase();
      headerBadge.className = `hazard-badge ${tierName.toLowerCase()}`;
      headerBadge.style.display = 'inline-flex';
    }
  }
}
