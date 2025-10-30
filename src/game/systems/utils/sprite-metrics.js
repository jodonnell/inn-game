export const computeSpriteMetrics = (sprite, map) => {
  const dimensions = map?.dimensions ?? {}
  const fallbackTileWidth = dimensions.tilewidth ?? 0
  const fallbackTileHeight = dimensions.tileheight ?? 0

  if (!sprite) {
    const footprintHeight = fallbackTileHeight > 0 ? fallbackTileHeight / 2 : 0
    return {
      width: fallbackTileWidth,
      height: footprintHeight,
      offsetX: 0,
      offsetY: fallbackTileHeight > 0 ? fallbackTileHeight - footprintHeight : 0,
    }
  }

  const width =
    sprite.width ??
    sprite?.texture?.frame?.width ??
    sprite?.texture?.width ??
    fallbackTileWidth
  const fullHeight =
    sprite.height ??
    sprite?.texture?.frame?.height ??
    sprite?.texture?.height ??
    fallbackTileHeight

  const collisionHeight = fullHeight > 0 ? fullHeight / 2 : 0

  return {
    width,
    height: collisionHeight,
    offsetX: 0,
    offsetY: fullHeight - collisionHeight,
  }
}

export const buildFootprint = ({ x, y, metrics }) => {
  if (!metrics) {
    return { x, y, width: 0, height: 0 }
  }

  return {
    x: (x ?? 0) + (metrics.offsetX ?? 0),
    y: (y ?? 0) + (metrics.offsetY ?? 0),
    width: metrics.width ?? 0,
    height: metrics.height ?? 0,
  }
}
