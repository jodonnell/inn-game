import { MapLayer } from "@/src/game/components.js"

export const createMapEntity = (registry, map) => {
  const entity = registry.createEntity()
  registry.addComponent(entity, MapLayer, map)
  return entity
}
