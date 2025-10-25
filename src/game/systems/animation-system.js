import {
  AnimationSet,
  AnimationState,
  Movement,
  SpriteRef,
} from "@/src/game/components.js"
import { DEFAULT_DIRECTION } from "@/src/game/constants.js"
import {
  setIdleAnimation,
  setWalkAnimation,
} from "@/src/game/animations/manager-animations.js"

export const animationSystem = {
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
