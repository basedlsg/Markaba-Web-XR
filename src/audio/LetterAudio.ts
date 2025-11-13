/**
 * LetterAudio.ts
 *
 * Audio system for letter selection feedback
 * Maps each letter to a unique pitch based on wave mathematics
 *
 * Frequency calculation follows the same wave pattern as spatial positioning:
 * - Uses sine wave to create flowing frequency progression
 * - Creates harmonic relationship between letters along the wave
 * - Range: 220-880 Hz (A3 to A5) - 2-octave comfortable range
 */

/**
 * Calculate wave-based frequency for a letter
 * Follows the same mathematical pattern as the spatial wave
 *
 * @param letter - Letter (A-Z)
 * @returns Frequency in Hz
 */
function calculateWaveFrequency(letter: string): number {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const index = alphabet.indexOf(letter.toUpperCase());

  if (index === -1) return 440; // Default to A4 if invalid

  // Map index (0-25) to t parameter (-1 to 1) - same as spatial calculation
  const t = (index / 25) * 2 - 1;

  // Base frequency range: 220 Hz (A3) to 880 Hz (A5) - 2 octaves
  const minFreq = 220;  // A3
  const maxFreq = 880;  // A5
  const centerFreq = (minFreq + maxFreq) / 2;  // 550 Hz

  // Use sine wave to create flowing frequency pattern
  // This matches the spatial wave pattern: Y = sin(t * π * 2)
  // Frequency undulates up and down along the alphabet like the spatial wave
  const waveModulation = Math.sin(t * Math.PI * 2) * 0.5; // -0.5 to +0.5

  // Calculate frequency: center ± wave modulation
  // This creates a 2-octave range (4:1 ratio) with sine wave progression
  const frequencyRatio = Math.pow(2, waveModulation); // Octave-based scaling
  const frequency = centerFreq * frequencyRatio;

  return frequency;
}

/**
 * Letter-to-pitch mapping (generated from wave mathematics)
 * Each letter has a unique frequency based on its position in the wave
 */
const LETTER_PITCH_MAP: Record<string, { frequency: number }> = {};

// Pre-calculate frequencies for all letters
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
  LETTER_PITCH_MAP[letter] = { frequency: calculateWaveFrequency(letter) };
});

/**
 * Audio context manager for letter sounds
 */
export class LetterAudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentOscillators: Map<string, OscillatorNode> = new Map();

  // Audio settings
  private readonly VOLUME = 0.15;          // Master volume (15%)
  private readonly ATTACK_TIME = 0.01;     // Attack time in seconds (10ms)
  private readonly RELEASE_TIME = 0.1;     // Release time in seconds (100ms)
  private readonly NOTE_DURATION = 0.2;    // Note duration in seconds (200ms)

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Web Audio API context
   */
  private initialize(): void {
    try {
      // Create audio context (check for webkit prefix for Safari)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      // Create master gain node for volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.VOLUME;
      this.masterGain.connect(this.audioContext.destination);

      console.log('LetterAudioManager initialized');
    } catch (error) {
      console.warn('Could not initialize Web Audio API:', error);
    }
  }

  /**
   * Play a tone for a specific letter
   *
   * @param letter - Letter (A-Z)
   * @param duration - Optional duration override (seconds)
   */
  playLetterTone(letter: string, duration?: number): void {
    if (!this.audioContext || !this.masterGain) {
      console.warn('Audio context not initialized');
      return;
    }

    const letterUpper = letter.toUpperCase();
    const pitchData = LETTER_PITCH_MAP[letterUpper];

    if (!pitchData) {
      console.warn(`No pitch mapping for letter: ${letter}`);
      return;
    }

    // Resume audio context if suspended (required for user interaction)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;
    const noteDuration = duration ?? this.NOTE_DURATION;

    // Create oscillator (sine wave for pure tone)
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = pitchData.frequency;

    // Create gain node for envelope (ADSR)
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;

    // Connect: oscillator -> gain -> master gain -> destination
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Attack phase (fade in)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + this.ATTACK_TIME);

    // Sustain phase (hold)
    gainNode.gain.setValueAtTime(1, now + this.ATTACK_TIME);

    // Release phase (fade out)
    const releaseStart = now + noteDuration - this.RELEASE_TIME;
    gainNode.gain.setValueAtTime(1, releaseStart);
    gainNode.gain.linearRampToValueAtTime(0, now + noteDuration);

    // Start and stop oscillator
    oscillator.start(now);
    oscillator.stop(now + noteDuration);

    // Store reference
    this.currentOscillators.set(letterUpper, oscillator);

    // Clean up after note finishes
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
      this.currentOscillators.delete(letterUpper);
    };
  }

  /**
   * Stop a currently playing letter tone
   *
   * @param letter - Letter (A-Z)
   */
  stopLetterTone(letter: string): void {
    const letterUpper = letter.toUpperCase();
    const oscillator = this.currentOscillators.get(letterUpper);

    if (oscillator) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (error) {
        // Ignore if already stopped
      }
      this.currentOscillators.delete(letterUpper);
    }
  }

  /**
   * Stop all currently playing tones
   */
  stopAllTones(): void {
    for (const [letter, oscillator] of this.currentOscillators) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (error) {
        // Ignore if already stopped
      }
    }
    this.currentOscillators.clear();
  }

  /**
   * Get frequency for a letter
   *
   * @param letter - Letter (A-Z)
   * @returns Frequency in Hz or null
   */
  getLetterFrequency(letter: string): number | null {
    const pitchData = LETTER_PITCH_MAP[letter.toUpperCase()];
    return pitchData ? pitchData.frequency : null;
  }

  /**
   * Get wave position (t value) for a letter
   * Used for visualizing frequency mapping
   *
   * @param letter - Letter (A-Z)
   * @returns Wave position from -1 to 1, or null if invalid
   */
  getLetterWavePosition(letter: string): number | null {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const index = alphabet.indexOf(letter.toUpperCase());
    if (index === -1) return null;
    return (index / 25) * 2 - 1;
  }

  /**
   * Set master volume
   *
   * @param volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.masterGain?.gain.value ?? 0;
  }

  /**
   * Dispose audio resources
   */
  dispose(): void {
    this.stopAllTones();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.masterGain = null;
    console.log('LetterAudioManager disposed');
  }
}

/**
 * Test function to play all letter sounds in sequence
 * Useful for debugging and demonstration
 */
export async function playAlphabetSequence(audioManager: LetterAudioManager, delay: number = 300): Promise<void> {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  for (const letter of alphabet) {
    audioManager.playLetterTone(letter);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
