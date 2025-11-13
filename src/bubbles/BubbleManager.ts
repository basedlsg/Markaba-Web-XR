/**
 * BubbleManager.ts
 *
 * Manages bubble lifecycle, positioning, and rendering
 * Uses GPU instancing for performance (1 draw call for all bubbles)
 *
 * Ported from Unity BubblePositionCalculator.cs
 */

import {
  Scene,
  Mesh,
  MeshBuilder,
  InstancedMesh,
  Vector2,
  Vector3,
  TransformNode
} from '@babylonjs/core';
import { WaveCalculator, WaveSettings, BreathingSettings } from '../math/WaveCalculator';
import { createGlassMaterial } from './GlassMaterial';
import { createLetterLabel, getDefaultLabelConfig } from './LetterLabel';

/**
 * Bubble configuration
 */
export interface BubbleConfig {
  count: number;        // Number of bubbles
  radius: number;       // Bubble radius
  // Arc layout settings (for letter keyboard)
  arcRadius?: number;   // Distance from user (default 1.2m)
  arcAngle?: number;    // Horizontal arc span (default 80°)
  verticalAngle?: number; // Downward tilt (default -25°)
  // Legacy grid settings
  gridSize?: number;    // Grid dimensions (e.g., 7x7 = 49 bubbles)
  spacing?: number;     // Distance between bubbles
}

/**
 * Individual bubble data
 */
interface BubbleData {
  instance: InstancedMesh;  // Mesh instance
  basePosition: Vector3;    // Base arc position (without waves)
  index: number;            // Bubble index (for arc positioning)
  phase: number;            // Individual phase offset
  letter?: string;          // Letter (A-Z) for keyboard mode
  labelMesh?: Mesh;         // Text label mesh (for keyboard mode)
}

/**
 * BubbleManager - Creates and animates glass bubbles
 */
export class BubbleManager {
  private scene: Scene;
  private bubbles: BubbleData[] = [];
  private baseMesh!: Mesh;
  private waveSettings: WaveSettings;
  private breathingSettings: BreathingSettings;
  private config: BubbleConfig;
  private startTime: number;

  constructor(scene: Scene, config: BubbleConfig) {
    this.scene = scene;
    this.config = config;
    this.startTime = Date.now() / 1000;

    // Load default settings
    this.waveSettings = WaveCalculator.getDefaultWaveSettings();
    this.breathingSettings = WaveCalculator.getDefaultBreathingSettings();

    this.initialize();
  }

  /**
   * Initialize bubbles with GPU instancing
   */
  private initialize(): void {
    // Create base sphere mesh (all instances share this geometry)
    this.baseMesh = MeshBuilder.CreateSphere(
      "bubbleBase",
      {
        diameter: this.config.radius * 2,
        segments: 32 // Good balance of quality and performance
      },
      this.scene
    );

    // Apply glass material
    this.baseMesh.material = createGlassMaterial(this.scene);

    // Hide the base mesh (only instances are visible)
    this.baseMesh.isVisible = false;

    // Create bubble instances
    this.createBubbles();

    console.log(`Created ${this.bubbles.length} bubbles with GPU instancing`);
  }

  /**
   * Create bubble instances in sine wave layout (for letter keyboard)
   */
  private createBubbles(): void {
    // Use sine wave layout if arcRadius is set (config name kept for compatibility)
    const useArcLayout = this.config.arcRadius !== undefined;

    // Generate alphabet for keyboard mode (A-Z)
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    for (let i = 0; i < this.config.count; i++) {
      let basePosition: Vector3;
      let letter: string | undefined;

      // Generate random phase for this bubble (used for breathing AND depth randomization)
      const phase = WaveCalculator.generateRandomPhase();

      // Assign letter first (needed for position calculation)
      if (this.config.arcRadius !== undefined && this.config.count === 26 && i < alphabet.length) {
        letter = alphabet[i];
      }

      if (useArcLayout && letter) {
        // Calculate sine wave position with frequency-based depth
        // Uses letter to determine depth zone (frequent = close, rare = far)
        // Uses phase as random seed for depth variation within zone
        basePosition = WaveCalculator.calculateSineWavePosition(
          i,
          letter,
          this.config.count,
          phase / (Math.PI * 2)  // Convert phase (0-2π) to seed (0-1)
        );
      } else if (useArcLayout) {
        // Fallback if no letter assigned (shouldn't happen)
        basePosition = WaveCalculator.calculateSineWavePosition(
          i,
          'M',  // Default to mid-frequency letter
          this.config.count,
          phase / (Math.PI * 2)
        );
      } else {
        // Legacy grid layout (for backwards compatibility)
        const gridPos = WaveCalculator.calculateGridPosition(
          i,
          this.config.gridSize!,
          this.config.spacing!
        );
        // Convert 2D grid to 3D position (flat on XZ plane)
        basePosition = new Vector3(gridPos.x, 0, gridPos.y);
      }

      // Create instance (shares geometry with baseMesh)
      const instance = this.baseMesh.createInstance(`bubble_${i}`);

      // Create letter label if in keyboard mode
      let labelMesh: Mesh | undefined;
      if (letter) {
        labelMesh = createLetterLabel(
          this.scene,
          instance,
          letter,
          getDefaultLabelConfig()
        );
      }

      // Store bubble data
      this.bubbles.push({
        instance,
        basePosition,
        index: i,
        phase,
        letter,
        labelMesh
      });
    }

    // Log letter assignment for debugging
    if (useArcLayout && this.config.count === 26) {
      console.log('Letter keyboard created:', this.bubbles.map(b => b.letter).join(''));
    }
  }

  /**
   * Update bubble positions based on wave mathematics
   * Call this every frame in render loop
   */
  update(): void {
    const currentTime = Date.now() / 1000 - this.startTime;
    const useArcLayout = this.config.arcRadius !== undefined;

    // Update each bubble position
    for (const bubble of this.bubbles) {
      let worldPos: Vector3;

      if (useArcLayout) {
        // Sine wave layout: Static wave pattern with individual breathing
        // Each letter breathes independently at its own pace

        // Start with base static position
        worldPos = bubble.basePosition.clone();

        // Add individual breathing motion for each letter
        // Each letter has its own phase so they don't all move together
        const breathingSpeed = 0.8; // Slow, calm breathing (~2 second cycle)
        const breathingPhase = currentTime * breathingSpeed + bubble.phase;
        const breathingAmount = Math.sin(breathingPhase) * 0.15; // 15cm forward/back motion

        // Apply breathing along Z axis (toward/away from user)
        worldPos.z += breathingAmount;
      } else {
        // Legacy grid layout: Use full wave + breathing animation
        const gridPos = new Vector2(bubble.basePosition.x, bubble.basePosition.z);
        worldPos = WaveCalculator.calculateBubblePosition(
          gridPos,
          currentTime,
          bubble.phase,
          this.waveSettings,
          this.breathingSettings
        );
      }

      // Apply position to instance
      bubble.instance.position = worldPos;
    }

    // Log first bubble position occasionally for debugging
    if (Math.floor(currentTime) % 5 === 0 && this.bubbles.length > 0) {
      const firstPos = this.bubbles[0].instance.position;
      if (firstPos) {
        console.log(`Bubble 0 position: (${firstPos.x.toFixed(2)}, ${firstPos.y.toFixed(2)}, ${firstPos.z.toFixed(2)})`);
      }
    }
  }

  /**
   * Update wave settings at runtime
   */
  setWaveSettings(settings: Partial<WaveSettings>): void {
    this.waveSettings = { ...this.waveSettings, ...settings };
  }

  /**
   * Update breathing settings at runtime
   */
  setBreathingSettings(settings: Partial<BreathingSettings>): void {
    this.breathingSettings = { ...this.breathingSettings, ...settings };
  }

  /**
   * Get bubble count
   */
  getBubbleCount(): number {
    return this.bubbles.length;
  }

  /**
   * Find nearest bubble to a world position
   * Useful for hand tracking interactions
   *
   * @param worldPos - Target position
   * @param maxDistance - Maximum search distance
   * @returns Nearest bubble data or null
   */
  findNearestBubble(worldPos: Vector3, maxDistance: number = Infinity): BubbleData | null {
    let nearestBubble: BubbleData | null = null;
    let nearestDistance = maxDistance;

    for (const bubble of this.bubbles) {
      const distance = Vector3.Distance(worldPos, bubble.instance.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestBubble = bubble;
      }
    }

    return nearestBubble;
  }

  /**
   * Find bubble by letter (for keyboard mode)
   *
   * @param letter - Letter to find (A-Z)
   * @returns Bubble data or null
   */
  findBubbleByLetter(letter: string): BubbleData | null {
    return this.bubbles.find(b => b.letter === letter.toUpperCase()) || null;
  }

  /**
   * Get all bubbles within radius of a position
   * Useful for area-of-effect interactions
   *
   * @param worldPos - Center position
   * @param radius - Search radius
   * @returns Array of bubble data
   */
  getBubblesInRadius(worldPos: Vector3, radius: number): BubbleData[] {
    const bubblesInRange: BubbleData[] = [];

    for (const bubble of this.bubbles) {
      const distance = Vector3.Distance(worldPos, bubble.instance.position);
      if (distance <= radius) {
        bubblesInRange.push(bubble);
      }
    }

    return bubblesInRange;
  }

  /**
   * Highlight a bubble (for selection/hover feedback)
   *
   * @param bubble - Bubble data to highlight
   * @param intensity - Glow intensity (1.0 = normal, 2.0 = double)
   */
  highlightBubble(bubble: BubbleData, intensity: number = 2.0): void {
    // Increase scale slightly
    bubble.instance.scaling.setAll(1.2);

    // Material glow is handled by the material itself
    // This is a placeholder for future visual feedback
  }

  /**
   * Reset bubble to normal appearance
   *
   * @param bubble - Bubble data to reset
   */
  resetBubble(bubble: BubbleData): void {
    bubble.instance.scaling.setAll(1.0);
  }

  /**
   * Dispose all bubbles and free memory
   */
  dispose(): void {
    // Dispose instances and labels
    for (const bubble of this.bubbles) {
      bubble.instance.dispose();
      if (bubble.labelMesh) {
        bubble.labelMesh.dispose();
      }
    }

    // Dispose base mesh
    this.baseMesh.dispose();

    this.bubbles = [];
    console.log("BubbleManager disposed");
  }

  /**
   * Get performance stats
   */
  getStats(): {
    bubbleCount: number;
    drawCalls: number;
    triangles: number;
  } {
    const triangles = this.baseMesh.getTotalVertices() / 3 * this.bubbles.length;

    return {
      bubbleCount: this.bubbles.length,
      drawCalls: 1, // All instances use 1 draw call!
      triangles
    };
  }
}

/**
 * Helper: Create letter keyboard configuration (26 bubbles on 3D wave)
 * This is the default for the VR text input system
 *
 * Layout design using unified 3D wave pattern:
 * - Width: 12.5m (±6.25m left/right) - 2.5x spacing for comfortable reach
 * - Height: 0.8m sine wave variation (vertical undulation)
 * - Depth: 1.2m cosine wave variation (depth undulation)
 *   - Range: 1.3m (close) to 3.7m (far)
 *   - Creates flowing 3D wave pattern, not random frequency zones
 * - Alphabetically organized left-to-right (A→Z)
 * - Individual breathing motion (each letter breathes independently)
 * - User positioned in center, letters flow in 3D wave around them
 */
export function createLetterKeyboardConfig(): BubbleConfig {
  return {
    count: 26,          // A-Z letters
    radius: 0.25,       // 25cm bubbles
    arcRadius: 1.8,     // Triggers sine wave mode (actual value calculated internally)
    arcAngle: 160,      // Not used for sine wave
    verticalAngle: -15  // Not used for sine wave
  };
}

/**
 * Helper: Create default bubble configuration (LEGACY)
 */
export function createDefaultBubbleConfig(): BubbleConfig {
  return {
    count: 49,        // 7x7 grid
    radius: 0.3,      // 30cm bubbles
    gridSize: 7,      // 7x7 grid
    spacing: 1.2      // 1.2m between bubbles
  };
}

/**
 * Helper: Create small demo configuration (for testing)
 */
export function createSmallBubbleConfig(): BubbleConfig {
  return {
    count: 9,         // 3x3 grid
    radius: 0.3,
    gridSize: 3,
    spacing: 1.5
  };
}

/**
 * Helper: Create large configuration (50+ bubbles)
 */
export function createLargeBubbleConfig(): BubbleConfig {
  return {
    count: 64,        // 8x8 grid
    radius: 0.25,     // Smaller bubbles
    gridSize: 8,
    spacing: 1.0      // Tighter spacing
  };
}
