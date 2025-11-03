/**
 * DataCollector.ts
 *
 * Machine learning data collection for keyboard optimization
 * Tracks letter selections, bigrams, hand positions, and comfort metrics
 *
 * Optimization priorities:
 * 1. Comfort (minimize neck/shoulder strain)
 * 2. Speed (minimize hand travel distance)
 * 3. Accuracy (reduce selection errors)
 * 4. Predictive placement (move likely-next letters closer)
 */

import { Vector3 } from '@babylonjs/core';

/**
 * Selection event data
 */
export interface SelectionEvent {
  letter: string;              // Selected letter
  timestamp: number;           // Unix timestamp (ms)
  handType: 'left' | 'right';  // Which hand selected
  handPosition: Vector3;       // Hand position at selection
  bubblePosition: Vector3;     // Bubble position at selection
  reachDistance: number;       // Distance hand traveled
  timeSinceLast: number;       // Time since last selection (ms)
  previousLetter: string | null; // Previous letter (for bigrams)
}

/**
 * Bigram (letter pair) statistics
 */
export interface BigramStats {
  pair: string;                // e.g., "TH", "ER", "AN"
  count: number;               // How many times this pair occurred
  avgDistance: number;         // Average distance between the two letters
  avgTime: number;             // Average time between selections
}

/**
 * Comfort metrics
 */
export interface ComfortMetrics {
  avgReachDistance: number;    // Average hand travel distance
  maxReachDistance: number;    // Maximum reach required
  preferredHand: 'left' | 'right' | 'both'; // Dominant hand
  leftHandSelections: number;  // Count of left hand selections
  rightHandSelections: number; // Count of right hand selections
}

/**
 * Data collector for ML-based optimization
 */
export class DataCollector {
  private selections: SelectionEvent[] = [];
  private bigramCounts: Map<string, number> = new Map();
  private lastSelection: SelectionEvent | null = null;

  // Session settings
  private readonly MAX_STORED_SELECTIONS = 1000; // Limit memory usage
  private sessionStartTime: number;

  constructor() {
    this.sessionStartTime = Date.now();
    console.log('DataCollector initialized');
  }

  /**
   * Record a letter selection
   *
   * @param letter - Selected letter
   * @param handType - Which hand selected
   * @param handPosition - Hand position at selection
   * @param bubblePosition - Bubble position at selection
   */
  recordSelection(
    letter: string,
    handType: 'left' | 'right',
    handPosition: Vector3,
    bubblePosition: Vector3
  ): void {
    const now = Date.now();
    const reachDistance = Vector3.Distance(handPosition, bubblePosition);
    const timeSinceLast = this.lastSelection ? now - this.lastSelection.timestamp : 0;
    const previousLetter = this.lastSelection?.letter || null;

    const event: SelectionEvent = {
      letter,
      timestamp: now,
      handType,
      handPosition: handPosition.clone(),
      bubblePosition: bubblePosition.clone(),
      reachDistance,
      timeSinceLast,
      previousLetter
    };

    // Store selection
    this.selections.push(event);

    // Record bigram if we have a previous letter
    if (previousLetter) {
      const bigram = previousLetter + letter;
      const count = this.bigramCounts.get(bigram) || 0;
      this.bigramCounts.set(bigram, count + 1);
    }

    // Update last selection
    this.lastSelection = event;

    // Limit memory usage
    if (this.selections.length > this.MAX_STORED_SELECTIONS) {
      this.selections.shift(); // Remove oldest
    }
  }

  /**
   * Get top N most common bigrams
   *
   * @param n - Number of top bigrams to return
   * @returns Array of bigram statistics
   */
  getTopBigrams(n: number = 10): BigramStats[] {
    // Convert map to array and sort by count
    const sortedBigrams = Array.from(this.bigramCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);

    // Calculate statistics for each bigram
    return sortedBigrams.map(([pair, count]) => {
      const pairSelections = this.selections.filter((s, i) => {
        if (i === 0) return false;
        return this.selections[i - 1].letter + s.letter === pair;
      });

      const avgDistance = pairSelections.length > 0
        ? pairSelections.reduce((sum, s) => sum + s.reachDistance, 0) / pairSelections.length
        : 0;

      const avgTime = pairSelections.length > 0
        ? pairSelections.reduce((sum, s) => sum + s.timeSinceLast, 0) / pairSelections.length
        : 0;

      return { pair, count, avgDistance, avgTime };
    });
  }

  /**
   * Get comfort metrics
   *
   * @returns Comfort statistics
   */
  getComfortMetrics(): ComfortMetrics {
    if (this.selections.length === 0) {
      return {
        avgReachDistance: 0,
        maxReachDistance: 0,
        preferredHand: 'both',
        leftHandSelections: 0,
        rightHandSelections: 0
      };
    }

    const distances = this.selections.map(s => s.reachDistance);
    const avgReachDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const maxReachDistance = Math.max(...distances);

    const leftHandSelections = this.selections.filter(s => s.handType === 'left').length;
    const rightHandSelections = this.selections.filter(s => s.handType === 'right').length;

    let preferredHand: 'left' | 'right' | 'both' = 'both';
    if (leftHandSelections > rightHandSelections * 1.5) {
      preferredHand = 'left';
    } else if (rightHandSelections > leftHandSelections * 1.5) {
      preferredHand = 'right';
    }

    return {
      avgReachDistance,
      maxReachDistance,
      preferredHand,
      leftHandSelections,
      rightHandSelections
    };
  }

  /**
   * Get letter frequency distribution
   *
   * @returns Map of letter to count
   */
  getLetterFrequencies(): Map<string, number> {
    const frequencies = new Map<string, number>();

    for (const selection of this.selections) {
      const count = frequencies.get(selection.letter) || 0;
      frequencies.set(selection.letter, count + 1);
    }

    return frequencies;
  }

  /**
   * Get average selection speed (letters per minute)
   *
   * @returns Letters per minute
   */
  getSelectionSpeed(): number {
    if (this.selections.length < 2) return 0;

    const sessionDuration = Date.now() - this.sessionStartTime;
    const minutes = sessionDuration / 1000 / 60;
    return this.selections.length / minutes;
  }

  /**
   * Export data as JSON (for analysis or storage)
   *
   * @returns JSON string
   */
  exportData(): string {
    return JSON.stringify({
      sessionStartTime: this.sessionStartTime,
      selections: this.selections.map(s => ({
        letter: s.letter,
        timestamp: s.timestamp,
        handType: s.handType,
        reachDistance: s.reachDistance,
        timeSinceLast: s.timeSinceLast,
        previousLetter: s.previousLetter
      })),
      topBigrams: this.getTopBigrams(20),
      comfortMetrics: this.getComfortMetrics(),
      letterFrequencies: Array.from(this.getLetterFrequencies().entries()),
      selectionSpeed: this.getSelectionSpeed()
    }, null, 2);
  }

  /**
   * Clear all collected data
   */
  clear(): void {
    this.selections = [];
    this.bigramCounts.clear();
    this.lastSelection = null;
    this.sessionStartTime = Date.now();
    console.log('DataCollector cleared');
  }

  /**
   * Get total number of selections
   */
  getSelectionCount(): number {
    return this.selections.length;
  }

  /**
   * Print summary statistics to console
   */
  printSummary(): void {
    console.log('=== Data Collection Summary ===');
    console.log(`Total selections: ${this.selections.length}`);
    console.log(`Selection speed: ${this.getSelectionSpeed().toFixed(1)} letters/min`);
    console.log(`\nTop 10 bigrams:`);

    const topBigrams = this.getTopBigrams(10);
    topBigrams.forEach((bg, i) => {
      console.log(`  ${i + 1}. "${bg.pair}" - ${bg.count} times`);
    });

    const comfort = this.getComfortMetrics();
    console.log(`\nComfort metrics:`);
    console.log(`  Avg reach: ${comfort.avgReachDistance.toFixed(2)}m`);
    console.log(`  Max reach: ${comfort.maxReachDistance.toFixed(2)}m`);
    console.log(`  Preferred hand: ${comfort.preferredHand}`);
    console.log(`  Left/Right ratio: ${comfort.leftHandSelections}/${comfort.rightHandSelections}`);
  }
}

/**
 * Helper: Download data as JSON file (browser only)
 */
export function downloadDataAsJSON(collector: DataCollector, filename: string = 'keyboard-data.json'): void {
  const data = collector.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
  console.log(`Data exported to ${filename}`);
}
