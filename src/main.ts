/**
 * main.ts
 *
 * Application entry point
 * Initializes scene, bubbles, and WebXR
 */

import { createScene, enableVROptimizations } from './scene/SceneSetup';
import { BubbleManager, createDefaultBubbleConfig } from './bubbles/BubbleManager';
import { XRSessionManager, checkWebXRSupport } from './xr/XRSession';
import { HandTrackingManager } from './xr/HandTracking';
import { DebugUI, setupDebugShortcuts } from './ui/DebugUI';
import { WebXRState } from '@babylonjs/core';

/**
 * Application state
 */
class App {
  private bubbleManager!: BubbleManager;
  private xrManager!: XRSessionManager;
  private handTracking: HandTrackingManager | null = null;
  private debugUI!: DebugUI;

  async initialize() {
    console.log("🚀 Initializing Markaba Web XR...");

    // Hide loading screen after initialization
    const loadingScreen = document.getElementById('loadingScreen');

    try {
      // Get canvas
      const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
      if (!canvas) {
        throw new Error("Canvas not found");
      }

      // Create scene
      console.log("Creating Babylon.js scene...");
      const scene = createScene(canvas);

      // Create debug UI
      this.debugUI = new DebugUI(scene);
      setupDebugShortcuts(this.debugUI);

      // Create bubbles
      console.log("Creating bubbles...");
      const bubbleConfig = createDefaultBubbleConfig();
      this.bubbleManager = new BubbleManager(scene, bubbleConfig);

      // Initialize WebXR
      console.log("Initializing WebXR...");
      this.xrManager = new XRSessionManager(scene);
      const xrSupported = await this.xrManager.initialize();

      // Setup Enter VR button
      this.setupVRButton(xrSupported);

      // Setup XR state change handler
      if (xrSupported) {
        this.xrManager.onStateChange((state) => {
          if (state === WebXRState.IN_XR) {
            this.onEnterVR();
          } else if (state === WebXRState.NOT_IN_XR) {
            this.onExitVR();
          }
        });
      }

      // Start render loop
      this.startRenderLoop(scene);

      // Hide loading screen
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => loadingScreen.remove(), 500);
      }

      console.log("✅ Markaba Web XR initialized successfully!");

    } catch (error) {
      console.error("❌ Failed to initialize:", error);
      if (loadingScreen) {
        loadingScreen.innerHTML = `
          <div style="color: #ff6b6b;">
            <h1>Error</h1>
            <p>${error}</p>
            <p>Please refresh the page and try again.</p>
          </div>
        `;
      }
    }
  }

  /**
   * Setup Enter VR button
   */
  private setupVRButton(xrSupported: boolean): void {
    const enterVRButton = document.getElementById('enterVR');
    if (!enterVRButton) return;

    const button = enterVRButton as HTMLButtonElement;

    if (xrSupported) {
      button.style.display = 'block';
      button.disabled = false;
      button.textContent = 'Enter VR';

      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = 'Entering VR...';

        const success = await this.xrManager.enterVR();
        if (!success) {
          button.disabled = false;
          button.textContent = 'Enter VR (Failed - Retry)';
        }
      });
    } else {
      button.style.display = 'block';
      button.disabled = true;
      button.textContent = 'WebXR Not Supported';
      button.style.background = 'rgba(255, 107, 107, 0.9)';
    }
  }

  /**
   * Called when entering VR
   */
  private onEnterVR(): void {
    console.log("🥽 Entered VR mode");

    // Hide info panel in VR
    const infoPanel = document.getElementById('info');
    if (infoPanel) infoPanel.style.display = 'none';

    // Hide Enter VR button
    const enterVRButton = document.getElementById('enterVR');
    if (enterVRButton) enterVRButton.style.display = 'none';

    // Enable VR optimizations
    const scene = this.bubbleManager['scene'];
    enableVROptimizations(scene);

    // Enable hand tracking
    const xrExperience = this.xrManager.getExperience();
    if (xrExperience) {
      this.handTracking = new HandTrackingManager(xrExperience);
      this.handTracking.enable();
    }
  }

  /**
   * Called when exiting VR
   */
  private onExitVR(): void {
    console.log("👓 Exited VR mode");

    // Show info panel
    const infoPanel = document.getElementById('info');
    if (infoPanel) infoPanel.style.display = 'block';

    // Show Enter VR button
    const enterVRButton = document.getElementById('enterVR');
    if (enterVRButton) {
      const button = enterVRButton as HTMLButtonElement;
      button.style.display = 'block';
      button.disabled = false;
      button.textContent = 'Enter VR';
    }

    // Disable hand tracking
    if (this.handTracking) {
      this.handTracking.disable();
      this.handTracking = null;
    }
  }

  /**
   * Main render loop
   */
  private startRenderLoop(scene: any): void {
    scene.registerBeforeRender(() => {
      // Update bubbles with wave mathematics
      this.bubbleManager.update();

      // Update hand tracking
      if (this.handTracking && this.xrManager.isInVR()) {
        this.handTracking.update();

        // TODO: Implement pinch-to-grab interaction
        // Example: Check if hand is pinching near a bubble
        /*
        const leftHand = this.handTracking.getLeftHand();
        if (leftHand?.isPinching) {
          const pinchPos = this.handTracking.getPinchPosition('left');
          if (pinchPos) {
            const nearestBubble = this.bubbleManager.findNearestBubble(pinchPos, 0.2);
            if (nearestBubble) {
              this.bubbleManager.highlightBubble(nearestBubble);
            }
          }
        }
        */
      }

      // Update debug UI
      const stats = this.bubbleManager.getStats();
      this.debugUI.update(stats.bubbleCount, stats.drawCalls);
    });
  }
}

/**
 * Application entry point
 */
async function main() {
  console.log(`
  ╔════════════════════════════════════════╗
  ║     MARKABA WEB XR - v1.0.0           ║
  ║  Wave-Based Bubble Interactions       ║
  ╚════════════════════════════════════════╝
  `);

  // Check WebXR support
  const webxrSupported = await checkWebXRSupport();
  if (!webxrSupported) {
    console.warn("⚠️  WebXR not supported - Desktop mode only");
  }

  // Initialize app
  const app = new App();
  await app.initialize();
}

// Start the application
main().catch(error => {
  console.error("Fatal error:", error);
});
