import { Texture } from "pixi.js"
import {
  AnimationSet,
  AnimationState,
  InputState,
  Movement,
  SpriteRef,
  Transform,
} from "@/src/game/components.js"
import {
  DEFAULT_DIRECTION,
  INITIAL_POSITION,
  MOVE_SPEED,
} from "@/src/game/constants.js"
import { setIdleAnimation } from "@/src/game/animations/manager-animations.js"

export const createManagerEntity = (registry, { sprite, animations, keyboard }) => {
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
  if (animationState) {
    animationState.currentKey = `idle-${DEFAULT_DIRECTION}`
  }

  sprite.x = INITIAL_POSITION.x
  sprite.y = INITIAL_POSITION.y

  return entity
}
