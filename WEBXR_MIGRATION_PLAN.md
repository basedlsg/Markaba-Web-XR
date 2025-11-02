# WebXR Migration Plan - XR Bubble Wave Library
## Comprehensive Implementation Guide for Claude Code Web

**Date**: November 2nd, 2025
**Prepared by**: Senior Architecture Committee
**Target Platform**: Claude Code Web → WebXR (Quest 3, Vision Pro, Desktop VR)
**Philosophy**: Pragmatic simplicity over architectural complexity

---

## Executive Summary

**The Problem**: Unity implementation reached 97,138 lines across 193 files with 16-assembly dependency hierarchy. Over-engineering prevented actual completion.

**The Solution**: Start fresh with WebXR, extracting only the 1,500 lines of portable wave mathematics. Target ~2,000 total lines.

**Core Innovation Worth Preserving**: Wave interference mathematics creating natural bubble movement patterns.

**Timeline**: 4 weeks from zero to deployed WebXR demo.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Setup in Claude Code Web](#project-setup)
3. [Architecture (Anti-Over-Engineering)](#architecture)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Code Migration Guide](#code-migration)
6. [Performance Targets](#performance-targets)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)

---

## Technology Stack

### Framework: Babylon.js 8.x ✅ RECOMMENDED

**Why Babylon.js over Three.js:**
```javascript
// Babylon.js: Glass effect in 10 lines
const glassMaterial = new BABYLON.PBRMaterial("glass", scene);
glassMaterial.alpha = 0.3;
glassMaterial.metallic = 0;
glassMaterial.roughness = 0.1;
glassMaterial.indexOfRefraction = 1.52; // Real glass physics
glassMaterial.subSurface.isRefractionEnabled = true;

// Three.js: Requires custom shader + 50+ lines for same effect
```

**Babylon.js Advantages for This Project:**
- Built-in PBR materials (critical for glass aesthetic)
- Native WebXR manager (`scene.createDefaultXRExperienceAsync()`)
- Comprehensive hand tracking API
- Better Quest 3 optimization out-of-box
- Smaller learning curve for mathematical code

### Build System: Vite 5.x

**Why Vite:**
- Native HTTPS support (required for WebXR)
- Hot module reload for rapid iteration
- Automatic code splitting
- TypeScript support built-in
- Fast dev server (< 1s startup)

### Language: TypeScript (Strict Mode)

**Why TypeScript:**
- Catch math errors at compile time
- Better IDE support in Claude Code Web
- Self-documenting code
- Easier refactoring

### Version Control: Git + GitHub

**Why GitHub:**
- Claude Code Web native integration
- GitHub Pages for free hosting
- Actions for CI/CD
- Issues for tracking

---

## Project Setup in Claude Code Web

### Phase 1: Initialize Project (10 minutes)

**Step 1: Create CLAUDE.md**

```markdown
# XR Bubble Wave - WebXR Implementation

## Project Overview
WebXR implementation of wave-based bubble interactions using Babylon.js.
Core innovation: Wave interference mathematics for natural bubble movement.

## Tech Stack
- Babylon.js 8.x (WebXR + PBR materials)
- TypeScript 5.x (strict mode)
- Vite 5.x (dev server + build)
- WebXR Device API (hand tracking + immersive-vr)

## Project Structure
/src
  /math         - Wave calculations (pure functions, no framework deps)
  /scene        - Babylon.js scene setup
  /bubbles      - Bubble rendering and management
  /xr           - WebXR session and hand tracking
  /ui           - Debug UI and controls
  main.ts       - Application entry point

## Critical Requirements
1. Wave mathematics must run at 90Hz on Quest 3
2. Glass material with proper refraction
3. Hand tracking for pinch-to-grab
4. 50+ bubbles at 72+ FPS on Quest 3

## Development Commands
npm install       # Install dependencies
npm run dev       # Start dev server (auto-HTTPS for WebXR)
npm run build     # Production build
npm run preview   # Test production build

## Key Files
- src/math/WaveCalculator.ts - Core wave height calculations
- src/bubbles/BubbleManager.ts - Bubble lifecycle and positioning
- src/xr/HandTracking.ts - Hand gesture recognition
- src/scene/SceneSetup.ts - Babylon.js initialization

## Testing
- Desktop: Open https://localhost:5173 in Chrome/Edge
- Quest 3: Enable Developer Mode, visit local IP address
- Vision Pro: Safari 18.0+ with WebXR enabled

## Anti-Patterns to Avoid
❌ Don't create assembly boundaries (this is web, not Unity)
❌ Don't create abstraction layers (YAGNI principle)
❌ Don't separate math into multiple files (keep calculations together)
❌ Don't create event systems (use direct function calls)

## Context for Claude Code
When making changes:
1. All math functions are pure (no side effects)
2. Babylon.js manages scene graph (we don't need custom hierarchy)
3. Performance-critical: Wave calculations and mesh updates
4. WebXR requires HTTPS (Vite handles this automatically)
```

**Step 2: Initialize npm Project**

```bash
npm init -y
npm install --save babylon babylonjs-loaders
npm install --save-dev vite typescript @types/node
npm install --save-dev @vitejs/plugin-basic-ssl
```

**Step 3: Create Vite Configuration**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()], // Auto-generates SSL cert for WebXR
  server: {
    https: true,
    port: 5173,
    host: true, // Expose to network for Quest 3 testing
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'babylon': ['@babylonjs/core', '@babylonjs/loaders'],
          'math': ['./src/math/WaveCalculator.ts'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@babylonjs/core', '@babylonjs/loaders'],
  },
});
```

**Step 4: Create TypeScript Configuration**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Step 5: Create Package.json Scripts**

```json
{
  "name": "xr-bubble-wave",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Architecture (Anti-Over-Engineering)

### The Unity Mistake

```
Unity Project (OVER-ENGINEERED):
├── 16 Assembly Definitions
├── 193 C# files
├── 97,138 lines of code
├── Event-driven architecture
├── Dependency injection framework
└── Feature gate system

Result: Never finished, impossible to maintain
```

### The WebXR Solution

```
WebXR Project (PRAGMATIC):
├── 12 TypeScript files
├── ~2,000 lines of code
├── Direct function calls
├── Flat file structure
└── Zero abstraction layers

Result: Ships in 4 weeks
```

### File Structure

```
xr-bubble-wave/
├── CLAUDE.md                    # Project context for Claude Code
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Build config
├── index.html                   # Entry point
└── src/
    ├── main.ts                  # App initialization (50 lines)
    ├── math/
    │   └── WaveCalculator.ts    # Pure math functions (200 lines)
    ├── scene/
    │   └── SceneSetup.ts        # Babylon.js scene (100 lines)
    ├── bubbles/
    │   ├── BubbleManager.ts     # Bubble lifecycle (300 lines)
    │   └── GlassMaterial.ts     # PBR material config (80 lines)
    ├── xr/
    │   ├── XRSession.ts         # WebXR setup (150 lines)
    │   └── HandTracking.ts      # Hand gesture detection (200 lines)
    └── ui/
        └── DebugUI.ts           # Performance overlay (120 lines)

Total: ~1,200 lines + comments/types = ~2,000 lines
```

### Dependency Graph (Simple!)

```
main.ts
  ├── SceneSetup.ts
  │   └── GlassMaterial.ts
  ├── BubbleManager.ts
  │   ├── WaveCalculator.ts (PURE MATH - NO DEPS)
  │   └── GlassMaterial.ts
  ├── XRSession.ts
  │   └── HandTracking.ts
  └── DebugUI.ts

No circular dependencies!
No event buses!
No dependency injection!
Just simple function calls!
```

---

## Implementation Roadmap

### Week 1: Foundation (Minimal Viable Scene)

**Goal**: Render 10 glass spheres in VR with hand tracking

**Tasks**:
1. **Day 1-2**: Setup + Basic Scene
   - Initialize project with Vite + TypeScript
   - Create Babylon.js scene with lighting
   - Render single sphere with basic material
   - Verify HTTPS works for WebXR

2. **Day 3-4**: WebXR Integration
   - Add WebXR session initialization
   - Implement hand tracking
   - Test on Quest 3 browser
   - Add teleportation for movement

3. **Day 5**: Glass Material
   - Implement PBR glass material
   - Add environment map for reflections
   - Test refraction properties
   - Optimize for mobile GPU

**Deliverable**: Static glass spheres visible in Quest 3 with hand tracking

**Success Metrics**:
- ✅ Sphere renders with transparency
- ✅ Hand tracking works at 60Hz
- ✅ Maintains 72+ FPS on Quest 3
- ✅ Can grab sphere with pinch gesture

---

### Week 2: Wave Mathematics (Core Innovation)

**Goal**: Port wave calculations from Unity and apply to bubble positions

**Tasks**:
1. **Day 1-2**: Extract Unity Math
   - Copy WaveMatrixCore.cs calculations
   - Convert C# to TypeScript
   - Write unit tests for wave functions
   - Validate against Unity output

2. **Day 3-4**: Apply to Bubbles
   - Create BubbleManager with 50 bubbles
   - Position bubbles in grid layout
   - Apply wave displacement each frame
   - Add breathing animation (0.25 Hz)

3. **Day 5**: Performance Optimization
   - Implement GPU instancing for bubbles
   - Use Babylon.js thin instances
   - Profile wave calculation cost
   - Target 90Hz update rate

**Deliverable**: 50 bubbles moving with wave interference patterns

**Success Metrics**:
- ✅ Wave math matches Unity behavior
- ✅ 50 bubbles at 72+ FPS on Quest 3
- ✅ Smooth breathing animation
- ✅ Visible interference patterns

**Code Example - WaveCalculator.ts**:

```typescript
// src/math/WaveCalculator.ts
import { Vector2, Vector3 } from '@babylonjs/core';

export interface WaveSettings {
  primaryWave: { frequency: number; amplitude: number; speed: number; phase: number };
  secondaryWave: { frequency: number; amplitude: number; speed: number; phase: number };
  tertiaryWave: { frequency: number; amplitude: number; speed: number; phase: number };
  interferenceFreq: number;
  interferenceAmplitude: number;
  enableInterference: boolean;
  baseHeight: number;
}

export class WaveCalculator {
  /**
   * Calculate wave height at a world position
   * Ported from Unity WaveMatrixCore.cs line 67-101
   */
  static calculateWaveHeight(
    worldPosition: Vector2,
    time: number,
    settings: WaveSettings
  ): number {
    let height = settings.baseHeight;
    const x = worldPosition.x;
    const z = worldPosition.y;

    // Primary wave component (X-axis oscillation)
    height += Math.sin(
      x * settings.primaryWave.frequency +
      time * settings.primaryWave.speed +
      settings.primaryWave.phase
    ) * settings.primaryWave.amplitude;

    // Secondary wave component (Z-axis oscillation)
    height += Math.sin(
      z * settings.secondaryWave.frequency +
      time * settings.secondaryWave.speed +
      settings.secondaryWave.phase
    ) * settings.secondaryWave.amplitude;

    // Tertiary wave component (radial oscillation)
    const radialDistance = Math.sqrt(x * x + z * z);
    height += Math.sin(
      radialDistance * settings.tertiaryWave.frequency +
      time * settings.tertiaryWave.speed +
      settings.tertiaryWave.phase
    ) * settings.tertiaryWave.amplitude;

    // Interference pattern
    if (settings.enableInterference) {
      const interference =
        Math.sin(x * settings.interferenceFreq + time) *
        Math.cos(z * settings.interferenceFreq + time) *
        settings.interferenceAmplitude;
      height += interference;
    }

    return height;
  }

  /**
   * Calculate breathing displacement for a bubble
   * Ported from Unity BreathingAnimationSystem.cs
   */
  static calculateBreathingOffset(
    time: number,
    individualPhase: number,
    breathingFrequency: number = 0.25, // 15 breaths per minute
    breathingAmplitude: number = 0.1
  ): Vector3 {
    const phase = time * breathingFrequency * Math.PI * 2 + individualPhase;
    const sineComponent = Math.sin(phase) * breathingAmplitude;
    const cosineComponent = Math.cos(phase) * breathingAmplitude * 0.5;

    return new Vector3(
      sineComponent * 0.1,  // Slight horizontal sway
      sineComponent,         // Primary vertical breathing
      cosineComponent * 0.05 // Minimal depth movement
    );
  }

  /**
   * Default wave settings (ported from Unity WaveMatrixSettings.cs)
   */
  static getDefaultSettings(): WaveSettings {
    return {
      primaryWave: {
        frequency: 1.0,
        amplitude: 0.3,
        speed: 1.5,
        phase: 0
      },
      secondaryWave: {
        frequency: 1.2,
        amplitude: 0.25,
        speed: 1.8,
        phase: Math.PI / 4
      },
      tertiaryWave: {
        frequency: 0.8,
        amplitude: 0.15,
        speed: 1.2,
        phase: Math.PI / 2
      },
      interferenceFreq: 2.0,
      interferenceAmplitude: 0.1,
      enableInterference: true,
      baseHeight: 0.0
    };
  }
}
```

---

### Week 3: Interaction & Polish

**Goal**: Natural hand interactions with haptic feedback

**Tasks**:
1. **Day 1-2**: Pinch-to-Grab
   - Detect pinch gesture (thumb + index < 3cm)
   - Pick up nearest bubble
   - Apply physics when released
   - Add haptic pulse on contact

2. **Day 3-4**: Visual Feedback
   - Highlight bubble on hover (glow effect)
   - Touch ripple animation
   - Hand proximity effects
   - Smooth transitions

3. **Day 5**: Audio (Optional)
   - Glass clink sound on touch
   - Spatial audio positioning
   - Subtle ambient background
   - Volume controls

**Deliverable**: Interactive bubbles with hand tracking

**Success Metrics**:
- ✅ Pinch gesture detection < 5ms latency
- ✅ Haptic feedback on touch
- ✅ Visual feedback is smooth
- ✅ No frame drops during interaction

---

### Week 4: Optimization & Deployment

**Goal**: Ship production-ready demo

**Tasks**:
1. **Day 1-2**: Performance Optimization
   - Profile GPU and CPU usage
   - Implement LOD (reduce distant bubbles)
   - Enable fixed foveated rendering
   - Optimize draw calls

2. **Day 3-4**: Testing & Bug Fixes
   - Test on Quest 3 for 30+ minutes
   - Test on desktop VR (SteamVR)
   - Fix any motion sickness issues
   - Validate 72+ FPS sustained

3. **Day 5**: Deployment
   - Build production bundle
   - Deploy to GitHub Pages
   - Create demo video
   - Write user documentation

**Deliverable**: Live WebXR demo accessible via URL

**Success Metrics**:
- ✅ <5MB bundle size
- ✅ <2s load time on Quest 3
- ✅ 72+ FPS sustained for 30 minutes
- ✅ Works on Quest 3, Vision Pro, Desktop VR

---

## Code Migration Guide

### Unity → TypeScript Math Conversion

**Unity C# (math library)**:
```csharp
float3 position = new float3(x, y, z);
float distance = math.length(position);
float height = math.sin(distance * frequency + time);
```

**TypeScript (Babylon.js)**:
```typescript
const position = new Vector3(x, y, z);
const distance = position.length();
const height = Math.sin(distance * frequency + time);
```

### Wave Height Calculation Port

**Unity (WaveMatrixCore.cs lines 67-101)**:
```csharp
public float CalculateWaveHeight(float2 worldPosition, float time, WaveMatrixSettings settings)
{
    float height = 0f;
    float x = worldPosition.x;
    float z = worldPosition.y;

    // Primary wave
    height += math.sin(x * settings.primaryWave.frequency + time * settings.primaryWave.speed)
             * settings.primaryWave.amplitude;

    // Secondary wave
    height += math.sin(z * settings.secondaryWave.frequency + time * settings.secondaryWave.speed)
             * settings.secondaryWave.amplitude;

    // Tertiary wave (radial)
    float radialDistance = math.length(worldPosition);
    height += math.sin(radialDistance * settings.tertiaryWave.frequency + time * settings.tertiaryWave.speed)
             * settings.tertiaryWave.amplitude;

    return height;
}
```

**WebXR (WaveCalculator.ts - see Week 2 code example above)**

### Breathing Animation Port

**Unity (BreathingAnimationSystem.cs)**:
```csharp
float3 CalculateBreathingDisplacement(float time, float individualPhase)
{
    float sineComponent = math.sin(time * breathingFrequency + individualPhase) * breathingAmplitude;
    float cosineComponent = math.cos(time * breathingFrequency + phaseOffset) * breathingAmplitude * 0.5f;

    return new float3(
        sineComponent * 0.1f,
        sineComponent,
        cosineComponent * 0.05f
    );
}
```

**WebXR (see WaveCalculator.calculateBreathingOffset() in Week 2 example)**

### Glass Shader Port

**Unity (BubbleGlass.shader - HLSL/URP)**:
```hlsl
// 203 lines of custom shader code for glass effect
Shader "Custom/BubbleGlass"
{
    Properties {
        _BaseColor ("Base Color", Color) = (0.8, 0.9, 1, 0.3)
        _Smoothness ("Smoothness", Range(0,1)) = 0.95
        _Metallic ("Metallic", Range(0,1)) = 0.0
        // ... 50 more lines
    }
    // ... complex HLSL code
}
```

**WebXR (GlassMaterial.ts - Babylon.js PBR)**:
```typescript
// src/bubbles/GlassMaterial.ts
import { PBRMaterial, Scene, Color3, Texture } from '@babylonjs/core';

export function createGlassMaterial(scene: Scene): PBRMaterial {
  const glass = new PBRMaterial("glass", scene);

  // Glass properties
  glass.alpha = 0.3;
  glass.metallic = 0.0;
  glass.roughness = 0.05;

  // Refraction (real glass physics)
  glass.indexOfRefraction = 1.52;
  glass.subSurface.isRefractionEnabled = true;
  glass.subSurface.refractionIntensity = 0.8;

  // Neon-pastel tint
  glass.albedoColor = new Color3(0.8, 0.9, 1.0);

  // Fresnel rim lighting
  glass.environmentIntensity = 1.2;

  return glass;
}

// That's it! 20 lines vs 203 lines in Unity.
// Babylon.js handles the shader compilation.
```

---

## Performance Targets

### Quest 3 Requirements

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Frame Rate | 72 FPS | 60 FPS minimum |
| Bubble Count | 50+ | 30 minimum |
| Hand Tracking | 60 Hz | 30 Hz minimum |
| Draw Calls | <50 | <100 maximum |
| Memory Usage | <200 MB | <400 MB maximum |
| Load Time | <3s | <5s maximum |

### Optimization Techniques

**1. GPU Instancing (Critical)**
```typescript
// src/bubbles/BubbleManager.ts
import { InstancedMesh, Mesh } from '@babylonjs/core';

class BubbleManager {
  private bubbleInstances: InstancedMesh[] = [];

  createBubbles(baseMesh: Mesh, count: number) {
    for (let i = 0; i < count; i++) {
      const instance = baseMesh.createInstance(`bubble_${i}`);
      this.bubbleInstances.push(instance);
    }
    // All instances share same material and geometry
    // Only 1 draw call instead of 50!
  }
}
```

**2. Fixed Foveated Rendering**
```typescript
// src/xr/XRSession.ts
const xr = await scene.createDefaultXRExperienceAsync({
  uiOptions: { sessionMode: 'immersive-vr' }
});

// Enable foveated rendering for Quest 3
if (xr.baseExperience.featuresManager) {
  const foveation = xr.baseExperience.featuresManager.enableFeature(
    BABYLON.WebXRFeatureName.FOVEATION,
    'latest',
    { level: 2 } // Medium foveation (balance quality/performance)
  );
}
```

**3. Level of Detail (LOD)**
```typescript
// Reduce quality for distant bubbles
updateBubble(bubble: InstancedMesh, cameraDistance: number) {
  if (cameraDistance > 5) {
    bubble.isVisible = false; // Don't render far bubbles
  } else if (cameraDistance > 3) {
    bubble.scaling.setAll(0.8); // Smaller detail for mid-range
  }
}
```

---

## Testing Strategy

### Desktop Testing (Primary Development)

```bash
# Start dev server
npm run dev

# Open browser
# Chrome/Edge: https://localhost:5173
# Enter VR with WebXR emulator extension
```

**Chrome WebXR Emulator**:
- Install: https://chrome.google.com/webstore/detail/webxr-api-emulator/
- Simulates hand tracking
- Test without VR headset
- Performance won't match Quest 3 (use for logic only)

### Quest 3 Testing (Performance Validation)

**Setup**:
1. Enable Developer Mode in Meta Quest app
2. Find local IP: `ifconfig` or `ipconfig`
3. Open Quest 3 browser
4. Navigate to `https://192.168.x.x:5173`
5. Accept SSL warning (self-signed cert)
6. Enter VR mode

**Performance Monitoring**:
```typescript
// src/ui/DebugUI.ts
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';

export class DebugUI {
  private fpsText: TextBlock;

  constructor(scene: Scene) {
    const ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    this.fpsText = new TextBlock();
    this.fpsText.text = "FPS: 0";
    this.fpsText.color = "white";
    this.fpsText.fontSize = 24;
    this.fpsText.top = "-45%";
    ui.addControl(this.fpsText);
  }

  update(engine: Engine) {
    this.fpsText.text = `FPS: ${engine.getFps().toFixed(0)}`;
  }
}
```

### Automated Testing

**Unit Tests for Math**:
```typescript
// tests/WaveCalculator.test.ts
import { WaveCalculator } from '../src/math/WaveCalculator';
import { Vector2 } from '@babylonjs/core';

describe('WaveCalculator', () => {
  test('wave height at origin should equal base height', () => {
    const settings = WaveCalculator.getDefaultSettings();
    const height = WaveCalculator.calculateWaveHeight(
      new Vector2(0, 0),
      0,
      settings
    );
    expect(height).toBeCloseTo(settings.baseHeight, 2);
  });

  test('breathing offset should oscillate smoothly', () => {
    const t1 = WaveCalculator.calculateBreathingOffset(0, 0);
    const t2 = WaveCalculator.calculateBreathingOffset(1, 0);
    expect(t2.y).not.toEqual(t1.y); // Should change over time
  });
});
```

---

## Deployment

### GitHub Pages (Recommended)

**Setup**:
```bash
# Build production bundle
npm run build

# dist/ folder contains deployable files
```

**GitHub Actions Workflow**:
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Result**: Live at `https://<username>.github.io/xr-bubble-wave/`

### Alternative: Netlify/Vercel

**Netlify**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Vercel**:
```bash
npm install -g vercel
vercel --prod
```

---

## Critical Success Factors

### What Will Make or Break This Project

✅ **DO:**
- Port math first, verify it works
- Test on Quest 3 early and often
- Use Babylon.js PBR materials (don't write custom shaders)
- Keep file count <15 files
- Use GPU instancing from day 1
- Maintain 72+ FPS as non-negotiable

❌ **DON'T:**
- Create abstraction layers
- Write custom build system
- Separate concerns into multiple files prematurely
- Add features before core works
- Optimize before profiling
- Create event systems

### Risk Mitigation

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Math doesn't port correctly | Medium | Unit test against Unity output |
| Performance below 72 FPS | High | Profile early, use instancing |
| Hand tracking unreliable | Medium | Add controller fallback |
| Glass material looks wrong | Low | Use Babylon.js PBRMaterial |
| WebXR browser bugs | Medium | Test on multiple devices |
| Scope creep | High | Ruthlessly cut features |

---

## Acceptance Criteria

### Minimum Viable Demo (MVP)

**Must Have**:
- ✅ 50 glass bubbles visible in VR
- ✅ Wave interference patterns visible
- ✅ Hand tracking with pinch-to-grab
- ✅ 72+ FPS on Quest 3
- ✅ Glass material with refraction
- ✅ Breathing animation (0.25 Hz)

**Can Skip**:
- ❌ Advanced cymatics patterns
- ❌ AI-driven optimization
- ❌ Voice commands
- ❌ Spatial audio (can add later)
- ❌ Haptic feedback (nice to have)
- ❌ Complex UI systems

### Definition of Done

1. ✅ Demo accessible via public URL
2. ✅ Works on Quest 3 browser without issues
3. ✅ Maintains 72 FPS for 5+ minutes
4. ✅ Hand tracking latency <10ms
5. ✅ Code is <2,500 lines
6. ✅ GitHub repository has README
7. ✅ Demo video uploaded
8. ✅ No motion sickness reported

---

## Next Steps (Actionable)

### Immediate Actions (Next Hour)

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: WebXR bubble wave project"
   git branch -M main
   git remote add origin https://github.com/<username>/xr-bubble-wave.git
   git push -u origin main
   ```

2. **Initialize Project in Claude Code Web**
   - Create `CLAUDE.md` (use template above)
   - Run `npm init -y`
   - Install dependencies
   - Create `vite.config.ts`
   - Test dev server starts

3. **Verify HTTPS Works**
   ```bash
   npm run dev
   # Should see: https://localhost:5173
   # Visit in browser, accept cert warning
   ```

### First Week Goals (Next 7 Days)

**Day 1**: Project setup + basic Babylon.js scene
**Day 2**: WebXR session + hand tracking visualization
**Day 3**: Glass material + lighting
**Day 4**: 10 static bubbles in grid
**Day 5**: Test on Quest 3, fix any issues

**Deliverable**: Static glass spheres in VR

---

## Appendix A: Babylon.js Quick Reference

### Scene Setup
```typescript
// src/scene/SceneSetup.ts
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3 } from '@babylonjs/core';

export function createScene(canvas: HTMLCanvasElement): Scene {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  // Camera
  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 2,
    10,
    Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);

  // Lighting (important for glass!)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.7;

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  return scene;
}
```

### WebXR Initialization
```typescript
// src/xr/XRSession.ts
import { Scene, WebXRDefaultExperience } from '@babylonjs/core';

export async function initializeXR(scene: Scene): Promise<WebXRDefaultExperience> {
  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [],
    uiOptions: {
      sessionMode: 'immersive-vr',
      referenceSpaceType: 'local-floor'
    }
  });

  console.log('WebXR initialized');
  return xr;
}
```

### Hand Tracking
```typescript
// src/xr/HandTracking.ts
import { WebXRDefaultExperience, WebXRFeatureName, WebXRHandTracking } from '@babylonjs/core';

export function enableHandTracking(xr: WebXRDefaultExperience) {
  const handTracking = xr.baseExperience.featuresManager.enableFeature(
    WebXRFeatureName.HAND_TRACKING,
    'latest',
    { xrInput: xr.input }
  ) as WebXRHandTracking;

  handTracking.onHandAddedObservable.add((hand) => {
    console.log(`${hand.xrController.inputSource.handedness} hand detected`);
  });
}
```

---

## Appendix B: Troubleshooting

### Common Issues

**Issue**: "WebXR not supported"
- **Cause**: Not using HTTPS
- **Fix**: Ensure Vite config has `https: true`

**Issue**: Black screen in VR
- **Cause**: No lighting in scene
- **Fix**: Add HemisphericLight

**Issue**: Bubbles not visible
- **Cause**: Camera inside geometry or wrong scale
- **Fix**: Check camera position and bubble positions

**Issue**: Low FPS on Quest 3
- **Cause**: Not using GPU instancing
- **Fix**: Use `mesh.createInstance()` instead of `mesh.clone()`

**Issue**: Hand tracking not working
- **Cause**: Hand tracking not enabled in Quest settings
- **Fix**: Settings → Device → Hands and Controllers → Enable Hand Tracking

---

## Conclusion

This plan provides a pragmatic, non-over-engineered path to a working WebXR bubble wave demo in 4 weeks.

**Key Principles**:
1. **Start simple**: 12 files, 2,000 lines
2. **Test early**: Quest 3 from Week 1
3. **Port math first**: Validate core innovation
4. **Use framework features**: Don't reinvent glass shaders
5. **Cut ruthlessly**: MVP over feature-complete

**Success Metric**: Live demo at end of Week 4.

---

**Ready to start? Run these commands in Claude Code Web:**

```bash
# Initialize project
npm init -y
npm install babylon babylonjs-loaders vite typescript @vitejs/plugin-basic-ssl

# Create CLAUDE.md (copy from Section: Project Setup)

# Start coding!
npm run dev
```

**Questions during development? Ask Claude with context:**
- "How do I convert this Unity math to TypeScript?"
- "Why is FPS dropping below 72?"
- "How do I detect pinch gesture in Babylon.js?"
- "Show me example of GPU instancing"

The committees have convened. The plan is ready. Now ship it. 🚀
