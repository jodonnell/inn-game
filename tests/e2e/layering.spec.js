import { test, expect } from "@playwright/test"
import { readyGame } from "./utils/game-helpers.js"

test.describe("Scene layering", () => {
  test("renders the map beneath the manager sprite", async ({ page }) => {
    await readyGame(page)

    const ordering = await page.evaluate(() => {
      const runtime = window.__innGame
      const world = runtime.scene.world
      const mapContainer = runtime.map.container

      const spriteRef = runtime.ecs.registry.getComponent(
        runtime.ecs.entities.manager,
        runtime.ecs.components.SpriteRef,
      )
      const managerSprite = spriteRef?.sprite ?? null

      return {
        mapIndex: world.children.indexOf(mapContainer),
        managerIndex: managerSprite
          ? world.children.indexOf(managerSprite)
          : -1,
      }
    })

    expect(ordering.mapIndex).toBeGreaterThanOrEqual(0)
    expect(ordering.managerIndex).toBeGreaterThan(ordering.mapIndex)
  })
})
