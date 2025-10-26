import {
  DEFAULT_SCENE_HEIGHT,
  DEFAULT_SCENE_WIDTH,
  createSceneMetrics,
} from "@/src/draw/scene-metrics.js"

describe("createSceneMetrics", () => {
  it("uses defaults for the base resolution", () => {
    const metrics = createSceneMetrics()
    expect(metrics.get()).toMatchObject({
      baseWidth: DEFAULT_SCENE_WIDTH,
      baseHeight: DEFAULT_SCENE_HEIGHT,
      viewportWidth: DEFAULT_SCENE_WIDTH,
      viewportHeight: DEFAULT_SCENE_HEIGHT,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    })
  })

  it("computes scale and offsets preserving aspect ratio", () => {
    const metrics = createSceneMetrics({ baseWidth: 100, baseHeight: 50 })
    const updated = metrics.update(200, 100)
    expect(updated.scale).toBeCloseTo(2)
    expect(updated.offsetX).toBeCloseTo(0)
    expect(updated.offsetY).toBeCloseTo(0)
  })

  it("letterboxes when viewport is wider than base aspect", () => {
    const metrics = createSceneMetrics({ baseWidth: 100, baseHeight: 100 })
    const updated = metrics.update(400, 200)
    expect(updated.scale).toBeCloseTo(2)
    expect(updated.offsetX).toBeCloseTo(100)
    expect(updated.offsetY).toBeCloseTo(0)
  })

  it("letterboxes when viewport is taller than base aspect", () => {
    const metrics = createSceneMetrics({ baseWidth: 100, baseHeight: 100 })
    const updated = metrics.update(200, 400)
    expect(updated.scale).toBeCloseTo(2)
    expect(updated.offsetX).toBeCloseTo(0)
    expect(updated.offsetY).toBeCloseTo(100)
  })

  it("does not allow scale to collapse to zero", () => {
    const metrics = createSceneMetrics({ baseWidth: 100, baseHeight: 100 })
    const updated = metrics.update(0, 0)
    expect(updated.scale).toBeGreaterThan(0)
  })
})
