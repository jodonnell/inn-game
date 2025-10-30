import { Interactable } from "@/src/game/components.js"

export const createInteractions = (registry) => {
  const listeners = new Set()

  const findByTile = (tile) => {
    if (!tile) return null
    const { x, y } = tile
    if (typeof x !== "number" || typeof y !== "number") return null

    const entities = registry?.query?.(Interactable) ?? []
    for (const entity of entities) {
      const data = registry?.getComponent?.(entity, Interactable)
      if (!data) continue
      const componentTile = data.tile ?? {}
      if (componentTile.x === x && componentTile.y === y) {
        return entity
      }
    }
    return null
  }

  const trigger = (payload) => {
    for (const listener of listeners) {
      listener(payload)
    }
  }

  const subscribe = (listener) => {
    if (typeof listener !== "function") return () => {}
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const clear = () => {
    listeners.clear()
  }

  return {
    findByTile,
    trigger,
    subscribe,
    clear,
  }
}
