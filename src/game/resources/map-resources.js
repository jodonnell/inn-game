import { Assets, Texture } from "pixi.js"
import rawMap from "@/assets/maps/inn.json"
import tileSheetUrl from "@/assets/spritesheets/tile-sheet.png?url"
import { extractInteractables } from "@/src/game/map/interactables.js"

const cloneMapData = () => JSON.parse(JSON.stringify(rawMap))

const buildTilesetMetadata = (map, texture) => {
  const [sourceTileset] = map.tilesets ?? []
  const firstgid = sourceTileset?.firstgid ?? 1
  const source = texture.source
  const textureWidth = source?.width ?? texture.width ?? 0
  const textureHeight = source?.height ?? texture.height ?? 0
  const tilewidth = map.tilewidth ?? 0
  const tileheight = map.tileheight ?? 0
  const columns =
    tilewidth > 0 ? Math.floor(textureWidth / tilewidth) : 0
  const rows = tileheight > 0 ? Math.floor(textureHeight / tileheight) : 0

  return {
    name: sourceTileset?.source ?? "tileset",
    tilewidth,
    tileheight,
    tilecount: columns * rows,
    columns,
    firstgid,
    image: {
      source: tileSheetUrl,
      width: textureWidth,
      height: textureHeight,
    },
  }
}

export const preloadMapAssets = async () => {
  await Assets.load(tileSheetUrl)
}

export const loadMapResources = async () => {
  const map = cloneMapData()
  const texture = Texture.from(tileSheetUrl)

  return {
    map,
    tileset: buildTilesetMetadata(map, texture),
    texture,
    interactables: extractInteractables(map),
  }
}
