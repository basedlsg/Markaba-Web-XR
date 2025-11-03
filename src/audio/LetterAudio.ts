/**
 * LetterAudio.ts
 *
 * Audio system for letter selection feedback
 * Maps each letter to a unique pitch based on phonetic properties
 *
 * Pitch ranges based on synesthesia research:
 * - Vowels: 250-800 Hz (lower, more resonant)
 * - Voiced consonants: 250-4000 Hz (medium range)
 * - Unvoiced consonants: 2000-8000 Hz (higher, sharper)
 */

/**
 * Phonetic categories
 */
enum PhoneticCategory {
  VOWEL = 'vowel',
  VOICED_CONSONANT = 'voiced',
  UNVOICED_CONSONANT = 'unvoiced'
}

/**
 * Letter-to-pitch mapping
 * Each letter has a unique frequency based on its phonetic properties
 */
const LETTER_PITCH_MAP: Record<string, { frequency: number; category: PhoneticCategory }> = {
  // Vowels (250-800 Hz) - lower, more resonant
  'A': { frequency: 440.0, category: PhoneticCategory.VOWEL },  // A4 (standard tuning reference)
  'E': { frequency: 329.6, category: PhoneticCategory.VOWEL },  // E4
  'I': { frequency: 587.3, category: PhoneticCategory.VOWEL },  // D5
  'O': { frequency: 293.7, category: PhoneticCategory.VOWEL },  // D4
  'U': { frequency: 523.3, category: PhoneticCategory.VOWEL },  // C5

  // Voiced consonants (250-4000 Hz) - medium range
  'B': { frequency: 246.9, category: PhoneticCategory.VOICED_CONSONANT },  // B3
  'D': { frequency: 493.9, category: PhoneticCategory.VOICED_CONSONANT },  // B4
  'G': { frequency: 392.0, category: PhoneticCategory.VOICED_CONSONANT },  // G4
  'J': { frequency: 659.3, category: PhoneticCategory.VOICED_CONSONANT },  // E5
  'L': { frequency: 880.0, category: PhoneticCategory.VOICED_CONSONANT },  // A5
  'M': { frequency: 261.6, category: PhoneticCategory.VOICED_CONSONANT },  // C4
  'N': { frequency: 349.2, category: PhoneticCategory.VOICED_CONSONANT },  // F4
  'R': { frequency: 739.9, category: PhoneticCategory.VOICED_CONSONANT },  // F#5
  'V': { frequency: 987.8, category: PhoneticCategory.VOICED_CONSONANT },  // B5
  'W': { frequency: 1174.7, category: PhoneticCategory.VOICED_CONSONANT }, // D6
  'Y': { frequency: 1318.5, category: PhoneticCategory.VOICED_CONSONANT }, // E6
  'Z': { frequency: 1568.0, category: PhoneticCategory.VOICED_CONSONANT }, // G6

  // Unvoiced consonants (2000-8000 Hz) - higher, sharper
  'C': { frequency: 2093.0, category: PhoneticCategory.UNVOICED_CONSONANT }, // C7
  'F': { frequency: 2349.3, category: PhoneticCategory.UNVOICED_CONSONANT }, // D7
  'H': { frequency: 2637.0, category: PhoneticCategory.UNVOICED_CONSONANT }, // E7
  'K': { frequency: 2793.8, category: PhoneticCategory.UNVOICED_CONSONANT }, // F7
  'P': { frequency: 3136.0, category: PhoneticCategory.UNVOICED_CONSONANT }, // G7
  'Q': { frequency: 3520.0, category: PhoneticCategory.UNVOICED_CONSONANT }, // A7
  'S': { frequency: 3951.1, category: PhoneticCategory.UNVOICED_CONSONANT }, // B7
  'T': { frequency: 4186.0, category: PhoneticCategory.UNVOICED_CONSONANT }, // C8
  'X': { frequency: 4698.6, category: PhoneticCategory.UNVOICED_CONSONANT }, // D8
};

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
   * Get phonetic category for a letter
   *
   * @param letter - Letter (A-Z)
   * @returns Phonetic category or null
   */
  getLetterCategory(letter: string): PhoneticCategory | null {
    const pitchData = LETTER_PITCH_MAP[letter.toUpperCase()];
    return pitchData ? pitchData.category : null;
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
