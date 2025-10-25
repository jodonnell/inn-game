import {
  AnimatedSprite,
  Assets,
  Spritesheet,
  Texture,
} from "pixi.js"
import managerAtlas from "@/assets/spritesheets/manager-sheet.json"
import { WALK_FPS } from "@/src/game/constants.js"
import {
  buildAnimations,
  pickInitialFrame,
} from "@/src/game/animations/manager-animations.js"

const getAssetBase = () => {
  return import.meta.env.DEV ? "../.." : "."
}

export const preloadManagerAssets = async () => {
  const base = getAssetBase()
  await Assets.load(`${base}/assets/spritesheets/manager-sheet.png`)
}

export const loadManagerResources = async () => {
  const base = getAssetBase()
  const texture = Texture.from(`${base}/assets/spritesheets/manager-sheet.png`)
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
