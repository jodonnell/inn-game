import { Movement, SpriteRef, Transform } from "@/src/game/components.js"
import { DEFAULT_DIRECTION } from "@/src/game/constants.js"

const resolveDirection = (dx, dy, fallback) => {
  if (dy !== 0) return dy < 0 ? "up" : "down"
  if (dx !== 0) return dx < 0 ? "left" : "right"
  return fallback
}

const getSpriteMetrics = (sprite, map) => {
  if (!sprite) {
    const fallback = map?.dimensions ?? {}
    const fallbackHeight = fallback.tileheight ?? 0
    return {
      width: fallback.tilewidth ?? 0,
      height: fallbackHeight > 0 ? fallbackHeight / 2 : 0,
      offsetX: 0,
      offsetY: fallbackHeight > 0 ? fallbackHeight / 2 : 0,
    }
  }

  const width =
    sprite.width ??
    sprite?.texture?.frame?.width ??
    sprite?.texture?.width ??
    map?.dimensions?.tilewidth ??
    0
  const fullHeight =
    sprite.height ??
    sprite?.texture?.frame?.height ??
    sprite?.texture?.height ??
    map?.dimensions?.tileheight ??
    0

  const collisionHeight = fullHeight > 0 ? fullHeight / 2 : 0

  return {
    width,
    height: collisionHeight,
    offsetX: 0,
    offsetY: fullHeight - collisionHeight,
  }
}

const rectsIntersect = (a, b) => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

const buildFootprint = ({ x, y, metrics }) => ({
  x: x + metrics.offsetX,
  y: y + metrics.offsetY,
  width: metrics.width,
  height: metrics.height,
})

const willCollide = ({ nextX, nextY, collisions, metrics, offset }) => {
  if (!collisions || collisions.length === 0) return false
  const footprint = buildFootprint({
    x: nextX,
    y: nextY,
    metrics,
  })

  const mapOffsetX = offset?.x ?? 0
  const mapOffsetY = offset?.y ?? 0

  for (const collision of collisions) {
    const adjusted = {
      x: (collision.x ?? 0) + mapOffsetX,
      y: (collision.y ?? 0) + mapOffsetY,
      width: collision.width ?? 0,
      height: collision.height ?? 0,
    }
    if (rectsIntersect(footprint, adjusted)) {
      return true
    }
  }

  return false
}

export const movementSystem = {
  name: "movement",
  components: [Movement, Transform, SpriteRef],
  update({
    components: { Movement: movement, Transform: transform, SpriteRef: spriteRef },
    delta,
    context,
  }) {
    if (!movement.moving) return

    const direction = resolveDirection(
      movement.dx,
      movement.dy,
      movement.direction ?? DEFAULT_DIRECTION,
    )
    movement.direction = direction

    const length = Math.hypot(movement.dx, movement.dy) || 1
    const distance = movement.speed * delta
    const stepX = (movement.dx / length) * distance
    const stepY = (movement.dy / length) * distance

    const map = context?.map ?? null
    const collisions = map?.collisions ?? []
    const metrics = getSpriteMetrics(spriteRef?.sprite ?? null, map)
    const mapOffset = map?.container
      ? { x: map.container.x ?? 0, y: map.container.y ?? 0 }
      : { x: 0, y: 0 }

    let nextX = transform.x + stepX
    let nextY = transform.y

    if (stepX !== 0 && collisions.length > 0 && metrics.width > 0 && metrics.height > 0) {
      if (
        willCollide({
          nextX,
          nextY,
          collisions,
          metrics,
          offset: mapOffset,
        })
      ) {
        nextX = transform.x
      }
    }

    nextY = transform.y + stepY
    if (stepY !== 0 && collisions.length > 0 && metrics.width > 0 && metrics.height > 0) {
      if (
        willCollide({
          nextX,
          nextY,
          collisions,
          metrics,
          offset: mapOffset,
        })
      ) {
        nextY = transform.y
      }
    }

    transform.x = nextX
    transform.y = nextY
  },
}
