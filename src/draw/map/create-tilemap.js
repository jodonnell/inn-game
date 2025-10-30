import { Container, Matrix, Rectangle, Sprite, Texture } from "pixi.js"
import { extractInteractables } from "@/src/game/map/interactables.js"

const FLIP_HORIZONTAL_FLAG = 0x80000000
const FLIP_VERTICAL_FLAG = 0x40000000
const FLIP_DIAGONAL_FLAG = 0x20000000
const TILE_ID_MASK = 0x1fffffff

const decodeGlobalId = (value) => {
  const gid = (value ?? 0) >>> 0
  return {
    id: gid & TILE_ID_MASK,
    flips: {
      horizontal: (gid & FLIP_HORIZONTAL_FLAG) !== 0,
      vertical: (gid & FLIP_VERTICAL_FLAG) !== 0,
      diagonal: (gid & FLIP_DIAGONAL_FLAG) !== 0,
    },
  }
}

const createTextureLookup = ({ texture, tileset, tilewidth, tileheight }) => {
  const cache = new Map()
  const source = texture.source
  const atlasWidth = source?.width ?? texture.width ?? tilewidth

  const columns =
    tileset.columns > 0
      ? tileset.columns
      : Math.floor((tileset.image?.width ?? atlasWidth) / tilewidth)

  return (localId) => {
    if (localId < 0) return null
    if (cache.has(localId)) return cache.get(localId)

    const column = localId % columns
    const row = Math.floor(localId / columns)
    const frame = new Rectangle(
      column * tilewidth,
      row * tileheight,
      tilewidth,
      tileheight,
    )

    const tileTexture = new Texture({ source, frame })
    cache.set(localId, tileTexture)
    return tileTexture
  }
}

const buildTransformMatrix = ({
  flips: { horizontal, vertical, diagonal },
  tilewidth,
  tileheight,
  x,
  y,
}) => {
  const matrix = new Matrix()

  if (diagonal) {
    matrix.append(new Matrix(0, 1, 1, 0, 0, 0))
  }

  if (horizontal) {
    matrix.append(new Matrix(-1, 0, 0, 1, tilewidth, 0))
  }

  if (vertical) {
    matrix.append(new Matrix(1, 0, 0, -1, 0, tileheight))
  }

  matrix.translate(x, y)
  return matrix
}

const applyMatrixToSprite = (sprite, matrix) => {
  if (typeof sprite.setFromMatrix === "function") {
    sprite.setFromMatrix(matrix)
  } else if (sprite.transform && typeof sprite.transform.setFromMatrix === "function") {
    sprite.transform.setFromMatrix(matrix)
  } else {
    sprite.position.set(matrix.tx, matrix.ty)
    sprite.scale.set(matrix.a, matrix.d)
    sprite.skew.set(0, 0)
    sprite.rotation = 0
  }
}

const createTileLayer = ({
  layer,
  map,
  tileset,
  textureLookup,
}) => {
  const layerContainer = new Container()
  layerContainer.label = layer.name ?? "tile-layer"

  const data = layer.data ?? []
  const layerWidth = layer.width ?? map.width ?? 0

  data.forEach((rawGid, index) => {
    if (!rawGid) return

    const decoded = decodeGlobalId(rawGid)
    if (!decoded.id) return

    const localId = decoded.id - tileset.firstgid
    const tileTexture = textureLookup(localId)
    if (!tileTexture) return

    const sprite = new Sprite(tileTexture)
    const column = index % layerWidth
    const row = Math.floor(index / layerWidth)
    const baseX = column * map.tilewidth
    const baseY = row * map.tileheight

    const transform = buildTransformMatrix({
      flips: decoded.flips,
      tilewidth: map.tilewidth,
      tileheight: map.tileheight,
      x: baseX,
      y: baseY,
    })

    applyMatrixToSprite(sprite, transform)
    layerContainer.addChild(sprite)
  })

  return layerContainer
}

const extractCollisions = (layer) => {
  const objects = layer.objects ?? []
  return objects
    .filter((object) =>
      (object.properties ?? []).some(
        (property) => property.name === "collision" && property.value === true,
      ),
    )
    .map((object) => ({
      id: object.id,
      name: object.name ?? "",
      x: object.x,
      y: object.y,
      width: object.width ?? 0,
      height: object.height ?? 0,
      rotation: object.rotation ?? 0,
      visible: object.visible ?? true,
    }))
}

export const createTilemap = ({ map, tileset, texture }) => {
  const container = new Container()
  container.label = map.name ?? "tilemap"
  container.zIndex = 0

  const textureLookup = createTextureLookup({
    texture,
    tileset,
    tilewidth: map.tilewidth,
    tileheight: map.tileheight,
  })

  const layers = []
  const collisions = []
  const interactables = extractInteractables(map)

  for (const layer of map.layers ?? []) {
    if (layer.type === "tilelayer") {
      const tileLayer = createTileLayer({
        layer,
        map,
        tileset,
        textureLookup,
      })
      container.addChild(tileLayer)
      layers.push({ ...layer, container: tileLayer })
    } else if (layer.type === "objectgroup") {
      const objects = extractCollisions(layer)
      if (objects.length > 0) {
        collisions.push(...objects)
      }
      layers.push({ ...layer, objects })
    }
  }

  return {
    container,
    collisions,
    interactables,
    layers,
    dimensions: {
      tilewidth: map.tilewidth,
      tileheight: map.tileheight,
      width: map.width,
      height: map.height,
    },
  }
}
