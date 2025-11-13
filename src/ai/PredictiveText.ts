/**
 * PredictiveText.ts
 *
 * AI-powered predictive text using Groq API
 * Predicts next likely letters based on current text context
 *
 * Uses Groq's ultra-fast LLM inference for real-time predictions
 */

export interface LetterPrediction {
  letter: string;
  probability: number;
  rank: number;
}

export interface PredictionResult {
  predictions: LetterPrediction[];
  context: string;
  timestamp: number;
}

/**
 * Groq API client for next-letter prediction
 */
export class GroqPredictiveText {
  private apiKey: string;
  private apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private model = 'llama-3.1-8b-instant'; // Fast, efficient model
  private cache: Map<string, PredictionResult> = new Map();
  private cacheTimeout = 5000; // 5 seconds

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Predict next likely letters based on current context
   * Uses LLM to understand language patterns and predict what comes next
   *
   * @param context - Current text (last 20 characters recommended)
   * @param topK - Number of predictions to return (default: 5)
   * @returns Array of letter predictions with probabilities
   */
  async predictNextLetters(context: string, topK: number = 5): Promise<LetterPrediction[]> {
    // Check cache first (avoid redundant API calls)
    const cacheKey = `${context}_${topK}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.predictions;
    }

    // Handle empty context
    if (!context || context.trim().length === 0) {
      return this.getDefaultPredictions();
    }

    try {
      // Call Groq API for predictions
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a next-letter prediction system for VR text input. Given a text context, predict the top 5 most likely next letters (A-Z) in order of probability. Respond ONLY with 5 letters separated by spaces, in order from most to least likely. Example: "E T A I N"'
            },
            {
              role: 'user',
              content: `Text so far: "${context}"\n\nWhat are the 5 most likely next letters?`
            }
          ],
          temperature: 0.3, // Low temperature for consistent predictions
          max_tokens: 20,   // Short response
          top_p: 0.9
        })
      });

      if (!response.ok) {
        console.warn(`Groq API error: ${response.status} ${response.statusText}`);
        return this.getDefaultPredictions();
      }

      const data = await response.json();
      const prediction = data.choices[0]?.message?.content?.trim() || '';

      // Parse the prediction (expected format: "E T A I N")
      const letters = prediction
        .toUpperCase()
        .split(/\s+/)
        .filter((l: string) => /^[A-Z]$/.test(l))
        .slice(0, topK);

      // Convert to LetterPrediction objects with probabilities
      const predictions: LetterPrediction[] = letters.map((letter: string, index: number) => ({
        letter,
        probability: 1.0 - (index / topK), // Decreasing probability
        rank: index + 1
      }));

      // Cache the result
      const result: PredictionResult = {
        predictions,
        context,
        timestamp: Date.now()
      };
      this.cache.set(cacheKey, result);

      // Clean old cache entries (keep last 20)
      if (this.cache.size > 20) {
        const oldestKey = Array.from(this.cache.keys())[0];
        this.cache.delete(oldestKey);
      }

      return predictions;

    } catch (error) {
      console.error('Groq API prediction error:', error);
      return this.getDefaultPredictions();
    }
  }

  /**
   * Get default predictions when API is unavailable
   * Uses English letter frequency as fallback
   */
  private getDefaultPredictions(): LetterPrediction[] {
    // Most common English letters
    const common = ['E', 'T', 'A', 'O', 'I'];
    return common.map((letter, index) => ({
      letter,
      probability: 1.0 - (index / 5),
      rank: index + 1
    }));
  }

  /**
   * Predict complete words (experimental)
   * Uses Groq to suggest full word completions
   */
  async predictWords(context: string, topK: number = 3): Promise<string[]> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a word prediction system. Given incomplete text, suggest the 3 most likely next words. Respond ONLY with the words separated by commas. Example: "hello, world, test"'
            },
            {
              role: 'user',
              content: `Text: "${context}"\n\nNext 3 likely words?`
            }
          ],
          temperature: 0.5,
          max_tokens: 30
        })
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const prediction = data.choices[0]?.message?.content?.trim() || '';

      // Parse comma-separated words
      return prediction
        .split(',')
        .map((w: string) => w.trim())
        .filter((w: string) => w.length > 0)
        .slice(0, topK);

    } catch (error) {
      console.error('Word prediction error:', error);
      return [];
    }
  }

  /**
   * Clear prediction cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Helper: Create Groq predictive text instance
 */
export function createPredictiveText(apiKey: string): GroqPredictiveText {
  return new GroqPredictiveText(apiKey);
}
