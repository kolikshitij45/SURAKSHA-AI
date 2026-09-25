/**
 * SURAKSHA-AI API Integration Layer
 * Connects directly to the FastAPI REST backend.
 */

// Dynamically determine API base URL: if served from same origin (e.g. static mount), use origin, else fallback to 127.0.0.1:8000
const API_BASE_URL = window.location.port === '8000' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : 'http://127.0.0.1:8000';

/**
 * Executes the full agent decision cycle.
 * POST /agent/run-decision-cycle
 * @param {Object} payload 19 hydrometeorological parameters
 * @returns {Promise<Object>} AgentCycleResponse { prediction, plan }
 */
export async function runDecisionCycle(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/run-decision-cycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Operational assessment error: ${response.status} ${errText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error in runDecisionCycle:', error);
    throw error;
  }
}

/**
 * Fetches demographic and shelter vulnerability data across taluks.
 * GET /data/districts
 * @returns {Promise<Array>} List of taluk records
 */
export async function fetchDistricts() {
  try {
    const response = await fetch(`${API_BASE_URL}/data/districts`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Data fetch error: ${response.status} ${errText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error in fetchDistricts:', error);
    throw error;
  }
}
