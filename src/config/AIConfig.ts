/**
 * AI Configuration
 *
 * Groq API configuration for predictive text
 * Set VITE_GROQ_API_KEY in your .env file
 *
 * Example .env file:
 * VITE_GROQ_API_KEY=gsk_your_key_here
 */

// Get API key from environment variable
// @ts-ignore - Vite env types
const envApiKey = typeof import.meta?.env?.VITE_GROQ_API_KEY === 'string' ? import.meta.env.VITE_GROQ_API_KEY : '';

// Warn if no API key is set
if (!envApiKey) {
  console.warn('⚠️  VITE_GROQ_API_KEY not set in .env file. AI predictions will use frequency fallback only.');
}

export const AI_CONFIG = {
  // Groq API key from environment variable (.env file)
  groqApiKey: envApiKey,

  // Model selection
  model: 'llama-3.1-8b-instant',

  // Prediction settings
  topK: 5, // Number of letter predictions
  cacheTimeout: 5000, // 5 seconds
  debounceMs: 200, // 200ms debounce

  // Temperature (0.0-1.0, lower = more deterministic)
  temperature: 0.3,

  // Enable/disable AI predictions (automatically disabled if no API key)
  enabled: envApiKey.length > 0
};
