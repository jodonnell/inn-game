import {
  Application,
  Assets,
  Spritesheet,
  Texture,
  AnimatedSprite,
} from "pixi.js"
import managerAtlas from "@/assets/spritesheets/manager-sheet.json"
import { useKeyboardInput } from "@/src/input/keyboard.js"
import {
  createRegistry,
  defineComponent,
  createSystemRunner,
} from "@/src/core/ecs/index.js"

let base = "."
if (import.meta.env.DEV) base = "../.."

const WALK_FPS = 7
const MOVE_SPEED = 4
const DEFAULT_DIRECTION = "down"
const INITIAL_POSITION = { x: 500, y: 300 }

const DIRECTION_SEGMENTS = {
  down: { walk: "frontwalk", idle: "frontidle" },
  up: { walk: "backwalk", idle: "backidle" },
  left: { walk: "leftwalk", idle: "leftidle" },
  right: { walk: "rightwalk", idle: "rightidle" },
}

const Transform = defineComponent("Transform", () => ({
  x: INITIAL_POSITION.x,
  y: INITIAL_POSITION.y,
}))

const Movement = defineComponent("Movement", () => ({
  dx: 0,
  dy: 0,
  speed: MOVE_SPEED,
  direction: DEFAULT_DIRECTION,
  moving: false,
}))

const SpriteRef = defineComponent("SpriteRef", () => ({
  sprite: null,
}))

const AnimationSet = defineComponent("AnimationSet", () => ({
  animations: {},
}))

const AnimationState = defineComponent("AnimationState", () => ({
  currentKey: "",
}))

const InputState = defineComponent("InputState", () => ({
  pressed: new Set(),
}))

const inputSystem = {
  name: "input",
  components: [InputState, Movement],
  update: ({ components: { InputState: input, Movement: movement } }) => {
    const pressed = input.pressed
    let dx = 0
    let dy = 0

    if (pressed.has("ArrowLeft")) dx -= 1
    if (pressed.has("ArrowRight")) dx += 1
    if (pressed.has("ArrowUp")) dy -= 1
    if (pressed.has("ArrowDown")) dy += 1

    movement.dx = dx
    movement.dy = dy
    movement.moving = dx !== 0 || dy !== 0
  },
}

const movementSystem = {
  name: "movement",
  components: [Movement, Transform],
  update: ({
    components: { Movement: movement, Transform: transform },
    delta,
  }) => {
    if (!movement.moving) return

    const direction = resolveDirection(
      movement.dx,
      movement.dy,
      movement.direction,
    )
    movement.direction = direction

    const length = Math.hypot(movement.dx, movement.dy) || 1
    const distance = movement.speed * delta

    transform.x += (movement.dx / length) * distance
    transform.y += (movement.dy / length) * distance
  },
}

const animationSystem = {
  name: "animation",
  components: [SpriteRef, AnimationSet, AnimationState, Movement],
  update: ({
    components: {
      SpriteRef: spriteRef,
      AnimationSet: animationSet,
      AnimationState: animationState,
      Movement: movement,
    },
  }) => {
    if (!spriteRef.sprite) return

    const animations = animationSet.animations
    const direction = movement.direction ?? DEFAULT_DIRECTION
    const variant = animations[direction] ?? animations[DEFAULT_DIRECTION]
    if (!variant) return

    const moving = movement.moving
    const key = `${moving ? "walk" : "idle"}-${direction}`
    if (animationState.currentKey === key) return

    if (moving) setWalkAnimation(spriteRef.sprite, variant)
    else setIdleAnimation(spriteRef.sprite, variant)

    animationState.currentKey = key
  },
}

const renderSystem = {
  name: "render",
  components: [SpriteRef, Transform],
  update: ({ components: { SpriteRef: spriteRef, Transform: transform } }) => {
    if (!spriteRef.sprite) return
    spriteRef.sprite.x = transform.x
    spriteRef.sprite.y = transform.y
  },
}

const collectTextures = (spritesheet, segment) => {
  return Object.keys(spritesheet.textures)
    .filter((key) => key.includes(segment))
    .sort()
    .map((key) => spritesheet.textures[key])
}

const buildAnimations = (spritesheet) => {
  return Object.fromEntries(
    Object.entries(DIRECTION_SEGMENTS).map(([direction, segments]) => {
      const walkTextures = collectTextures(spritesheet, segments.walk)
      const idleTextures = collectTextures(spritesheet, segments.idle)
      const idleTexture =
        idleTextures[0] ?? walkTextures[0] ?? Texture.EMPTY

      return [
        direction,
        {
          walk: walkTextures.length > 0 ? walkTextures : [idleTexture],
          idle: idleTexture,
        },
      ]
    }),
  )
}

const pickInitialFrame = (animations) => {
  const preferred =
    animations[DEFAULT_DIRECTION]?.idle ??
    animations[DEFAULT_DIRECTION]?.walk[0]
  if (preferred) return preferred

  for (const entry of Object.values(animations)) {
    if (entry.idle) return entry.idle
    if (entry.walk.length > 0) return entry.walk[0]
  }

  return Texture.EMPTY
}

const setWalkAnimation = (sprite, variant) => {
  sprite.textures = variant.walk
  sprite.loop = true
  sprite.gotoAndPlay(0)
}

const setIdleAnimation = (sprite, variant) => {
  const idleTexture = variant.idle ?? variant.walk[0] ?? Texture.EMPTY
  sprite.textures = [idleTexture]
  sprite.loop = false
  sprite.gotoAndStop(0)
}

const resolveDirection = (dx, dy, fallback) => {
  if (dy !== 0) return dy < 0 ? "up" : "down"
  if (dx !== 0) return dx < 0 ? "left" : "right"
  return fallback
}

const load = async () => {
  await Assets.load(`${base}/assets/spritesheets/manager-sheet.png`)
}

const loadManagerResources = async () => {
  const texture = Texture.from(
    `${base}/assets/spritesheets/manager-sheet.png`,
  )
  const spritesheet = new Spritesheet(texture, managerAtlas)
  await spritesheet.parse()

  const animations = buildAnimations(spritesheet)
  const initialIdle = pickInitialFrame(animations)

  const sprite = new AnimatedSprite([initialIdle])
  sprite.animationSpeed = WALK_FPS / 60
  sprite.loop = false
  sprite.gotoAndStop(0)

  return { sprite, animations }
}

const createScene = async () => {
  const app = new Application()
  await app.init({ background: "#000000", resizeTo: window })
  document.body.appendChild(app.canvas)
  return app
}

const createManagerEntity = (registry, { sprite, animations, keyboard }) => {
  const entity = registry.createEntity()

  registry.addComponent(entity, Transform, {
    x: INITIAL_POSITION.x,
    y: INITIAL_POSITION.y,
  })

  registry.addComponent(entity, Movement, {
    speed: MOVE_SPEED,
    direction: DEFAULT_DIRECTION,
    moving: false,
    dx: 0,
    dy: 0,
  })

  registry.addComponent(entity, SpriteRef, { sprite })
  registry.addComponent(entity, AnimationSet, { animations })
  registry.addComponent(entity, AnimationState, { currentKey: "" })
  registry.addComponent(entity, InputState, { pressed: keyboard.pressed })

  const defaultVariant =
    animations[DEFAULT_DIRECTION] ??
    Object.values(animations)[0] ??
    { walk: [Texture.EMPTY], idle: Texture.EMPTY }
  setIdleAnimation(sprite, defaultVariant)

  const animationState = registry.getComponent(entity, AnimationState)
  animationState.currentKey = `idle-${DEFAULT_DIRECTION}`

  sprite.x = INITIAL_POSITION.x
  sprite.y = INITIAL_POSITION.y

  return entity
}

export const test = async () => {
  const app = await createScene()
  await load()

  const { sprite, animations } = await loadManagerResources()
  app.stage.addChild(sprite)

  const registry = createRegistry()
  const systems = createSystemRunner(registry)
  systems.addSystem(inputSystem)
  systems.addSystem(movementSystem)
  systems.addSystem(animationSystem)
  systems.addSystem(renderSystem)

  const keyboard = useKeyboardInput()

  const managerEntity = createManagerEntity(registry, {
    sprite,
    animations,
    keyboard,
  })

  const updateDebugState = () => {
    const transform = registry.getComponent(managerEntity, Transform)
    const movement = registry.getComponent(managerEntity, Movement)
    const animationState = registry.getComponent(managerEntity, AnimationState)

    window.__innGame.debug = {
      x: transform?.x ?? null,
      y: transform?.y ?? null,
      direction: movement?.direction ?? null,
      animationKey: animationState?.currentKey ?? null,
    }
  }

  const resetPosition = () => {
    const transform = registry.getComponent(managerEntity, Transform)
    const movement = registry.getComponent(managerEntity, Movement)
    const spriteRef = registry.getComponent(managerEntity, SpriteRef)
    const animationSet = registry.getComponent(managerEntity, AnimationSet)
    const animationState = registry.getComponent(managerEntity, AnimationState)

    if (transform) {
      transform.x = INITIAL_POSITION.x
      transform.y = INITIAL_POSITION.y
    }

    if (movement) {
      movement.dx = 0
      movement.dy = 0
      movement.moving = false
      movement.direction = DEFAULT_DIRECTION
    }

    if (spriteRef?.sprite && animationSet) {
      const variant =
        animationSet.animations[DEFAULT_DIRECTION] ??
        Object.values(animationSet.animations)[0]
      if (variant) setIdleAnimation(spriteRef.sprite, variant)
      spriteRef.sprite.x = INITIAL_POSITION.x
      spriteRef.sprite.y = INITIAL_POSITION.y
    }

    if (animationState) {
      animationState.currentKey = `idle-${DEFAULT_DIRECTION}`
    }

    updateDebugState()
  }

  const innGame = {
    app,
    ecs: {
      registry,
      systems,
      components: {
        Transform,
        Movement,
        SpriteRef,
        AnimationSet,
        AnimationState,
        InputState,
      },
      entities: {
        manager: managerEntity,
      },
    },
    keyboard,
    managerEntity,
    resetPosition,
    debug: {},
  }

  window.__innGame = innGame
  updateDebugState()

  app.ticker.add((ticker) => {
    systems.run(ticker.deltaTime)
    updateDebugState()
  })
}
