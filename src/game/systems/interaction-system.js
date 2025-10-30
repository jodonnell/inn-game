import {
  Bell,
  InputState,
  Interactable,
  Movement,
  Transform,
} from "@/src/game/components.js"

const directionOffsets = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const getActorTile = (transform, map) => {
  if (!transform || !map) return null
  const dimensions = map.dimensions ?? {}
  const tilewidth = dimensions.tilewidth ?? 0
  const tileheight = dimensions.tileheight ?? 0
  if (tilewidth <= 0 || tileheight <= 0) return null

  const offsetX = map.container?.x ?? 0
  const offsetY = map.container?.y ?? 0

  const localX = transform.x - offsetX
  const localY = transform.y - offsetY

  return {
    x: Math.floor(localX / tilewidth),
    y: Math.floor(localY / tileheight),
  }
}

const advanceTile = (tile, direction) => {
  if (!tile) return null
  const offset =
    directionOffsets[direction] ?? directionOffsets.down

  return {
    x: tile.x + offset.x,
    y: tile.y + offset.y,
  }
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

    const actorTile = getActorTile(transform, map)
    const forwardTile = advanceTile(actorTile, movement?.direction)
    if (!forwardTile) return

    const target = interactions.findByTile(forwardTile)
    if (!target) return
    const data = registry?.getComponent?.(target, Interactable)
    if (!data) return

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
