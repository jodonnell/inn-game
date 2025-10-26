# Inn Game Systems Overview

## Game Flow
- Vite boots through `main.js`, which calls `src/draw/test.js` to assemble a playable Pixi scene.
- `test()` wires together the renderer, keyboard input, entity/component setup, and the ordered system list before starting the runtime.
- The Pixi ticker drives the game loop; every tick passes `deltaTime` into the ECS system runner and refreshes debug state that Playwright and manual testers read.

## Rendering Stack
- `src/draw/create-scene.js` creates the Pixi `Application`, world `Container`, and resize hooks; `scene-metrics.js` keeps the world scaled and letterboxed against the target aspect ratio.
- Scene creation appends Pixi's `<canvas>` to `document.body` when available, so Vite dev, preview, and Playwright all share the same boot path.
- The world container is passed to game code; gameplay systems mutate component state while the render system mirrors those values into Pixi sprites.

## ECS Core
- `src/core/ecs/index.js` provides `defineComponent`, a registry, and a system runner. Components are factories that produce default state; the registry stores component instances per entity and answers component queries.
- Systems declare the components they depend on and receive `{ entity, components, delta, registry, context }` each frame. `createSystemRunner` resolves entities matching the required components and calls each system sequentially.

## Manager Entity Assembly
- `src/game/entities/manager-entity.js` composes the playable character by attaching Transform, Movement, SpriteRef, AnimationSet, AnimationState, and InputState components to a fresh entity.
- The entity stores Pixi sprite references and keyboard state so both logic and rendering systems operate on shared ECS data.
- Reset helpers in `src/game/debug/manager-debug.js` can rewind this entity to its initial state, making e2e assertions deterministic.

## Systems Pipeline
- `managerSystems` orders the active systems: `inputSystem` → `movementSystem` → `animationSystem` → `renderSystem`.
- **Input** reads the keyboard component and produces normalized direction deltas alongside a `moving` flag.
- **Movement** integrates velocity into the Transform using the configured move speed and resolves the facing direction (preferring vertical movement).
- **Animation** swaps AnimatedSprite textures between idle and walk variants based on movement state while caching the current animation key.
- **Render** copies Transform coordinates onto the Pixi sprite so visual state follows ECS data.

## Runtime & Debugging
- `createGameRuntime` wraps Pixi, ECS, and input handles into a runtime object with `start`, `stop`, `dispose`, `resetPosition`, and `snapshot` helpers.
- `attachRuntimeToWindow` exposes the runtime as `window.__innGame`, refreshing the reference whenever debug state publishes; Playwright specs and manual testers rely on this hook.
- Debug state comes from `computeManagerDebug`, returning the manager’s position, facing direction, and active animation label on every tick.

## Resources & Asset Pipeline
- `src/game/resources/manager-resources.js` preloads the manager spritesheet via Pixi Assets, parses it into a `Spritesheet`, and builds direction-specific animation sets.
- `manager-animations.js` derives idle and walk textures for each direction, configures AnimatedSprite playback, and provides helpers to pick an initial frame or switch between idle/walk loops.
- The repo keeps spritesheets under `assets/spritesheets/`; the Aseprite command in `README.md` regenerates them from `assets/raw/`.

## Input Handling
- `src/input/keyboard.js` captures Arrow key presses on the window (or a provided target), storing active codes in a shared `Set`. The InputState component simply references this set so systems operate on live input without extra polling glue.

## Testing Touchpoints
- Jest specs under `test/logic/` cover ECS behavior and individual systems, making it safe to refactor core data flow.
- Playwright suites in `tests/e2e/` spin up the full Vite app, interact with the exposed runtime, and assert animation and movement regressions via the debug snapshot.

## Extending the Game
- Add new components with `defineComponent` and register them during entity creation; the registry auto-creates storage per component type.
- New gameplay behavior fits into systems—declare dependencies in `components`, push the system into the ordered list, and let Pixi’s ticker handle execution.
- Additional entities can be composed similarly to the manager entity; share resources and input via the runtime context when needed.
