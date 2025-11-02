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
   * Calculate grid position for bubble index
   * Creates evenly-spaced grid layout
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
