import {
  AnimatedSprite,
  Assets,
  Spritesheet,
  Texture,
} from "pixi.js"
import managerAtlas from "@/assets/spritesheets/manager-sheet.json"
import managerSheetUrl from "@/assets/spritesheets/manager-sheet.png?url"
import { WALK_FPS } from "@/src/game/constants.js"
import {
  buildAnimations,
  pickInitialFrame,
} from "@/src/game/animations/manager-animations.js"

export const preloadManagerAssets = async () => {
  await Assets.load(managerSheetUrl)
}

export const loadManagerResources = async () => {
  const texture = Texture.from(managerSheetUrl)
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
