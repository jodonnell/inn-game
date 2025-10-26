import { Application, Container } from "pixi.js"
import {
  DEFAULT_SCENE_HEIGHT,
  DEFAULT_SCENE_WIDTH,
  createSceneMetrics,
} from "@/src/draw/scene-metrics.js"

export const createScene = async ({
  baseWidth = DEFAULT_SCENE_WIDTH,
  baseHeight = DEFAULT_SCENE_HEIGHT,
  background = "#000000",
  resizeTo = globalThis.window,
} = {}) => {
  const app = new Application()
  await app.init({ background, resizeTo })

  const world = new Container()
  const metrics = createSceneMetrics({ baseWidth, baseHeight })

  const applySceneMetrics = (width = app.screen.width, height = app.screen.height) => {
    const { scale, offsetX, offsetY } = metrics.update(width, height)
    world.scale.set(scale)
    world.position.set(offsetX, offsetY)
  }

  const handleResize = (width, height) => {
    applySceneMetrics(width, height)
  }

  app.renderer.on("resize", handleResize)
  applySceneMetrics()

  app.stage.addChild(world)

  if (globalThis.document && app.canvas && !app.canvas.parentNode) {
    globalThis.document.body.appendChild(app.canvas)
  }

  const dispose = () => {
    app.renderer.off("resize", handleResize)
  }

  return {
    app,
    world,
    metrics,
    dispose,
  }
}
