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
   * Create bubble instances in arc layout (for letter keyboard)
   */
  private createBubbles(): void {
    // Use arc layout if arcRadius is set, otherwise legacy grid
    const useArcLayout = this.config.arcRadius !== undefined;

    for (let i = 0; i < this.config.count; i++) {
      let basePosition: Vector3;

      if (useArcLayout) {
        // Calculate arc position for letter keyboard
        basePosition = WaveCalculator.calculateArcPosition(
          i,
          this.config.count,
          this.config.arcRadius,
          this.config.arcAngle,
          this.config.verticalAngle
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

      // Generate random phase for breathing animation
      const phase = WaveCalculator.generateRandomPhase();

      // Create instance (shares geometry with baseMesh)
      const instance = this.baseMesh.createInstance(`bubble_${i}`);

      // Store bubble data
      this.bubbles.push({
        instance,
        basePosition,
        index: i,
        phase
      });
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
        // Arc layout: Apply depth wave to create back-and-forth motion
        worldPos = WaveCalculator.applyDepthWave(
          bubble.basePosition,
          bubble.index,
          currentTime,
          0.15,  // waveAmplitude - 15cm forward/backward
          2.0    // waveFrequency
        );
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
   * @returns Nearest bubble instance or null
   */
  findNearestBubble(worldPos: Vector3, maxDistance: number = Infinity): InstancedMesh | null {
    let nearestBubble: InstancedMesh | null = null;
    let nearestDistance = maxDistance;

    for (const bubble of this.bubbles) {
      const distance = Vector3.Distance(worldPos, bubble.instance.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestBubble = bubble.instance;
      }
    }

    return nearestBubble;
  }

  /**
   * Get all bubbles within radius of a position
   * Useful for area-of-effect interactions
   *
   * @param worldPos - Center position
   * @param radius - Search radius
   * @returns Array of bubble instances
   */
  getBubblesInRadius(worldPos: Vector3, radius: number): InstancedMesh[] {
    const bubblesInRange: InstancedMesh[] = [];

    for (const bubble of this.bubbles) {
      const distance = Vector3.Distance(worldPos, bubble.instance.position);
      if (distance <= radius) {
        bubblesInRange.push(bubble.instance);
      }
    }

    return bubblesInRange;
  }

  /**
   * Highlight a bubble (for selection/hover feedback)
   *
   * @param bubble - Bubble instance to highlight
   * @param intensity - Glow intensity (1.0 = normal, 2.0 = double)
   */
  highlightBubble(bubble: InstancedMesh, intensity: number = 2.0): void {
    // Increase scale slightly
    bubble.scaling.setAll(1.2);

    // Material glow is handled by the material itself
    // This is a placeholder for future visual feedback
  }

  /**
   * Reset bubble to normal appearance
   *
   * @param bubble - Bubble instance to reset
   */
  resetBubble(bubble: InstancedMesh): void {
    bubble.scaling.setAll(1.0);
  }

  /**
   * Dispose all bubbles and free memory
   */
  dispose(): void {
    // Dispose instances
    for (const bubble of this.bubbles) {
      bubble.instance.dispose();
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
 * Helper: Create letter keyboard configuration (26 bubbles in arc)
 * This is the default for the VR text input system
 */
export function createLetterKeyboardConfig(): BubbleConfig {
  return {
    count: 26,          // A-Z letters
    radius: 0.25,       // 25cm bubbles (smaller for letters)
    arcRadius: 1.2,     // 1.2m from user (arm's reach)
    arcAngle: 80,       // 80° horizontal arc (±40°)
    verticalAngle: -25  // 25° downward tilt (desk viewing angle)
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
