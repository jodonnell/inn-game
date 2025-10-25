import { Application, Assets, Spritesheet, Texture, Sprite } from "pixi.js"
import managerAtlas from "@/assets/spritesheets/manager-sheet.json"

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
  return spritesheet
}

export const test = async () => {
  const app = new Application()
  await app.init({ background: "#000000", resizeTo: window })
  document.body.appendChild(app.canvas)

  await load()

  const spritesheet = await sprites()
  const sprite = new Sprite(
    spritesheet.textures["0001-manager-all-frames_frontidle_0001.png"] ??
      spritesheet.textures["0002-manager-all-frames_frontinteract_0001.png"],
  )
  sprite.x = 500
  sprite.y = 300
  sprite.eventMode = "static"
  app.stage.addChild(sprite)
}
