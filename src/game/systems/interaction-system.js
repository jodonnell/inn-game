import {
  Bell,
  InputState,
  Interactable,
  Movement,
  SpriteRef,
  Transform,
} from "@/src/game/components.js"
import {
  buildFootprint,
  computeSpriteMetrics,
} from "@/src/game/systems/utils/sprite-metrics.js"

const directionOffsets = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const getActorTile = (transform, map, sprite) => {
  if (!transform || !map) return null
  const dimensions = map.dimensions ?? {}
  const tilewidth = dimensions.tilewidth ?? 0
  const tileheight = dimensions.tileheight ?? 0
  if (tilewidth <= 0 || tileheight <= 0) return null

  const metrics = computeSpriteMetrics(sprite, map)
  const footprint = buildFootprint({
    x: transform.x,
    y: transform.y,
    metrics,
  })

  const offsetX = map.container?.x ?? 0
  const offsetY = map.container?.y ?? 0

  const centerX = footprint.x + footprint.width / 2
  const footY = footprint.y + footprint.height - 1
  const localX = centerX - offsetX
  const localFootY = footY - offsetY

  return {
    x: Math.floor(localX / tilewidth),
    y: Math.floor(localFootY / tileheight),
  }
}

const MAX_FACING_DISTANCE = 3
const MAX_INTERACTION_DISTANCE = 16
const INTERACTION_DISTANCE_TOLERANCE = 4

const collectCandidateTiles = (actorTile, facing, maxDistance = 1) => {
  if (!actorTile) return []

  const candidates = []
  const seen = new Set()
  const add = (tile) => {
    if (!tile) return
    const key = `${tile.x},${tile.y}`
    if (seen.has(key)) return
    seen.add(key)
    candidates.push(tile)
  }

  if (facing && directionOffsets[facing]) {
    const offset = directionOffsets[facing]
    const limit = Number.isFinite(maxDistance) ? Math.max(1, maxDistance) : 1
    const perpendicularOffsets =
      facing === "up" || facing === "down"
        ? [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
          ]
        : [
            { x: 0, y: 1 },
            { x: 0, y: -1 },
        ]

    for (let step = 1; step <= limit; step += 1) {
      const forwardTile = {
        x: actorTile.x + offset.x * step,
        y: actorTile.y + offset.y * step,
      }
      add(forwardTile)

      const lateralLimit = limit
      for (let lateral = 1; lateral <= lateralLimit; lateral += 1) {
        for (const perp of perpendicularOffsets) {
          add({
            x: forwardTile.x + perp.x * lateral,
            y: forwardTile.y + perp.y * lateral,
          })
        }
      }
    }
  }

  const addAdjacentTiles = () => {
    for (const offset of Object.values(directionOffsets)) {
      add({ x: actorTile.x + offset.x, y: actorTile.y + offset.y })
    }
  }

  add(actorTile)
  addAdjacentTiles()

  return candidates
}

const clearIntent = (justPressed, code) => {
  if (!Array.isArray(justPressed)) return
  for (let i = justPressed.length - 1; i >= 0; i -= 1) {
    if (justPressed[i] === code) {
      justPressed.splice(i, 1)
    }
  }
}

export const interactionSystem = {
  name: "interaction",
  components: [InputState, Movement, Transform],
  update({
    entity,
    components: {
      InputState: input,
      Movement: movement,
      Transform: transform,
    },
    registry,
    context,
  }) {
    const intents = input?.justPressed
    if (!Array.isArray(intents) || intents.length === 0) return
    if (!intents.includes("KeyA")) return

    clearIntent(intents, "KeyA")

    const interactions = context?.interactions
    const map = context?.map
    if (!interactions?.findByTile || typeof interactions.findByTile !== "function") {
      return
    }

    const spriteRef = registry?.getComponent?.(entity, SpriteRef)
    const sprite = spriteRef?.sprite ?? null
    const actorTile = getActorTile(transform, map, sprite)
    const tileDimensions = map?.dimensions ?? {}
    const tileWidth = tileDimensions.tilewidth ?? 0
    const tileHeight = tileDimensions.tileheight ?? 0
    const mapOffsetX = map?.container?.x ?? 0
    const mapOffsetY = map?.container?.y ?? 0
    const metrics = computeSpriteMetrics(sprite, map)
    const footprint = buildFootprint({
      x: transform?.x ?? 0,
      y: transform?.y ?? 0,
      metrics,
    })
    const footprintWidth = footprint.width ?? 0
    const footprintHeight = footprint.height ?? 0
    const footprintOffsetY = metrics?.offsetY ?? 0
    const actorRect = {
      left: footprint.x,
      right: footprint.x + footprintWidth,
      top: footprint.y - footprintOffsetY,
      bottom: footprint.y + footprintHeight,
    }
    const actorFoot = {
      x: footprint.x + (footprint.width ?? 0) / 2,
      y: footprint.y + (footprint.height ?? 0),
    }
    const candidates = collectCandidateTiles(
      actorTile,
      movement?.direction,
      MAX_FACING_DISTANCE,
    )
    const facingOffset =
      movement?.direction && directionOffsets[movement.direction]

    let target = null
    let data = null

    for (const tile of candidates) {
      let targetFootX = null
      let targetFootY = null
      let deltaX = null
      let deltaY = null

      const canMeasure =
        Number.isFinite(actorFoot.x) &&
        Number.isFinite(actorFoot.y) &&
        Number.isFinite(tileWidth) &&
        Number.isFinite(tileHeight) &&
        tileWidth > 0 &&
        tileHeight > 0

      if (canMeasure) {
        const tileLeft = mapOffsetX + tile.x * tileWidth
        const tileTop = mapOffsetY + tile.y * tileHeight
        const tileRight = tileLeft + tileWidth
        const tileBottom = tileTop + tileHeight
        targetFootX = tileLeft + tileWidth / 2
        targetFootY = tileBottom
        deltaX = targetFootX - actorFoot.x
        deltaY = targetFootY - actorFoot.y

        const horizontalGap = Math.max(
          0,
          tileLeft - (actorRect.right ?? actorFoot.x),
          (actorRect.left ?? actorFoot.x) - tileRight,
        )
        const verticalGap = Math.max(
          0,
          tileTop - (actorRect.bottom ?? actorFoot.y),
          (actorRect.top ?? actorFoot.y) - tileBottom,
        )

        const distance = Math.hypot(horizontalGap, verticalGap)
        if (
          distance >
          MAX_INTERACTION_DISTANCE + INTERACTION_DISTANCE_TOLERANCE
        ) {
          continue
        }
      }

      if (facingOffset && canMeasure) {
        const dot = deltaX * facingOffset.x + deltaY * facingOffset.y
        if (dot < -INTERACTION_DISTANCE_TOLERANCE) continue
      }

      const candidate = interactions.findByTile(tile)
      if (!candidate) continue
      const component = registry?.getComponent?.(candidate, Interactable)
      if (!component) continue
      target = candidate
      data = component
      break
    }

    if (!target || !data) return

    interactions.trigger?.({
      actor: entity,
      target,
      data,
    })

    const isBell =
      registry?.hasComponent?.(target, Bell) ||
      data?.metadata?.interaction === "bell"

    if (isBell && typeof context?.audio?.playBell === "function") {
      context.audio.playBell(data?.metadata ?? {})
    }
  },
}
