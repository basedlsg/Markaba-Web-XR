/**
 * TextDisplay.ts
 *
 * Display for typed letters in VR
 * Shows accumulated text as user selects letters
 */

import { Scene, Vector3, Mesh } from '@babylonjs/core';
import { AdvancedDynamicTexture, TextBlock, Rectangle, Control } from '@babylonjs/gui';

/**
 * Text display manager
 */
export class TextDisplayManager {
  private scene: Scene;
  private typedText: string = '';
  private displayMesh: Mesh | null = null;
  private textBlock: TextBlock | null = null;
  private maxCharacters: number = 50;

  // Display settings
  private readonly DISPLAY_WIDTH = 2.0;   // 2m wide
  private readonly DISPLAY_HEIGHT = 0.5;  // 0.5m tall
  private readonly FONT_SIZE = 60;
  private readonly TEXT_COLOR = 'white';
  private readonly BG_COLOR = 'rgba(0, 0, 0, 0.7)';
  private readonly POSITION = new Vector3(0, 1.5, -1.5); // Above and behind letters

  constructor(scene: Scene) {
    this.scene = scene;
    this.initialize();
  }

  /**
   * Initialize the text display
   */
  private initialize(): void {
    // Create a plane for the display
    this.displayMesh = Mesh.CreatePlane('textDisplay', this.DISPLAY_WIDTH, this.scene);
    this.displayMesh.position = this.POSITION;
    this.displayMesh.billboardMode = Mesh.BILLBOARDMODE_ALL; // Always face camera

    // Create GUI texture
    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(
      this.displayMesh,
      1024,
      256,
      false
    );

    // Create background rectangle
    const background = new Rectangle();
    background.width = 1;
    background.height = 1;
    background.background = this.BG_COLOR;
    background.cornerRadius = 10;
    advancedTexture.addControl(background);

    // Create text block
    this.textBlock = new TextBlock();
    this.textBlock.text = '';
    this.textBlock.color = this.TEXT_COLOR;
    this.textBlock.fontSize = this.FONT_SIZE;
    this.textBlock.fontFamily = 'monospace';
    this.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.textBlock.textWrapping = true;
    this.textBlock.paddingLeft = '20px';
    this.textBlock.paddingRight = '20px';

    advancedTexture.addControl(this.textBlock);

    console.log('TextDisplayManager initialized');
  }

  /**
   * Add a letter to the display
   *
   * @param letter - Letter to add
   */
  addLetter(letter: string): void {
    if (this.typedText.length >= this.maxCharacters) {
      console.warn('Maximum character limit reached');
      return;
    }

    this.typedText += letter;
    this.updateDisplay();
  }

  /**
   * Remove the last letter (backspace)
   */
  removeLetter(): void {
    if (this.typedText.length > 0) {
      this.typedText = this.typedText.slice(0, -1);
      this.updateDisplay();
    }
  }

  /**
   * Clear all text
   */
  clear(): void {
    this.typedText = '';
    this.updateDisplay();
  }

  /**
   * Update the display with current text
   */
  private updateDisplay(): void {
    if (this.textBlock) {
      // Add cursor at the end
      this.textBlock.text = this.typedText + '█';
    }
  }

  /**
   * Get current typed text
   */
  getText(): string {
    return this.typedText;
  }

  /**
   * Get word count
   */
  getWordCount(): number {
    const words = this.typedText.trim().split(/\s+/);
    return words[0] === '' ? 0 : words.length;
  }

  /**
   * Get character count
   */
  getCharacterCount(): number {
    return this.typedText.length;
  }

  /**
   * Set maximum character limit
   */
  setMaxCharacters(max: number): void {
    this.maxCharacters = max;
  }

  /**
   * Set display position
   */
  setPosition(position: Vector3): void {
    if (this.displayMesh) {
      this.displayMesh.position = position;
    }
  }

  /**
   * Show/hide display
   */
  setVisible(visible: boolean): void {
    if (this.displayMesh) {
      this.displayMesh.isVisible = visible;
    }
  }

  /**
   * Export typed text to clipboard (if in browser)
   */
  async exportToClipboard(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(this.typedText);
        console.log('Text copied to clipboard');
        return true;
      } catch (error) {
        console.warn('Could not copy to clipboard:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.displayMesh) {
      this.displayMesh.dispose();
      this.displayMesh = null;
    }
    this.textBlock = null;
    console.log('TextDisplayManager disposed');
  }
}

/**
 * Helper: Create text display with custom position
 */
export function createTextDisplay(scene: Scene, position?: Vector3): TextDisplayManager {
  const display = new TextDisplayManager(scene);
  if (position) {
    display.setPosition(position);
  }
  return display;
}
