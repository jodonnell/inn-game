import { test, expect } from "@playwright/test"

test.describe("Game shell", () => {
  test("renders Pixi canvas", async ({ page }) => {
    const consoleErrors = []
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text())
      }
    })
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message)
    })

    await page.goto("/")

    const canvas = page.locator("canvas").first()
    await expect(canvas).toBeVisible()

    const box = await canvas.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(0)
    expect(box?.height ?? 0).toBeGreaterThan(0)

    expect(consoleErrors).toEqual([])
  })
})
