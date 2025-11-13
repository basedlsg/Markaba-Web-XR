/**
 * WaveCalculator.ts
 *
 * Core wave mathematics ported from Unity WaveMatrixCore.cs
 * Handles wave interference patterns for bubble positioning
 *
 * Original: UnityProject/Assets/XRBubbleLibrary/WaveMatrix/WaveMatrixCore.cs (lines 67-101)
 *
 * Performance-critical: This code runs 100+ times per frame
 * All functions are pure (no side effects) for optimization
 */

import { Vector2, Vector3 } from '@babylonjs/core';

/**
 * Letter frequency data from academic corpus linguistics research
 * Source: Peter Norvig's analysis (Google Books corpus - 743 billion words)
 * and British National Corpus (90 million words)
 *
 * Ranking: E T A O I N S R H L D C U M F P G W Y B V K X J Q Z
 */
const LETTER_FREQUENCY_ZONES = {
  close: ['E', 'T', 'A', 'O', 'I', 'N', 'S', 'R', 'H'],      // Top 9 (most frequent)
  mid: ['L', 'D', 'C', 'U', 'M', 'F', 'P', 'G', 'W'],        // Medium 9
  far: ['Y', 'B', 'V', 'K', 'X', 'J', 'Q', 'Z']              // Bottom 8 (least frequent)
};

/**
 * Settings for a single wave component
 */
export interface WaveComponent {
  frequency: number;   // Wave frequency (oscillations per unit distance)
  amplitude: number;   // Wave height
  speed: number;       // Propagation speed
  phase: number;       // Initial phase offset (radians)
}

/**
 * Complete wave system settings
 * Ported from Unity WaveMatrixSettings.cs
 */
export interface WaveSettings {
  primaryWave: WaveComponent;      // X-axis oscillation
  secondaryWave: WaveComponent;    // Z-axis oscillation
  tertiaryWave: WaveComponent;     // Radial oscillation
  interferenceFreq: number;        // Cross-wave interference frequency
  interferenceAmplitude: number;   // Interference strength
  enableInterference: boolean;     // Toggle interference calculations
  baseHeight: number;              // Starting height offset
}

/**
 * Breathing animation settings
 * Ported from Unity BreathingSettings.cs
 */
export interface BreathingSettings {
  frequency: number;        // Breaths per second (default: 0.25 = 15/min)
  amplitude: number;        // Breathing displacement magnitude
  horizontalSway: number;   // Horizontal movement factor
  depthMovement: number;    // Depth movement factor
}

/**
 * Wave calculation utilities
 * Pure math functions - no framework dependencies
 */
export class WaveCalculator {

  /**
   * Calculate wave height at a world position
   *
   * Ported from Unity WaveMatrixCore.cs CalculateWaveHeight() (lines 67-101)
   * This is the core innovation - wave interference creating natural movement
   *
   * @param worldPosition - 2D position in world space (XZ plane)
   * @param time - Current time in seconds
   * @param settings - Wave configuration
   * @returns Combined wave height at this position
   */
  static calculateWaveHeight(
    worldPosition: Vector2,
    time: number,
    settings: WaveSettings
  ): number {
    let height = settings.baseHeight;
    const x = worldPosition.x;
    const z = worldPosition.y;

    // Primary wave component (X-axis oscillation)
    // Creates horizontal wave patterns
    height += Math.sin(
      x * settings.primaryWave.frequency +
      time * settings.primaryWave.speed +
      settings.primaryWave.phase
    ) * settings.primaryWave.amplitude;

    // Secondary wave component (Z-axis oscillation)
    // Creates vertical wave patterns
    height += Math.sin(
      z * settings.secondaryWave.frequency +
      time * settings.secondaryWave.speed +
      settings.secondaryWave.phase
    ) * settings.secondaryWave.amplitude;

    // Tertiary wave component (radial oscillation)
    // Creates circular wave patterns from center
    const radialDistance = Math.sqrt(x * x + z * z);
    height += Math.sin(
      radialDistance * settings.tertiaryWave.frequency +
      time * settings.tertiaryWave.speed +
      settings.tertiaryWave.phase
    ) * settings.tertiaryWave.amplitude;

    // Interference pattern (cross-wave multiplication)
    // Creates complex emergent patterns
    if (settings.enableInterference) {
      const interference =
        Math.sin(x * settings.interferenceFreq + time) *
        Math.cos(z * settings.interferenceFreq + time) *
        settings.interferenceAmplitude;
      height += interference;
    }

    return height;
  }

  /**
   * Calculate breathing displacement for a bubble
   *
   * Ported from Unity BreathingAnimationSystem.cs CalculateBreathingValues()
   * Creates subtle organic movement like breathing
   *
   * @param time - Current time in seconds
   * @param individualPhase - Random phase offset for this bubble
   * @param settings - Breathing configuration
   * @returns 3D displacement vector
   */
  static calculateBreathingOffset(
    time: number,
    individualPhase: number,
    settings: BreathingSettings
  ): Vector3 {
    const phase = time * settings.frequency * Math.PI * 2 + individualPhase;
    const sineComponent = Math.sin(phase) * settings.amplitude;
    const cosineComponent = Math.cos(phase) * settings.amplitude * 0.5;

    return new Vector3(
      sineComponent * settings.horizontalSway,  // Slight horizontal sway
      sineComponent,                            // Primary vertical breathing
      cosineComponent * settings.depthMovement  // Minimal depth movement
    );
  }

  /**
   * Calculate combined position for a bubble
   * Combines wave height + breathing animation
   *
   * @param gridPosition - Base grid position (XZ)
   * @param time - Current time
   * @param individualPhase - Per-bubble phase offset
   * @param waveSettings - Wave configuration
   * @param breathingSettings - Breathing configuration
   * @returns Final 3D world position
   */
  static calculateBubblePosition(
    gridPosition: Vector2,
    time: number,
    individualPhase: number,
    waveSettings: WaveSettings,
    breathingSettings: BreathingSettings
  ): Vector3 {
    // Calculate wave-based Y position
    const waveHeight = this.calculateWaveHeight(gridPosition, time, waveSettings);

    // Calculate breathing offset
    const breathingOffset = this.calculateBreathingOffset(
      time,
      individualPhase,
      breathingSettings
    );

    // Combine: grid position + wave height + breathing
    return new Vector3(
      gridPosition.x + breathingOffset.x,
      waveHeight + breathingOffset.y,
      gridPosition.y + breathingOffset.z
    );
  }

  /**
   * Default wave settings matching Unity configuration
   * Ported from WaveMatrixSettings.cs default values
   */
  static getDefaultWaveSettings(): WaveSettings {
    return {
      primaryWave: {
        frequency: 1.0,
        amplitude: 0.3,
        speed: 1.5,
        phase: 0
      },
      secondaryWave: {
        frequency: 1.2,
        amplitude: 0.25,
        speed: 1.8,
        phase: Math.PI / 4  // 45-degree phase shift
      },
      tertiaryWave: {
        frequency: 0.8,
        amplitude: 0.15,
        speed: 1.2,
        phase: Math.PI / 2  // 90-degree phase shift
      },
      interferenceFreq: 2.0,
      interferenceAmplitude: 0.1,
      enableInterference: true,
      baseHeight: 0.0
    };
  }

  /**
   * Default breathing settings
   * Ported from Unity BreathingSettings.cs
   */
  static getDefaultBreathingSettings(): BreathingSettings {
    return {
      frequency: 0.25,        // 15 breaths per minute (0.25 Hz)
      amplitude: 0.1,         // 10cm breathing displacement
      horizontalSway: 0.1,    // 10% horizontal component
      depthMovement: 0.05     // 5% depth component
    };
  }

  /**
   * Generate random phase offset for bubble individuality
   * Each bubble gets a unique phase to prevent synchronized movement
   */
  static generateRandomPhase(): number {
    return Math.random() * Math.PI * 2;
  }

  /**
   * Get depth zone for a letter based on frequency
   * Most frequent letters are closer, least frequent are farther
   *
   * @param letter - Letter (A-Z)
   * @returns Depth zone: 'close', 'mid', or 'far'
   */
  static getLetterDepthZone(letter: string): 'close' | 'mid' | 'far' {
    const upper = letter.toUpperCase();
    if (LETTER_FREQUENCY_ZONES.close.includes(upper)) return 'close';
    if (LETTER_FREQUENCY_ZONES.mid.includes(upper)) return 'mid';
    if (LETTER_FREQUENCY_ZONES.far.includes(upper)) return 'far';
    return 'mid'; // Default to mid if not found
  }

  /**
   * QWERTY keyboard layout with wave-based positioning
   * Combines ergonomic QWERTY ordering with beautiful wave mathematics
   *
   * Solution to Dr. Tanaka's concern: "beautiful AND useful"
   * - QWERTY ordering = useful (familiar, optimized for English)
   * - Wave-based positioning = beautiful (natural 3D flow)
   */
  static readonly QWERTY_LAYOUT = {
    // QWERTY rows mapped to wave positions
    'Q': 0, 'W': 1, 'E': 2, 'R': 3, 'T': 4, 'Y': 5, 'U': 6, 'I': 7, 'O': 8, 'P': 9,  // Row 1
    'A': 10, 'S': 11, 'D': 12, 'F': 13, 'G': 14, 'H': 15, 'J': 16, 'K': 17, 'L': 18,   // Row 2
    'Z': 19, 'X': 20, 'C': 21, 'V': 22, 'B': 23, 'N': 24, 'M': 25                      // Row 3
  } as const;

  /**
   * Calculate position along a 3D sine wave pattern
   * NOW SUPPORTS BOTH: Alphabetical (legacy) and QWERTY (recommended)
   *
   * Layout:
   * - Width: 12.5m (±6.25m from center) - 2.5x spacing for comfortable reach
   * - Height: 0.8m sine wave variation (vertical undulation)
   * - Depth: 1.2m cosine wave variation (depth undulation, creates 3D wave)
   *   - Range: 1.3m (close) to 3.7m (far)
   *   - Cosine creates offset from height sine wave for 3D effect
   *
   * Creates a unified 3D wave pattern where both height and depth undulate
   * together as you scan left to right.
   *
   * @param index - Letter index (0-25 for A-Z alphabetical)
   * @param letter - The actual letter (used for QWERTY mapping if enabled)
   * @param letterCount - Total letters (default 26)
   * @param randomSeed - Random seed (unused, kept for compatibility)
   * @param useQWERTY - Use QWERTY ordering instead of alphabetical (default: true)
   * @returns 3D position on unified wave pattern
   */
  static calculateSineWavePosition(
    index: number,
    letter: string,
    letterCount: number = 26,
    randomSeed: number = 0.5,
    useQWERTY: boolean = true
  ): Vector3 {
    // Use QWERTY position if enabled, otherwise use alphabetical index
    const waveIndex = useQWERTY ? (this.QWERTY_LAYOUT[letter.toUpperCase() as keyof typeof this.QWERTY_LAYOUT] ?? index) : index;
    // Layout parameters (balanced for comfort)
    const waveWidth = 12.5;      // 12.5m wide (±6.25m left/right) - 2.5x spacing
    const waveHeight = 0.8;      // 0.8m vertical sine wave
    const baseHeight = 1.5;      // 1.5m eye level

    // Calculate horizontal position using wave index
    // t ranges from -1 (leftmost position) to +1 (rightmost position)
    const t = (waveIndex / (letterCount - 1)) * 2 - 1;

    // X: horizontal spread (QWERTY or alphabetically organized)
    const x = t * (waveWidth / 2);

    // Y: sine wave height variation
    // 2 full sine waves across the width
    const y = baseHeight + Math.sin(t * Math.PI * 2) * waveHeight;

    // Z: wave-based depth variation (creates 3D wave pattern)
    // Use cosine so depth wave is offset from height wave
    const baseDepth = 2.5;       // 2.5m average distance
    const waveDepth = 1.2;       // 1.2m depth variation (0.8m to 4.5m range)
    const z = baseDepth + Math.cos(t * Math.PI * 2) * waveDepth;

    return new Vector3(x, y, z);
  }

  /**
   * Calculate animated sine wave position with flowing motion
   *
   * @param index - Letter index (0-25)
   * @param time - Current time for animation
   * @param letterCount - Total letters (default 26)
   * @param waveWidth - Total width (default 8m)
   * @param waveHeight - Amplitude (default 1.0m)
   * @param baseDistance - Forward distance (default 3.0m)
   * @param baseHeight - Base height (default 1.5m)
   * @returns Animated position with flowing wave
   */
  static calculateAnimatedSineWave(
    index: number,
    time: number,
    letterCount: number = 26,
    waveWidth: number = 8.0,
    waveHeight: number = 1.0,
    baseDistance: number = 3.0,
    baseHeight: number = 1.5
  ): Vector3 {
    const t = (index / (letterCount - 1)) * 2 - 1;
    const x = t * (waveWidth / 2);

    // Traveling wave effect
    const timePhase = time * 0.5;
    const spatialPhase = t * Math.PI * 2;
    const y = baseHeight + Math.sin(spatialPhase + timePhase) * waveHeight;

    // Subtle depth variation
    const depthWave = Math.cos(spatialPhase + timePhase) * 0.4;
    const z = baseDistance + depthWave;

    return new Vector3(x, y, z);
  }

  /**
   * Calculate arc position for keyboard letter layout
   * LEGACY: Original arc-based layout (letters were too close together)
   * @deprecated Use calculateSineWavePosition for better spacing
   */
  static calculateArcPosition(
    index: number,
    letterCount: number = 26,
    arcRadius: number = 1.2,
    arcAngleDegrees: number = 80,
    verticalAngleDegrees: number = -25
  ): Vector3 {
    // Calculate horizontal angle for this letter
    // Spread letters evenly across the arc
    const angleStep = arcAngleDegrees / (letterCount - 1);
    const horizontalAngle = (index * angleStep - arcAngleDegrees / 2) * (Math.PI / 180);

    // Convert vertical angle to radians
    const verticalAngle = verticalAngleDegrees * (Math.PI / 180);

    // Calculate 3D position using spherical coordinates
    // X: horizontal position (left to right)
    // Y: vertical position (downward for desk view)
    // Z: depth (distance from user)
    const x = arcRadius * Math.sin(horizontalAngle) * Math.cos(verticalAngle);
    const y = arcRadius * Math.sin(verticalAngle);
    const z = arcRadius * Math.cos(horizontalAngle) * Math.cos(verticalAngle);

    return new Vector3(x, y, z);
  }

  /**
   * Apply wave oscillation to arc position
   * Creates both vertical (up/down) and depth (forward/back) movement
   *
   * @param basePosition - Base arc position
   * @param index - Letter index (0-25)
   * @param time - Current time
   * @param verticalAmplitude - How much to oscillate up/down (default 0.3m)
   * @param depthAmplitude - How much to oscillate forward/back (default 0.2m)
   * @returns Position with wave applied
   */
  static applyWaveToArc(
    basePosition: Vector3,
    index: number,
    time: number,
    verticalAmplitude: number = 0.3,
    depthAmplitude: number = 0.2
  ): Vector3 {
    // Create wave phase that varies across the 26 letters
    // This makes the wave travel around the arc
    const wavePhase = (index / 26) * Math.PI * 2; // Full wave across all letters

    // Time-based animation (slow wave movement)
    const timePhase = time * 0.5;

    // Calculate vertical wave (up and down)
    const verticalOffset = Math.sin(wavePhase + timePhase) * verticalAmplitude;

    // Calculate depth wave (forward and back)
    // Offset phase slightly so it's not synchronized with vertical
    const depthOffset = Math.sin(wavePhase + timePhase + Math.PI / 4) * depthAmplitude;

    // Apply vertical offset (Y axis)
    const newPosition = basePosition.clone();
    newPosition.y += verticalOffset;

    // Apply depth offset (along radial direction from center)
    const radialDirection = new Vector3(basePosition.x, 0, basePosition.z).normalize();
    newPosition.x += radialDirection.x * depthOffset;
    newPosition.z += radialDirection.z * depthOffset;

    return newPosition;
  }

  /**
   * Add depth wave oscillation to arc position (LEGACY)
   * @deprecated Use applyWaveToArc instead for better wave effect
   */
  static applyDepthWave(
    basePosition: Vector3,
    index: number,
    time: number,
    waveAmplitude: number = 0.15,
    waveFrequency: number = 2.0
  ): Vector3 {
    // Calculate wave offset along the arc
    const wavePhase = index * (Math.PI / 13); // Half wavelength across 26 letters
    const depthOffset = Math.sin(time * 0.5 + wavePhase) * waveAmplitude;

    // Apply depth offset along the Z-axis (toward/away from user)
    // Normalize the direction vector and scale by offset
    const direction = basePosition.clone().normalize();
    const offset = direction.scale(depthOffset);

    return basePosition.add(offset);
  }

  /**
   * Calculate grid position for bubble index
   * LEGACY: Used for original grid demo
   * Keeping for backwards compatibility
   *
   * @param index - Bubble index (0 to count-1)
   * @param gridSize - Number of bubbles per row/column
   * @param spacing - Distance between bubbles
   * @returns 2D grid position
   */
  static calculateGridPosition(
    index: number,
    gridSize: number,
    spacing: number
  ): Vector2 {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    // Center the grid around origin
    const offset = (gridSize - 1) * spacing / 2;

    return new Vector2(
      col * spacing - offset,
      row * spacing - offset
    );
  }

  /**
   * Optimized batch calculation for multiple bubbles
   * Pre-calculates time-dependent values once
   *
   * @param bubbleCount - Number of bubbles to calculate
   * @param gridSize - Grid dimensions
   * @param spacing - Bubble spacing
   * @param time - Current time
   * @param phases - Array of individual phase offsets
   * @param waveSettings - Wave configuration
   * @param breathingSettings - Breathing configuration
   * @returns Array of 3D positions
   */
  static calculateAllBubblePositions(
    bubbleCount: number,
    gridSize: number,
    spacing: number,
    time: number,
    phases: number[],
    waveSettings: WaveSettings,
    breathingSettings: BreathingSettings
  ): Vector3[] {
    const positions: Vector3[] = [];

    for (let i = 0; i < bubbleCount; i++) {
      const gridPos = this.calculateGridPosition(i, gridSize, spacing);
      const worldPos = this.calculateBubblePosition(
        gridPos,
        time,
        phases[i],
        waveSettings,
        breathingSettings
      );
      positions.push(worldPos);
    }

    return positions;
  }
}
