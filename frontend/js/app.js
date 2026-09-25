/**
 * SURAKSHA-AI Application Bootstrap
 * Handles theme initialization, mobile navigation, data preloading, and router setup.
 */

import { appState, TEST_SCENARIOS } from './state.js';
import { runDecisionCycle, fetchDistricts } from './api.js';
import { AppRouter } from './router.js';

const THEME_STORAGE_KEY = 'suraksha_theme';

document.addEventListener('DOMContentLoaded', async () => {
  const mainContainer = document.getElementById('view-container');
  const navButtons = document.querySelectorAll('.nav-item');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const appNav = document.getElementById('app-nav');

  // 1. Initialize Theme Management
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (themeToggleIcon && themeToggleBtn) {
      if (theme === 'bright') {
        themeToggleIcon.textContent = '☾';
        themeToggleBtn.setAttribute('title', 'Switch to Dark Mode (Command Center)');
        themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
      } else {
        themeToggleIcon.textContent = '☀';
        themeToggleBtn.setAttribute('title', 'Switch to Bright Mode');
        themeToggleBtn.setAttribute('aria-label', 'Switch to Bright Mode');
      }
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'bright' ? 'dark' : 'bright';
      applyTheme(newTheme);
    });
  }

  initTheme();

  // 2. Initialize Mobile Navigation Menu Toggle
  if (mobileMenuBtn && appNav) {
    mobileMenuBtn.addEventListener('click', () => {
      appNav.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!appNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        appNav.classList.remove('open');
      }
    });
  }

  // 3. Initialize Router
  const router = new AppRouter(mainContainer, navButtons);

  // 4. Preload District Demographic Data
  try {
    const districts = await fetchDistricts();
    appState.setDistricts(districts);
  } catch (err) {
    console.warn('Could not load district records:', err.message);
  }

  // 5. Initial Assessment:
  // If persistent history exists, appState constructor already restored the latest run!
  // Only execute baseline scenario if NO active analysis exists in storage.
  if (!appState.currentAnalysis) {
    try {
      const initialResult = await runDecisionCycle(TEST_SCENARIOS.normal.values);
      appState.setAnalysis(initialResult, TEST_SCENARIOS.normal.values);
    } catch (err) {
      console.warn('Initial decision cycle run deferred:', err.message);
    }
  }
});
