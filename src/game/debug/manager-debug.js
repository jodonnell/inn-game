import {
  AnimationSet,
  AnimationState,
  Movement,
  SpriteRef,
  Transform,
} from "@/src/game/components.js"
import {
  DEFAULT_DIRECTION,
  INITIAL_POSITION,
} from "@/src/game/constants.js"
import { setIdleAnimation } from "@/src/game/animations/manager-animations.js"

export const computeManagerDebug = (registry, entity) => {
  const transform = registry.getComponent(entity, Transform)
  const movement = registry.getComponent(entity, Movement)
  const animationState = registry.getComponent(entity, AnimationState)

  return {
    x: transform?.x ?? null,
    y: transform?.y ?? null,
    direction: movement?.direction ?? null,
    animationKey: animationState?.currentKey ?? null,
  }
}

export const resetManagerState = (registry, entity) => {
  const transform = registry.getComponent(entity, Transform)
  const movement = registry.getComponent(entity, Movement)
  const spriteRef = registry.getComponent(entity, SpriteRef)
  const animationSet = registry.getComponent(entity, AnimationSet)
  const animationState = registry.getComponent(entity, AnimationState)

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
}
