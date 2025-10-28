import { test, expect } from "@playwright/test"

const readyGame = async (page) => {
  await page.goto("/")

  const canvas = page.locator("canvas").first()
  await expect(canvas).toBeVisible()
  await canvas.click()

  await page.waitForFunction(() => {
    const game = window.__innGame
    return Boolean(
      game &&
        game.scene?.world &&
        game.map?.container &&
        game.ecs?.entities?.manager !== undefined,
    )
  })
}

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
