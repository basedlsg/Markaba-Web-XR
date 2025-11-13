/**
 * AI Configuration
 *
 * Groq API configuration for predictive text
 * For production, use environment variables
 */

import { GROQ_API_KEY } from './secrets';

// Get API key from environment or use default from secrets file
// @ts-ignore - Vite env types
const envApiKey = typeof import.meta?.env?.VITE_GROQ_API_KEY === 'string' ? import.meta.env.VITE_GROQ_API_KEY : null;

export const AI_CONFIG = {
  // Groq API key - can be overridden by environment variable
  groqApiKey: envApiKey || GROQ_API_KEY,

  // Model selection
  model: 'llama-3.1-8b-instant',

  // Prediction settings
  topK: 5, // Number of letter predictions
  cacheTimeout: 5000, // 5 seconds
  debounceMs: 200, // 200ms debounce

  // Temperature (0.0-1.0, lower = more deterministic)
  temperature: 0.3,

  // Enable/disable AI predictions
  enabled: true
};
