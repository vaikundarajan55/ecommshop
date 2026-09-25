// src/utils/aiTrackingClient.js
// Talks to the Python AI microservice that predicts delivery windows / delay risk
const axios = require('axios');

const AI_BASE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Ask the AI service to predict delivery date + delay risk for an order.
 * Falls back gracefully (returns null) if the AI service is unreachable,
 * so order flow never breaks because of it.
 */
exports.predictDelivery = async (payload) => {
  try {
    const { data } = await axios.post(`${AI_BASE_URL}/predict/delivery`, payload, { timeout: 4000 });
    return data; // { predicted_delivery_date, delay_risk, confidence }
  } catch (err) {
    console.warn('[AI Service] prediction unavailable:', err.message);
    return null;
  }
};

exports.reportAnomaly = async (payload) => {
  try {
    const { data } = await axios.post(`${AI_BASE_URL}/track/anomaly`, payload, { timeout: 4000 });
    return data; // { is_anomaly, reason }
  } catch (err) {
    console.warn('[AI Service] anomaly check unavailable:', err.message);
    return null;
  }
};
