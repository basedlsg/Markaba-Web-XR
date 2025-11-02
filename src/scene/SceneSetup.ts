/**
 * SceneSetup.ts
 *
 * Babylon.js scene initialization
 * Creates engine, scene, camera, and lighting
 */

import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Color3,
  Color4
} from '@babylonjs/core';

/**
 * Initialize Babylon.js engine and scene
 *
 * @param canvas - HTML canvas element
 * @returns Initialized scene
 */
export function createScene(canvas: HTMLCanvasElement): Scene {
  // Create engine with WebGL2 + antialiasing
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  // Create scene
  const scene = new Scene(engine);

  // Background (dark gradient for contrast with glass bubbles)
  scene.clearColor = new Color4(0.05, 0.05, 0.1, 1.0);

  // Enable fog for depth perception
  scene.fogMode = Scene.FOGMODE_LINEAR;
  scene.fogColor = new Color3(0.05, 0.05, 0.1);
  scene.fogStart = 10.0;
  scene.fogEnd = 50.0;

  // Setup camera
  const camera = createCamera(scene, canvas);

  // Setup lighting (important for glass material)
  createLighting(scene);

  // Optimize for VR performance
  optimizeScene(scene, engine);

  // Start render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    engine.resize();
  });

  return scene;
}

/**
 * Create and configure camera
 *
 * @param scene - Babylon.js scene
 * @param canvas - Canvas for input controls
 * @returns Configured camera
 */
function createCamera(scene: Scene, canvas: HTMLCanvasElement): ArcRotateCamera {
  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,    // Alpha (horizontal rotation)
    Math.PI / 3,    // Beta (vertical rotation)
    8,              // Radius (distance from target)
    Vector3.Zero(), // Target position
    scene
  );

  // Camera limits
  camera.lowerRadiusLimit = 3;
  camera.upperRadiusLimit = 20;
  camera.lowerBetaLimit = 0.1;
  camera.upperBetaLimit = Math.PI / 2;

  // Camera speed
  camera.wheelPrecision = 50;
  camera.panningSensibility = 100;

  // Attach controls to canvas
  camera.attachControl(canvas, true);

  // Smooth camera movement
  camera.inertia = 0.9;
  camera.angularSensibilityX = 1000;
  camera.angularSensibilityY = 1000;

  return camera;
}

/**
 * Create scene lighting
 * Critical for glass material appearance
 *
 * @param scene - Babylon.js scene
 */
function createLighting(scene: Scene): void {
  // Main hemispheric light (ambient + directional)
  const hemiLight = new HemisphericLight(
    "hemiLight",
    new Vector3(0, 1, 0),
    scene
  );
  hemiLight.intensity = 0.7;
  hemiLight.diffuse = new Color3(1, 1, 1);
  hemiLight.specular = new Color3(1, 1, 1);
  hemiLight.groundColor = new Color3(0.2, 0.2, 0.3);

  // Optional: Add directional light for better glass reflections
  // Commented out for performance, enable if needed
  /*
  const dirLight = new DirectionalLight(
    "dirLight",
    new Vector3(-1, -2, -1),
    scene
  );
  dirLight.intensity = 0.5;
  dirLight.position = new Vector3(10, 10, 10);
  */
}

/**
 * Optimize scene for VR performance
 *
 * @param scene - Babylon.js scene
 * @param engine - Babylon.js engine
 */
function optimizeScene(scene: Scene, engine: Engine): void {
  // Hardware scaling (reduce resolution for better FPS)
  // 1.0 = native resolution, 0.8 = 80% resolution
  engine.setHardwareScalingLevel(1.0); // Start at full quality

  // Disable features not needed for this demo
  scene.autoClear = false; // Don't auto-clear color/depth
  scene.autoClearDepthAndStencil = false;

  // Block material dirty mechanism (performance)
  scene.blockMaterialDirtyMechanism = true;

  // Optimize mesh rendering
  scene.skipFrustumClipping = false;
}

/**
 * Get engine FPS for performance monitoring
 *
 * @param scene - Babylon.js scene
 * @returns Current FPS
 */
export function getFPS(scene: Scene): number {
  return scene.getEngine().getFps();
}

/**
 * Adjust rendering quality dynamically
 * Call this if FPS drops below target
 *
 * @param scene - Babylon.js scene
 * @param targetFPS - Desired FPS (72 for Quest 3)
 */
export function adjustQuality(scene: Scene, targetFPS: number = 72): void {
  const engine = scene.getEngine();
  const currentFPS = engine.getFps();

  if (currentFPS < targetFPS) {
    // Reduce quality
    const currentScale = engine.getHardwareScalingLevel();
    engine.setHardwareScalingLevel(Math.min(currentScale + 0.1, 2.0));
    console.log(`FPS: ${currentFPS.toFixed(0)} - Reducing quality to ${(1/engine.getHardwareScalingLevel()*100).toFixed(0)}%`);
  } else if (currentFPS > targetFPS + 10 && engine.getHardwareScalingLevel() > 1.0) {
    // Increase quality if we have FPS to spare
    const currentScale = engine.getHardwareScalingLevel();
    engine.setHardwareScalingLevel(Math.max(currentScale - 0.1, 1.0));
    console.log(`FPS: ${currentFPS.toFixed(0)} - Increasing quality to ${(1/engine.getHardwareScalingLevel()*100).toFixed(0)}%`);
  }
}

/**
 * Enable VR-specific optimizations
 *
 * @param scene - Babylon.js scene
 */
export function enableVROptimizations(scene: Scene): void {
  const engine = scene.getEngine();

  // Reduce hardware scaling for VR (dual eye rendering is expensive)
  engine.setHardwareScalingLevel(1.2); // 83% resolution

  // Disable some effects for performance
  scene.fogEnabled = false; // Fog is expensive in VR

  console.log("VR optimizations enabled");
}

/**
 * Create simple grid for spatial reference
 * Helpful for debugging but disable in production
 *
 * @param scene - Babylon.js scene
 */
export function createDebugGrid(scene: Scene): void {
  // Commented out - uncomment for debugging
  /*
  const { GridMaterial } = await import('@babylonjs/materials');
  const ground = MeshBuilder.CreateGround("ground", {
    width: 20,
    height: 20
  }, scene);

  const gridMaterial = new GridMaterial("gridMaterial", scene);
  gridMaterial.majorUnitFrequency = 1;
  gridMaterial.minorUnitVisibility = 0.5;
  gridMaterial.gridRatio = 1;
  gridMaterial.backFaceCulling = false;
  gridMaterial.mainColor = new Color3(1, 1, 1);
  gridMaterial.lineColor = new Color3(0.5, 0.5, 0.5);
  gridMaterial.opacity = 0.3;

  ground.material = gridMaterial;
  ground.position.y = -2;
  */
}
