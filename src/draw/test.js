import { Application, Assets, Spritesheet, Texture, Sprite } from "pixi.js"
import managerAtlas from "@/assets/spritesheets/manager-sheet.json"
import { useKeyboardInput } from "@/src/input/keyboard.js"

let base = "."
if (import.meta.env.DEV) base = "../.."

const load = async () => {
  await Assets.load(`${base}/assets/spritesheets/manager-sheet.png`)
}

const sprites = async () => {
  const texture = Texture.from(
    `${base}/assets/spritesheets/manager-sheet.png`,
  )
  const spritesheet = new Spritesheet(texture, managerAtlas)
  await spritesheet.parse()

  const textureFrame =
    spritesheet.textures["0001-manager-all-frames_frontidle_0001.png"] ??
    spritesheet.textures["0002-manager-all-frames_frontinteract_0001.png"]

  return {
    sprite: textureFrame ? new Sprite(textureFrame) : new Sprite(),
    spritesheet,
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

  const { sprite } = await sprites()
  sprite.x = 500
  sprite.y = 300
  sprite.eventMode = "static"
  app.stage.addChild(sprite)

  const { pressed } = useKeyboardInput()

  window.__innGame = {
    app,
    sprite,
    resetPosition: () => {
      sprite.x = 500
      sprite.y = 300
    },
  }

  const speed = 4
  app.ticker.add((ticker) => {
    let dx = 0
    let dy = 0

    if (pressed.has("ArrowLeft")) dx -= 1
    if (pressed.has("ArrowRight")) dx += 1
    if (pressed.has("ArrowUp")) dy -= 1
    if (pressed.has("ArrowDown")) dy += 1

    if (dx === 0 && dy === 0) return

    const length = Math.hypot(dx, dy) || 1
    const delta = ticker.deltaTime

    sprite.x += (dx / length) * speed * delta
    sprite.y += (dy / length) * speed * delta
  })
}
