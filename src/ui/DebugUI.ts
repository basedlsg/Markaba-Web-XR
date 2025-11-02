/**
 * DebugUI.ts
 *
 * Performance monitoring and debug information overlay
 * Shows FPS, bubble count, and other stats
 */

import { Scene, Engine } from '@babylonjs/core';

/**
 * Debug UI manager
 */
export class DebugUI {
  private scene: Scene;
  private engine: Engine;
  private container: HTMLDivElement;
  private enabled: boolean = true;

  constructor(scene: Scene) {
    this.scene = scene;
    this.engine = scene.getEngine() as Engine;
    this.container = this.createContainer();
  }

  /**
   * Create debug UI container
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'debugUI';
    container.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.6;
      min-width: 200px;
      z-index: 1000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  /**
   * Update debug UI
   * Call this every frame in render loop
   *
   * @param bubbleCount - Number of active bubbles
   * @param drawCalls - Number of draw calls
   */
  update(bubbleCount: number = 0, drawCalls: number = 0): void {
    if (!this.enabled) return;

    const fps = this.engine.getFps().toFixed(0);
    const frameTime = (1000 / this.engine.getFps()).toFixed(1);
    const resolution = `${this.engine.getRenderWidth()}x${this.engine.getRenderHeight()}`;
    const scalingLevel = this.engine.getHardwareScalingLevel().toFixed(2);
    const activeParticles = this.scene.getActiveParticles();
    const activeMeshes = this.scene.getActiveMeshes().length;

    // Color-code FPS
    let fpsColor = '#00ff00'; // Green
    const fpsNum = parseFloat(fps);
    if (fpsNum < 72) fpsColor = '#ffff00'; // Yellow
    if (fpsNum < 60) fpsColor = '#ff8800'; // Orange
    if (fpsNum < 45) fpsColor = '#ff0000'; // Red

    this.container.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #00ddff;">
        MARKABA WEB XR - DEBUG
      </div>
      <div style="border-top: 1px solid #444; margin: 8px 0;"></div>
      <div><span style="color: #888;">FPS:</span> <span style="color: ${fpsColor}; font-weight: bold;">${fps}</span></div>
      <div><span style="color: #888;">Frame Time:</span> ${frameTime}ms</div>
      <div style="border-top: 1px solid #444; margin: 8px 0;"></div>
      <div><span style="color: #888;">Bubbles:</span> ${bubbleCount}</div>
      <div><span style="color: #888;">Draw Calls:</span> ${drawCalls}</div>
      <div><span style="color: #888;">Active Meshes:</span> ${activeMeshes}</div>
      <div><span style="color: #888;">Active Particles:</span> ${activeParticles}</div>
      <div style="border-top: 1px solid #444; margin: 8px 0;"></div>
      <div><span style="color: #888;">Resolution:</span> ${resolution}</div>
      <div><span style="color: #888;">HW Scaling:</span> ${scalingLevel}</div>
      <div style="border-top: 1px solid #444; margin: 8px 0;"></div>
      <div style="color: #666; font-size: 10px; margin-top: 8px;">
        Press 'D' to toggle debug UI
      </div>
    `;
  }

  /**
   * Toggle debug UI visibility
   */
  toggle(): void {
    this.enabled = !this.enabled;
    this.container.style.display = this.enabled ? 'block' : 'none';
  }

  /**
   * Show debug UI
   */
  show(): void {
    this.enabled = true;
    this.container.style.display = 'block';
  }

  /**
   * Hide debug UI
   */
  hide(): void {
    this.enabled = false;
    this.container.style.display = 'none';
  }

  /**
   * Remove debug UI
   */
  dispose(): void {
    this.container.remove();
  }
}

/**
 * Setup keyboard shortcuts for debugging
 *
 * @param debugUI - DebugUI instance
 */
export function setupDebugShortcuts(debugUI: DebugUI): void {
  window.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
      case 'd':
        debugUI.toggle();
        break;
    }
  });
}
