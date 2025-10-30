const buildMetadata = (properties = []) => {
  const metadata = {}
  for (const property of properties) {
    if (!property || typeof property.name !== "string") continue
    metadata[property.name] = property.value
  }
  return metadata
}

const computeTileFromObject = (object, map) => {
  const tilewidth = map.tilewidth ?? 0
  const tileheight = map.tileheight ?? 0
  const baseX = object?.x ?? 0
  const baseY = object?.y ?? 0
  const height = object?.height ?? 0

  const tileX = tilewidth > 0 ? Math.floor(baseX / tilewidth) : 0
  const referenceY = height > 0 ? baseY - height : baseY
  const tileY = tileheight > 0 ? Math.floor(referenceY / tileheight) : 0

  return { x: tileX, y: tileY }
}

export const extractInteractables = (map) => {
  if (!map) return []
  const layers = map.layers ?? []
  const results = []

  for (const layer of layers) {
    if (layer?.type !== "objectgroup") continue
    for (const object of layer.objects ?? []) {
      const metadata = buildMetadata(object?.properties)
      const type = metadata.interaction
      if (!type) continue

      results.push({
        id: object.id,
        name: object.name ?? "",
        layer: layer.name ?? "",
        tile: computeTileFromObject(object, map),
        type,
        metadata,
      })
    }
  }

  return results
}
