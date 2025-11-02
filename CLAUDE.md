# Markaba Web XR - WebXR Implementation

## Project Overview
WebXR implementation of wave-based bubble interactions using Babylon.js.
Core innovation: Wave interference mathematics for natural bubble movement.

## Tech Stack
- Babylon.js 8.x (WebXR + PBR materials)
- TypeScript 5.x (strict mode)
- Vite 5.x (dev server + build)
- WebXR Device API (hand tracking + immersive-vr)

## Project Structure
```
/src
  /math         - Wave calculations (pure functions, no framework deps)
  /scene        - Babylon.js scene setup
  /bubbles      - Bubble rendering and management
  /xr           - WebXR session and hand tracking
  /ui           - Debug UI and controls
  main.ts       - Application entry point
```

## Critical Requirements
1. Wave mathematics must run at 90Hz on Quest 3
2. Glass material with proper refraction
3. Hand tracking for pinch-to-grab
4. 50+ bubbles at 72+ FPS on Quest 3

## Development Commands
```bash
npm install       # Install dependencies
npm run dev       # Start dev server (auto-HTTPS for WebXR)
npm run build     # Production build
npm run preview   # Test production build
npm run typecheck # Run TypeScript type checking
```

## Key Files
- src/math/WaveCalculator.ts - Core wave height calculations
- src/bubbles/BubbleManager.ts - Bubble lifecycle and positioning
- src/bubbles/GlassMaterial.ts - PBR glass material configuration
- src/xr/XRSession.ts - WebXR session initialization
- src/xr/HandTracking.ts - Hand gesture recognition
- src/scene/SceneSetup.ts - Babylon.js initialization
- src/main.ts - Application entry point

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

## Migration from Unity
This project ports the core wave mathematics from a Unity implementation:
- Unity version: 97,138 lines across 193 files (never finished)
- WebXR target: ~2,000 lines across 12 files (ships in 4 weeks)
- Philosophy: Pragmatic simplicity over architectural complexity

### Portable Code from Unity
- WaveMatrixCore.cs → WaveCalculator.ts (~280 lines of pure math)
- BubblePositionCalculator.cs → Position logic in BubbleManager.ts
- BreathingAnimationSystem.cs → Breathing calculations
- Wave parameters and settings (100% portable)

### Non-Portable (Rewritten for Web)
- Unity shaders → Babylon.js PBR materials (10 lines vs 203 lines)
- MonoBehaviour → TypeScript classes
- Unity Jobs/Burst → Standard JavaScript (or WebWorkers if needed)

## Performance Targets
- Frame Rate: 72 FPS (Quest 3)
- Bubble Count: 50+
- Hand Tracking: 60 Hz
- Draw Calls: <50
- Memory Usage: <200 MB
- Load Time: <3s
- Bundle Size: <5MB

## Implementation Phases
### Week 1: Foundation (Current)
- ✅ Project setup with Vite + TypeScript
- ✅ Basic Babylon.js scene with lighting
- 🔄 Glass material implementation
- 🔄 WebXR session initialization
- 🔄 Hand tracking integration
- 📋 10 static glass spheres in VR

### Week 2: Wave Mathematics
- Port wave calculations from Unity
- Apply to bubble positions
- Implement breathing animation
- GPU instancing for performance
- 50 bubbles with interference patterns

### Week 3: Interaction & Polish
- Pinch-to-grab gestures
- Visual feedback (glow, ripples)
- Hand proximity effects
- Haptic feedback

### Week 4: Optimization & Deployment
- Performance profiling
- LOD implementation
- Testing on Quest 3
- GitHub Pages deployment

## Success Metrics
✅ Sphere renders with transparency
✅ Hand tracking works at 60Hz
✅ Maintains 72+ FPS on Quest 3
✅ Can grab sphere with pinch gesture
✅ Wave math matches Unity behavior
✅ 50 bubbles at 72+ FPS
✅ Smooth breathing animation
✅ Visible interference patterns
