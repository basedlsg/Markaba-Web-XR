/**
 * GlassMaterial.ts
 *
 * Glass bubble material using Babylon.js PBR
 * Replaces Unity's 203-line custom shader with 20 lines of PBR config
 *
 * Original Unity shader: BubbleGlass.shader (203 lines HLSL)
 * WebXR version: This file (20 lines using Babylon.js built-in PBR)
 *
 * Key features:
 * - Physical-based rendering for realistic glass
 * - Refraction with proper IOR (Index of Refraction)
 * - Fresnel rim lighting
 * - Neon-pastel color tint
 */

import { PBRMaterial, Scene, Color3, CubeTexture, Texture } from '@babylonjs/core';

/**
 * Configuration for glass appearance
 */
export interface GlassMaterialConfig {
  alpha: number;              // Transparency (0-1)
  roughness: number;          // Surface roughness (0 = mirror, 1 = matte)
  metallic: number;           // Metallic property (0 for glass)
  indexOfRefraction: number;  // IOR (1.52 for real glass)
  refractionIntensity: number; // Refraction strength
  tintColor: Color3;          // Base color tint
  environmentIntensity: number; // Reflection brightness
}

/**
 * Create glass material for bubbles
 *
 * Uses Babylon.js PBR (Physically Based Rendering) material
 * Much simpler than Unity's custom shader approach
 *
 * @param scene - Babylon.js scene
 * @param config - Optional material configuration
 * @returns Configured PBR material
 */
export function createGlassMaterial(
  scene: Scene,
  config?: Partial<GlassMaterialConfig>
): PBRMaterial {
  const glass = new PBRMaterial("bubbleGlass", scene);

  // Default configuration (matches Unity shader aesthetic)
  const finalConfig: GlassMaterialConfig = {
    alpha: 0.3,
    roughness: 0.05,
    metallic: 0.0,
    indexOfRefraction: 1.52,
    refractionIntensity: 0.8,
    tintColor: new Color3(0.8, 0.9, 1.0), // Soft blue-white tint
    environmentIntensity: 1.2,
    ...config
  };

  // Transparency
  glass.alpha = finalConfig.alpha;
  glass.transparencyMode = PBRMaterial.MATERIAL_ALPHABLEND;

  // Surface properties
  glass.metallic = finalConfig.metallic;
  glass.roughness = finalConfig.roughness;

  // Refraction (light bending through glass)
  glass.indexOfRefraction = finalConfig.indexOfRefraction;
  glass.subSurface.isRefractionEnabled = true;
  glass.subSurface.refractionIntensity = finalConfig.refractionIntensity;
  glass.subSurface.tintColor = finalConfig.tintColor;

  // Base color (neon-pastel tint)
  glass.albedoColor = finalConfig.tintColor;

  // Environment reflections (Fresnel rim lighting)
  glass.environmentIntensity = finalConfig.environmentIntensity;
  glass.usePhysicalLightFalloff = true;

  // Enable backface culling for performance
  glass.backFaceCulling = true;

  return glass;
}

/**
 * Create environment map for reflections
 *
 * Provides realistic reflections on glass surfaces
 * Can use procedural skybox or HDR environment
 *
 * @param scene - Babylon.js scene
 * @param useHDR - Use HDR environment (better quality, larger file)
 * @returns Environment texture
 */
export function createEnvironmentTexture(
  scene: Scene,
  useHDR: boolean = false
): CubeTexture | null {
  if (useHDR) {
    // HDR environment (requires .env file)
    // Download from: https://www.babylonjs.com/assets/environment/environmentSpecular.env
    try {
      const hdrTexture = CubeTexture.CreateFromPrefilteredData(
        "/assets/environment.env",
        scene
      );
      scene.environmentTexture = hdrTexture;
      return hdrTexture;
    } catch (error) {
      console.warn("HDR environment not found, using procedural skybox");
    }
  }

  // Procedural environment (no external files needed)
  // Creates simple gradient skybox
  scene.createDefaultSkybox(
    undefined,
    true,
    (scene.activeCamera?.maxZ ?? 1000) / 2,
    0.3,
    false
  );

  return null;
}

/**
 * Preset material configurations
 */
export const GlassPresets = {
  /**
   * Default glass (balanced appearance)
   */
  default: {
    alpha: 0.3,
    roughness: 0.05,
    metallic: 0.0,
    indexOfRefraction: 1.52,
    refractionIntensity: 0.8,
    tintColor: new Color3(0.8, 0.9, 1.0),
    environmentIntensity: 1.2
  } as GlassMaterialConfig,

  /**
   * Crystal clear glass (minimal tint, maximum transparency)
   */
  crystal: {
    alpha: 0.2,
    roughness: 0.01,
    metallic: 0.0,
    indexOfRefraction: 1.52,
    refractionIntensity: 1.0,
    tintColor: new Color3(0.95, 0.95, 1.0),
    environmentIntensity: 1.5
  } as GlassMaterialConfig,

  /**
   * Frosted glass (higher roughness, less refraction)
   */
  frosted: {
    alpha: 0.4,
    roughness: 0.3,
    metallic: 0.0,
    indexOfRefraction: 1.52,
    refractionIntensity: 0.4,
    tintColor: new Color3(0.9, 0.9, 0.95),
    environmentIntensity: 0.8
  } as GlassMaterialConfig,

  /**
   * Neon glass (vibrant color, high glow)
   */
  neon: {
    alpha: 0.35,
    roughness: 0.05,
    metallic: 0.0,
    indexOfRefraction: 1.52,
    refractionIntensity: 0.7,
    tintColor: new Color3(0.6, 0.8, 1.0),
    environmentIntensity: 2.0
  } as GlassMaterialConfig,

  /**
   * Rainbow glass (iridescent effect)
   * Note: Requires additional shader code for true iridescence
   */
  rainbow: {
    alpha: 0.25,
    roughness: 0.02,
    metallic: 0.0,
    indexOfRefraction: 1.52,
    refractionIntensity: 0.9,
    tintColor: new Color3(1.0, 0.8, 1.0),
    environmentIntensity: 1.8
  } as GlassMaterialConfig
};

/**
 * Update material color dynamically
 * Useful for selection highlighting or color-coding bubbles
 *
 * @param material - PBR material to update
 * @param color - New tint color
 * @param intensity - Color intensity (0-2)
 */
export function updateGlassColor(
  material: PBRMaterial,
  color: Color3,
  intensity: number = 1.0
): void {
  material.albedoColor = color;
  material.subSurface.tintColor = color;
  material.environmentIntensity = intensity;
}

/**
 * Animate glass material (pulsing glow effect)
 * Call in render loop for animated highlights
 *
 * @param material - PBR material to animate
 * @param time - Current time in seconds
 * @param frequency - Pulse frequency (Hz)
 * @param minIntensity - Minimum environment intensity
 * @param maxIntensity - Maximum environment intensity
 */
export function animateGlassPulse(
  material: PBRMaterial,
  time: number,
  frequency: number = 1.0,
  minIntensity: number = 1.0,
  maxIntensity: number = 2.0
): void {
  const pulse = Math.sin(time * frequency * Math.PI * 2) * 0.5 + 0.5;
  material.environmentIntensity = minIntensity + pulse * (maxIntensity - minIntensity);
}
