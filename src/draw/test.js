import {
  Application,
  Assets,
  Spritesheet,
  Texture,
  AnimatedSprite,
} from "pixi.js"
import managerAtlas from "@/assets/spritesheets/manager-sheet.json"
import { useKeyboardInput } from "@/src/input/keyboard.js"

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

const sprites = async () => {
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

  return {
    sprite,
    spritesheet,
    animations,
  }
}

const createScene = async () => {
  const app = new Application()
  await app.init({ background: "#000000", resizeTo: window })
  document.body.appendChild(app.canvas)
  return app
}

export const test = async () => {
  const app = await createScene()

  await load()

  const { sprite, animations } = await sprites()
  sprite.x = INITIAL_POSITION.x
  sprite.y = INITIAL_POSITION.y
  sprite.eventMode = "static"
  app.stage.addChild(sprite)

  const state = {
    direction: DEFAULT_DIRECTION,
    animationKey: "",
    moving: false,
  }

  const applyAnimation = (direction, moving) => {
    const variant = animations[direction] ?? animations[DEFAULT_DIRECTION]
    if (!variant) return

    const key = `${moving ? "walk" : "idle"}-${direction}`
    if (state.animationKey === key) {
      state.direction = direction
      state.moving = moving
      return
    }

    if (moving) setWalkAnimation(sprite, variant)
    else setIdleAnimation(sprite, variant)

    state.animationKey = key
    state.direction = direction
    state.moving = moving
  }

  applyAnimation(state.direction, false)

  const { pressed } = useKeyboardInput()

  const resetPosition = () => {
    sprite.x = INITIAL_POSITION.x
    sprite.y = INITIAL_POSITION.y
    applyAnimation(DEFAULT_DIRECTION, false)
  }

  window.__innGame = {
    app,
    sprite,
    animations,
    state,
    resetPosition,
  }

  app.ticker.add((ticker) => {
    let dx = 0
    let dy = 0

    if (pressed.has("ArrowLeft")) dx -= 1
    if (pressed.has("ArrowRight")) dx += 1
    if (pressed.has("ArrowUp")) dy -= 1
    if (pressed.has("ArrowDown")) dy += 1

    const moving = dx !== 0 || dy !== 0

    if (!moving) {
      applyAnimation(state.direction, false)
      return
    }

    const direction = resolveDirection(dx, dy, state.direction)

    applyAnimation(direction, true)

    const length = Math.hypot(dx, dy) || 1
    const delta = ticker.deltaTime

    sprite.x += (dx / length) * MOVE_SPEED * delta
    sprite.y += (dy / length) * MOVE_SPEED * delta
  })
}
