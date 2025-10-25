import { test, expect } from "@playwright/test"

const readPosition = async (page) => {
  return page.evaluate(() => {
    const game = window.__innGame
    return {
      x: game?.sprite?.x ?? null,
      y: game?.sprite?.y ?? null,
    }
  })
}

test.describe("Manager movement", () => {
  test("responds to arrow keys", async ({ page }) => {
    await page.goto("/")

    const canvas = page.locator("canvas").first()
    await expect(canvas).toBeVisible()
    await canvas.click()

    await page.waitForFunction(() => {
      const game = window.__innGame
      return Boolean(game && game.sprite)
    })

    const start = await readPosition(page)
    expect(start.x).not.toBeNull()
    expect(start.y).not.toBeNull()

    await page.keyboard.down("ArrowRight")
    await page.waitForFunction(
      (x) => {
        const sprite = window.__innGame?.sprite
        return !!sprite && sprite.x > x
      },
      start.x,
    )
    await page.keyboard.up("ArrowRight")

    const afterRight = await readPosition(page)
    expect(afterRight.x).toBeGreaterThan(start.x)
    expect(Math.abs(afterRight.y - start.y)).toBeLessThan(1)

    await page.keyboard.down("ArrowUp")
    await page.waitForFunction(
      (y) => {
        const sprite = window.__innGame?.sprite
        return !!sprite && sprite.y < y
      },
      afterRight.y,
    )
    await page.keyboard.up("ArrowUp")

    const afterUp = await readPosition(page)
    expect(afterUp.y).toBeLessThan(afterRight.y)
  })
})
