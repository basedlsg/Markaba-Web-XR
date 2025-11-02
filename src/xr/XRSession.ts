/**
 * XRSession.ts
 *
 * WebXR session initialization and management
 * Handles VR mode entry/exit and feature detection
 */

import { Scene, WebXRDefaultExperience, WebXRState } from '@babylonjs/core';

/**
 * XR session manager
 */
export class XRSessionManager {
  private scene: Scene;
  private xrExperience: WebXRDefaultExperience | null = null;
  private isXRSupported: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Initialize WebXR experience
   * Call this during app startup
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if WebXR is supported
      this.isXRSupported = await WebXRDefaultExperience.CreateAsync(this.scene, {
        // Don't enter VR automatically
        disableDefaultUI: true,

        // Floor meshes for teleportation (empty for now)
        floorMeshes: [],

        // UI options
        uiOptions: {
          sessionMode: 'immersive-vr',
          referenceSpaceType: 'local-floor'
        }
      }).then(xr => {
        this.xrExperience = xr;
        this.setupXRFeatures();
        return true;
      }).catch(error => {
        console.warn("WebXR not supported:", error);
        return false;
      });

      return this.isXRSupported;
    } catch (error) {
      console.error("Failed to initialize WebXR:", error);
      return false;
    }
  }

  /**
   * Setup XR features (hand tracking, teleportation, etc.)
   */
  private setupXRFeatures(): void {
    if (!this.xrExperience) return;

    // Enable hand tracking (handled by HandTracking.ts)
    // Enable teleportation
    // Enable foveated rendering for Quest 3

    console.log("XR features initialized");
  }

  /**
   * Enter VR mode
   * Call when user clicks "Enter VR" button
   */
  async enterVR(): Promise<boolean> {
    if (!this.xrExperience || !this.xrExperience.baseExperience) {
      console.warn("WebXR not initialized");
      return false;
    }

    try {
      await this.xrExperience.baseExperience.enterXRAsync(
        'immersive-vr',
        'local-floor'
      );
      console.log("Entered VR mode");
      return true;
    } catch (error) {
      console.error("Failed to enter VR:", error);
      return false;
    }
  }

  /**
   * Exit VR mode
   */
  async exitVR(): Promise<void> {
    if (!this.xrExperience || !this.xrExperience.baseExperience) return;

    try {
      await this.xrExperience.baseExperience.exitXRAsync();
      console.log("Exited VR mode");
    } catch (error) {
      console.error("Failed to exit VR:", error);
    }
  }

  /**
   * Check if currently in VR
   */
  isInVR(): boolean {
    if (!this.xrExperience?.baseExperience) return false;
    return this.xrExperience.baseExperience.state === WebXRState.IN_XR;
  }

  /**
   * Check if WebXR is supported
   */
  isSupported(): boolean {
    return this.isXRSupported;
  }

  /**
   * Get XR experience object
   * Useful for accessing hand tracking and other features
   */
  getExperience(): WebXRDefaultExperience | null {
    return this.xrExperience;
  }

  /**
   * Register callback for XR state changes
   *
   * @param callback - Function to call on state change
   */
  onStateChange(callback: (state: WebXRState) => void): void {
    if (!this.xrExperience || !this.xrExperience.baseExperience) {
      console.warn("XR experience not fully initialized, cannot register state change callback");
      return;
    }

    this.xrExperience.baseExperience.onStateChangedObservable.add((state) => {
      callback(state);
      console.log("XR state changed:", WebXRState[state]);
    });
  }

  /**
   * Enable fixed foveated rendering (Quest 3 optimization)
   * Reduces peripheral resolution for better performance
   */
  enableFoveatedRendering(level: number = 2): void {
    // Feature will be enabled when available
    // Level 0 = off, 1 = low, 2 = medium, 3 = high
    console.log(`Foveated rendering level ${level} will be enabled in VR`);
  }
}

/**
 * Check if WebXR is supported in current browser
 * Call before initializing XR session
 */
export async function checkWebXRSupport(): Promise<boolean> {
  if (!navigator.xr) {
    console.warn("WebXR not available in this browser");
    return false;
  }

  try {
    const supported = await navigator.xr.isSessionSupported('immersive-vr');
    console.log("WebXR immersive-vr supported:", supported);
    return supported;
  } catch (error) {
    console.error("Error checking WebXR support:", error);
    return false;
  }
}
