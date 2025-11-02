/**
 * HandTracking.ts
 *
 * Hand tracking and gesture recognition for WebXR
 * Handles pinch-to-grab and hand proximity detection
 */

import {
  WebXRDefaultExperience,
  WebXRFeatureName,
  WebXRHandTracking,
  Vector3,
  AbstractMesh,
  WebXRHandJoint
} from '@babylonjs/core';

/**
 * Hand types
 */
export enum HandType {
  Left = 'left',
  Right = 'right'
}

/**
 * Gesture types
 */
export enum GestureType {
  None,
  Pinch,
  Point,
  Grab
}

/**
 * Hand tracking data
 */
export interface HandData {
  type: HandType;
  indexTipPosition: Vector3 | null;
  thumbTipPosition: Vector3 | null;
  palmPosition: Vector3 | null;
  pinchDistance: number;
  isPinching: boolean;
  gesture: GestureType;
}

/**
 * Hand tracking manager
 */
export class HandTrackingManager {
  private xrExperience: WebXRDefaultExperience;
  private handTracking: WebXRHandTracking | null = null;
  private leftHand: HandData | null = null;
  private rightHand: HandData | null = null;
  private pinchThreshold: number = 0.03; // 3cm for pinch detection

  constructor(xrExperience: WebXRDefaultExperience) {
    this.xrExperience = xrExperience;
  }

  /**
   * Enable hand tracking
   */
  enable(): boolean {
    try {
      // Check if hand tracking feature is available
      const featuresManager = this.xrExperience.baseExperience.featuresManager;

      if (!featuresManager) {
        console.warn("Features manager not available");
        return false;
      }

      // Enable hand tracking feature
      this.handTracking = featuresManager.enableFeature(
        WebXRFeatureName.HAND_TRACKING,
        'latest',
        { xrInput: this.xrExperience.input }
      ) as WebXRHandTracking;

      if (!this.handTracking) {
        console.warn("Hand tracking feature not available");
        return false;
      }

      // Setup event handlers
      this.setupHandTrackingEvents();

      console.log("Hand tracking enabled");
      return true;
    } catch (error) {
      console.error("Failed to enable hand tracking:", error);
      return false;
    }
  }

  /**
   * Setup hand tracking event handlers
   */
  private setupHandTrackingEvents(): void {
    if (!this.handTracking) return;

    // Hand added event
    this.handTracking.onHandAddedObservable.add((hand) => {
      const handType = hand.xrController.inputSource.handedness as HandType;
      console.log(`${handType} hand detected`);

      // Initialize hand data
      if (handType === HandType.Left) {
        this.leftHand = this.createHandData(HandType.Left);
      } else {
        this.rightHand = this.createHandData(HandType.Right);
      }
    });

    // Hand removed event
    this.handTracking.onHandRemovedObservable.add((hand) => {
      const handType = hand.xrController.inputSource.handedness as HandType;
      console.log(`${handType} hand lost`);

      if (handType === HandType.Left) {
        this.leftHand = null;
      } else {
        this.rightHand = null;
      }
    });
  }

  /**
   * Create empty hand data structure
   */
  private createHandData(type: HandType): HandData {
    return {
      type,
      indexTipPosition: null,
      thumbTipPosition: null,
      palmPosition: null,
      pinchDistance: 0,
      isPinching: false,
      gesture: GestureType.None
    };
  }

  /**
   * Update hand tracking data
   * Call this every frame in render loop
   */
  update(): void {
    if (!this.handTracking) return;

    // Update left hand
    if (this.leftHand) {
      this.updateHandData(this.leftHand, HandType.Left);
    }

    // Update right hand
    if (this.rightHand) {
      this.updateHandData(this.rightHand, HandType.Right);
    }
  }

  /**
   * Update individual hand data
   */
  private updateHandData(handData: HandData, handType: HandType): void {
    if (!this.handTracking) return;

    // Get hand from tracking system
    const hand = this.handTracking.getHandByHandedness(handType);
    if (!hand) return;

    // Get joint positions (index tip, thumb tip, palm)
    // Note: Joint names from WebXR Hand Input specification
    const indexTip = hand.getJointMesh(WebXRHandJoint.INDEX_FINGER_TIP);
    const thumbTip = hand.getJointMesh(WebXRHandJoint.THUMB_TIP);
    const palm = hand.getJointMesh(WebXRHandJoint.WRIST); // Approximate palm position

    if (indexTip) {
      handData.indexTipPosition = indexTip.position.clone();
    }

    if (thumbTip) {
      handData.thumbTipPosition = thumbTip.position.clone();
    }

    if (palm) {
      handData.palmPosition = palm.position.clone();
    }

    // Calculate pinch distance
    if (handData.indexTipPosition && handData.thumbTipPosition) {
      handData.pinchDistance = Vector3.Distance(
        handData.indexTipPosition,
        handData.thumbTipPosition
      );

      // Detect pinch gesture
      handData.isPinching = handData.pinchDistance < this.pinchThreshold;
      handData.gesture = handData.isPinching ? GestureType.Pinch : GestureType.None;
    }
  }

  /**
   * Get left hand data
   */
  getLeftHand(): HandData | null {
    return this.leftHand;
  }

  /**
   * Get right hand data
   */
  getRightHand(): HandData | null {
    return this.rightHand;
  }

  /**
   * Check if hand is pinching
   */
  isHandPinching(handType: HandType): boolean {
    const hand = handType === HandType.Left ? this.leftHand : this.rightHand;
    return hand?.isPinching ?? false;
  }

  /**
   * Get pinch position (midpoint between thumb and index)
   */
  getPinchPosition(handType: HandType): Vector3 | null {
    const hand = handType === HandType.Left ? this.leftHand : this.rightHand;
    if (!hand || !hand.isPinching || !hand.indexTipPosition || !hand.thumbTipPosition) {
      return null;
    }

    // Return midpoint
    return hand.indexTipPosition.add(hand.thumbTipPosition).scale(0.5);
  }

  /**
   * Check if hand is near a mesh
   *
   * @param handType - Which hand to check
   * @param mesh - Target mesh
   * @param maxDistance - Maximum distance for "near" detection
   * @returns True if hand is near mesh
   */
  isHandNearMesh(handType: HandType, mesh: AbstractMesh, maxDistance: number = 0.1): boolean {
    const hand = handType === HandType.Left ? this.leftHand : this.rightHand;
    if (!hand || !hand.indexTipPosition) return false;

    const distance = Vector3.Distance(hand.indexTipPosition, mesh.position);
    return distance < maxDistance;
  }

  /**
   * Find nearest mesh to hand
   *
   * @param handType - Which hand to check
   * @param meshes - Array of meshes to check
   * @returns Nearest mesh and distance, or null
   */
  findNearestMesh(
    handType: HandType,
    meshes: AbstractMesh[]
  ): { mesh: AbstractMesh; distance: number } | null {
    const hand = handType === HandType.Left ? this.leftHand : this.rightHand;
    if (!hand || !hand.indexTipPosition) return null;

    let nearestMesh: AbstractMesh | null = null;
    let nearestDistance = Infinity;

    for (const mesh of meshes) {
      const distance = Vector3.Distance(hand.indexTipPosition, mesh.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestMesh = mesh;
      }
    }

    return nearestMesh ? { mesh: nearestMesh, distance: nearestDistance } : null;
  }

  /**
   * Set pinch threshold
   *
   * @param threshold - Distance in meters (default: 0.03 = 3cm)
   */
  setPinchThreshold(threshold: number): void {
    this.pinchThreshold = threshold;
  }

  /**
   * Check if hand tracking is active
   */
  isActive(): boolean {
    return this.handTracking !== null;
  }

  /**
   * Disable hand tracking
   */
  disable(): void {
    // Hand tracking is automatically disabled when XR session ends
    this.leftHand = null;
    this.rightHand = null;
    console.log("Hand tracking disabled");
  }
}
