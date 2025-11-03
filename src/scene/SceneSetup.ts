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
  Color4,
  MeshBuilder,
  StandardMaterial
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

  // Background (lighter for better visibility during development)
  scene.clearColor = new Color4(0.1, 0.1, 0.15, 1.0);

  // Disable fog initially (enable later if needed)
  scene.fogEnabled = false;

  // Setup camera
  const camera = createCamera(scene, canvas);

  // Setup lighting (important for glass material)
  createLighting(scene);

  // Create environment for reflections
  createEnvironment(scene);

  // Add test sphere for debugging
  createTestSphere(scene);

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

  console.log(`Camera created: position=(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}), radius=${camera.radius}, target=(${camera.target.x}, ${camera.target.y}, ${camera.target.z})`);

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
  hemiLight.intensity = 1.0; // Increased from 0.7 for better visibility
  hemiLight.diffuse = new Color3(1, 1, 1);
  hemiLight.specular = new Color3(1, 1, 1);
  hemiLight.groundColor = new Color3(0.5, 0.5, 0.6); // Brighter ground color
}

/**
 * Create environment for better reflections
 */
function createEnvironment(scene: Scene): void {
  // Create a simple gradient skybox for reflections
  scene.createDefaultSkybox(
    undefined,
    true,
    10,
    0.3,
    false
  );
}

/**
 * Create a test sphere to verify rendering is working
 */
function createTestSphere(scene: Scene): void {
  // Create a bright red test sphere at origin
  const testSphere = MeshBuilder.CreateSphere("testSphere", {
    diameter: 1,
    segments: 16
  }, scene);

  // Position it at origin
  testSphere.position = new Vector3(0, 0, 0);

  // Create bright material
  const mat = new StandardMaterial("testMat", scene);
  mat.diffuseColor = new Color3(1, 0, 0); // Bright red
  mat.emissiveColor = new Color3(0.5, 0, 0); // Emissive red glow
  mat.specularColor = new Color3(1, 1, 1);
  testSphere.material = mat;

  console.log("Test sphere created at origin (0,0,0) - should be visible!");
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
