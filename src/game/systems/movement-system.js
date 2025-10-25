import { Movement, Transform } from "@/src/game/components.js"
import { DEFAULT_DIRECTION } from "@/src/game/constants.js"

const resolveDirection = (dx, dy, fallback) => {
  if (dy !== 0) return dy < 0 ? "up" : "down"
  if (dx !== 0) return dx < 0 ? "left" : "right"
  return fallback
}

export const movementSystem = {
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
      movement.direction ?? DEFAULT_DIRECTION,
    )
    movement.direction = direction

    const length = Math.hypot(movement.dx, movement.dy) || 1
    const distance = movement.speed * delta

    transform.x += (movement.dx / length) * distance
    transform.y += (movement.dy / length) * distance
  },
}
