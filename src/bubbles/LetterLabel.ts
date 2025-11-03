/**
 * LetterLabel.ts
 *
 * Creates 3D text labels for letter bubbles
 * Uses Babylon.js GUI for rendering text in 3D space
 */

import { Scene, TransformNode, Vector3, Mesh, InstancedMesh, AbstractMesh } from '@babylonjs/core';
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';

/**
 * Label configuration
 */
export interface LabelConfig {
  fontSize: number;       // Font size in pixels
  fontFamily: string;     // Font family (e.g., "Arial", "Helvetica")
  color: string;          // Text color (CSS format)
  backgroundColor?: string; // Optional background color
  resolution: number;     // Texture resolution (higher = sharper, more memory)
}

/**
 * Create a 3D text label attached to a mesh
 * Uses a plane mesh with GUI texture
 *
 * @param scene - Babylon.js scene
 * @param parent - Parent mesh (the bubble)
 * @param letter - Letter to display
 * @param config - Label configuration
 * @returns The plane mesh with text
 */
export function createLetterLabel(
  scene: Scene,
  parent: AbstractMesh,
  letter: string,
  config: Partial<LabelConfig> = {}
): Mesh {
  // Default configuration
  const finalConfig: LabelConfig = {
    fontSize: 200,
    fontFamily: 'Arial',
    color: 'white',
    backgroundColor: undefined,
    resolution: 512,
    ...config
  };

  // Create a plane for the text (billboarded to always face camera)
  const plane = Mesh.CreatePlane(`label_${letter}`, 0.4, scene);
  plane.parent = parent;
  plane.position = Vector3.Zero(); // Center of the bubble
  plane.billboardMode = Mesh.BILLBOARDMODE_ALL; // Always face camera

  // Create GUI texture for the plane
  const advancedTexture = AdvancedDynamicTexture.CreateForMesh(
    plane,
    finalConfig.resolution,
    finalConfig.resolution,
    true // generateMipMaps
  );

  // Create text block
  const textBlock = new TextBlock();
  textBlock.text = letter;
  textBlock.color = finalConfig.color;
  textBlock.fontSize = finalConfig.fontSize;
  textBlock.fontFamily = finalConfig.fontFamily;
  textBlock.fontWeight = 'bold';

  // Optional background
  if (finalConfig.backgroundColor) {
    advancedTexture.background = finalConfig.backgroundColor;
  }

  // Add text to texture
  advancedTexture.addControl(textBlock);

  return plane;
}

/**
 * Update label text (for dynamic content)
 *
 * @param labelMesh - The label plane mesh
 * @param newText - New text to display
 */
export function updateLabelText(labelMesh: Mesh, newText: string): void {
  // Get the GUI texture from the mesh
  const material = labelMesh.material;
  if (!material) return;

  const textures = material.getActiveTextures();
  if (textures.length === 0) return;

  const texture = textures[0] as AdvancedDynamicTexture;
  if (texture && texture.rootContainer) {
    // Find the first TextBlock in the root container
    const controls = texture.rootContainer.children;
    for (const control of controls) {
      if (control instanceof TextBlock) {
        control.text = newText;
        break;
      }
    }
  }
}

/**
 * Default configuration for letter labels
 */
export function getDefaultLabelConfig(): LabelConfig {
  return {
    fontSize: 200,
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: 'rgba(255, 255, 255, 0.95)', // Slightly transparent white
    backgroundColor: undefined, // Transparent background
    resolution: 512
  };
}
