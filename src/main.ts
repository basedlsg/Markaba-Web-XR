/**
 * main.ts
 *
 * Application entry point
 * Initializes scene, bubbles, and WebXR
 */

import { createScene, enableVROptimizations } from './scene/SceneSetup';
import { BubbleManager, createLetterKeyboardConfig } from './bubbles/BubbleManager';
import { XRSessionManager, checkWebXRSupport } from './xr/XRSession';
import { HandTrackingManager } from './xr/HandTracking';
import { DebugUI, setupDebugShortcuts } from './ui/DebugUI';
import { TextDisplayManager } from './ui/TextDisplay';
import { LetterAudioManager } from './audio/LetterAudio';
import { WebXRState } from '@babylonjs/core';

/**
 * Application state
 */
class App {
  private bubbleManager!: BubbleManager;
  private xrManager!: XRSessionManager;
  private handTracking: HandTrackingManager | null = null;
  private debugUI!: DebugUI;
  private textDisplay!: TextDisplayManager;
  private audioManager!: LetterAudioManager;

  // Hand proximity tracking
  private lastNearBubbleLeft: any = null;
  private lastNearBubbleRight: any = null;
  private readonly PROXIMITY_DISTANCE = 0.15; // 15cm threshold

  // Debounce to prevent duplicate letter entries
  private lastSelectedTime: number = 0;
  private readonly SELECTION_DEBOUNCE = 500; // 500ms between selections

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

      // Create bubbles (26-letter keyboard arc layout)
      console.log("Creating letter keyboard bubbles...");
      const bubbleConfig = createLetterKeyboardConfig();
      this.bubbleManager = new BubbleManager(scene, bubbleConfig);

      // Initialize text display
      console.log("Creating text display...");
      this.textDisplay = new TextDisplayManager(scene);

      // Initialize audio system
      console.log("Initializing audio system...");
      this.audioManager = new LetterAudioManager();

      // Setup click interaction for desktop testing
      this.setupClickInteraction(scene);

      // Initialize WebXR (optional - app works without it)
      console.log("Initializing WebXR...");
      this.xrManager = new XRSessionManager(scene);
      let xrSupported = false;

      try {
        xrSupported = await this.xrManager.initialize();
        console.log("WebXR initialization result:", xrSupported);
      } catch (error) {
        console.warn("WebXR initialization failed (continuing in desktop mode):", error);
        xrSupported = false;
      }

      // Setup Enter VR button
      this.setupVRButton(xrSupported);

      // Setup XR state change handler (only if XR is fully supported)
      if (xrSupported && this.xrManager.getExperience()) {
        try {
          this.xrManager.onStateChange((state) => {
            if (state === WebXRState.IN_XR) {
              this.onEnterVR();
            } else if (state === WebXRState.NOT_IN_XR) {
              this.onExitVR();
            }
          });
          console.log("XR state change handler registered");
        } catch (error) {
          console.warn("Could not register XR state change handler:", error);
        }
      } else {
        console.log("Running in desktop mode (WebXR not available)");
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
   * Setup click interaction for desktop testing
   * Click on bubbles to hear their sounds
   */
  private setupClickInteraction(scene: any): void {
    scene.onPointerDown = (evt: PointerEvent, pickResult: any) => {
      if (pickResult.hit && pickResult.pickedMesh) {
        // Find which bubble was clicked
        const clickedInstance = pickResult.pickedMesh;

        // Search through bubbles to find the one that was clicked
        for (let i = 0; i < this.bubbleManager.getBubbleCount(); i++) {
          const bubble = this.bubbleManager['bubbles'][i];
          if (bubble.instance === clickedInstance && bubble.letter) {
            console.log(`Clicked letter: ${bubble.letter}`);

            // Add letter to text display
            this.textDisplay.addLetter(bubble.letter);

            // Play the letter's sound
            this.audioManager.playLetterTone(bubble.letter);

            // Visual feedback
            this.bubbleManager.highlightBubble(bubble);
            setTimeout(() => this.bubbleManager.resetBubble(bubble), 200);

            break;
          }
        }
      }
    };
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

      // Update hand tracking and proximity selection
      if (this.handTracking && this.xrManager.isInVR()) {
        this.handTracking.update();

        // Check both hands for proximity to bubbles
        this.checkHandProximity('left');
        this.checkHandProximity('right');
      }

      // Update debug UI
      const stats = this.bubbleManager.getStats();
      this.debugUI.update(stats.bubbleCount, stats.drawCalls);
    });
  }

  /**
   * Check if a hand is near any bubble and trigger feedback
   *
   * @param handType - 'left' or 'right'
   */
  private checkHandProximity(handType: 'left' | 'right'): void {
    if (!this.handTracking) return;

    // Get hand position
    const hand = handType === 'left' ?
      this.handTracking.getLeftHand() :
      this.handTracking.getRightHand();

    if (!hand || !hand.indexTipPosition) return;

    const handPos = hand.indexTipPosition;

    // Find nearest bubble within threshold
    const nearestBubble = this.bubbleManager.findNearestBubble(
      handPos,
      this.PROXIMITY_DISTANCE
    );

    // Track last near bubble for this hand
    const lastNearBubble = handType === 'left' ?
      this.lastNearBubbleLeft :
      this.lastNearBubbleRight;

    // If we're near a new bubble (or moved away from previous)
    if (nearestBubble !== lastNearBubble) {
      // Reset previous bubble
      if (lastNearBubble) {
        this.bubbleManager.resetBubble(lastNearBubble);
      }

      // Activate new bubble
      if (nearestBubble && nearestBubble.letter) {
        console.log(`${handType} hand near letter: ${nearestBubble.letter}`);

        // Check debounce - only add letter if enough time has passed
        const now = Date.now();
        if (now - this.lastSelectedTime > this.SELECTION_DEBOUNCE) {
          // Add letter to text display
          this.textDisplay.addLetter(nearestBubble.letter);
          this.lastSelectedTime = now;
        }

        // Visual feedback (always show, even if debounced)
        this.bubbleManager.highlightBubble(nearestBubble, 1.5);

        // Audio feedback (always play, even if debounced)
        this.audioManager.playLetterTone(nearestBubble.letter);
      }

      // Update tracking
      if (handType === 'left') {
        this.lastNearBubbleLeft = nearestBubble;
      } else {
        this.lastNearBubbleRight = nearestBubble;
      }
    }
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
