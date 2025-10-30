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

const collectCandidateTiles = (actorTile, facing) => {
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
    add({ x: actorTile.x + offset.x, y: actorTile.y + offset.y })
  }

  add(actorTile)

  for (const offset of Object.values(directionOffsets)) {
    add({ x: actorTile.x + offset.x, y: actorTile.y + offset.y })
  }

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
    const actorTile = getActorTile(transform, map, spriteRef?.sprite ?? null)
    const candidates = collectCandidateTiles(actorTile, movement?.direction)

    let target = null
    let data = null

    for (const tile of candidates) {
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
