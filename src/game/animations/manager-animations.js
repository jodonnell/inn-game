import { Texture } from "pixi.js"
import {
  DEFAULT_DIRECTION,
  DIRECTION_SEGMENTS,
} from "@/src/game/constants.js"

const collectTextures = (spritesheet, segment) => {
  return Object.keys(spritesheet.textures)
    .filter((key) => key.includes(segment))
    .sort()
    .map((key) => spritesheet.textures[key])
}

export const buildAnimations = (spritesheet) => {
  return Object.fromEntries(
    Object.entries(DIRECTION_SEGMENTS).map(([direction, segments]) => {
      const walkTextures = collectTextures(spritesheet, segments.walk)
      const idleTextures = collectTextures(spritesheet, segments.idle)
      const idleTexture = idleTextures[0] ?? walkTextures[0] ?? Texture.EMPTY

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

export const pickInitialFrame = (animations) => {
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

export const setWalkAnimation = (sprite, variant) => {
  sprite.textures = variant.walk
  sprite.loop = true
  sprite.gotoAndPlay(0)
}

export const setIdleAnimation = (sprite, variant) => {
  const idleTexture = variant.idle ?? variant.walk[0] ?? Texture.EMPTY
  sprite.textures = [idleTexture]
  sprite.loop = false
  sprite.gotoAndStop(0)
}
