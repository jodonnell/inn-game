export const DEFAULT_SCENE_WIDTH = 1280
export const DEFAULT_SCENE_HEIGHT = 720

export const createSceneMetrics = ({
  baseWidth = DEFAULT_SCENE_WIDTH,
  baseHeight = DEFAULT_SCENE_HEIGHT,
} = {}) => {
  let viewportWidth = baseWidth
  let viewportHeight = baseHeight
  let scale = 1
  let offsetX = 0
  let offsetY = 0

  const compute = (width, height) => {
    const widthScale = width / baseWidth
    const heightScale = height / baseHeight
    const nextScale = Math.max(Math.min(widthScale, heightScale) || 1, 0.0001)
    const scaledWidth = baseWidth * nextScale
    const scaledHeight = baseHeight * nextScale

    return {
      scale: nextScale,
      offsetX: (width - scaledWidth) * 0.5,
      offsetY: (height - scaledHeight) * 0.5,
    }
  }

  const update = (nextWidth, nextHeight) => {
    viewportWidth = nextWidth ?? viewportWidth
    viewportHeight = nextHeight ?? viewportHeight
    const next = compute(viewportWidth, viewportHeight)
    scale = next.scale
    offsetX = next.offsetX
    offsetY = next.offsetY
    return get()
  }

  const get = () => ({
    baseWidth,
    baseHeight,
    viewportWidth,
    viewportHeight,
    scale,
    offsetX,
    offsetY,
  })

  return { get, update }
}
