import { test, expect } from "@playwright/test"

const readyGame = async (page) => {
  await page.goto("/")

  const canvas = page.locator("canvas").first()
  await expect(canvas).toBeVisible()
  await canvas.click()

  await page.waitForFunction(() => {
    const game = window.__innGame
    return Boolean(game && game.sprite)
  })
}

const readGameState = async (page) => {
  return page.evaluate(() => {
    const game = window.__innGame
    return {
      x: game?.sprite?.x ?? null,
      y: game?.sprite?.y ?? null,
      direction: game?.state?.direction ?? null,
      animationKey: game?.state?.animationKey ?? null,
    }
  })
}

const waitForAnimationKey = async (page, key) => {
  await page.waitForFunction(
    (expected) => window.__innGame?.state?.animationKey === expected,
    key,
  )
}

const pressArrow = async (page, key) => {
  await page.keyboard.down(key)
}

const releaseArrow = async (page, key) => {
  await page.keyboard.up(key)
}

test.describe("Manager movement", () => {
  test.beforeEach(async ({ page }) => {
    await readyGame(page)
  })

  test("starts facing down and idle", async ({ page }) => {
    const state = await readGameState(page)
    expect(state.direction).toBe("down")
    expect(state.animationKey).toBe("idle-down")
  })

  test("walks right and returns to idle", async ({ page }) => {
    const start = await readGameState(page)

    await pressArrow(page, "ArrowRight")
    await page.waitForFunction((x) => {
      const sprite = window.__innGame?.sprite
      return !!sprite && sprite.x > x
    }, start.x)

    await waitForAnimationKey(page, "walk-right")
    const walking = await readGameState(page)
    expect(walking.direction).toBe("right")
    expect(walking.animationKey).toBe("walk-right")

    await releaseArrow(page, "ArrowRight")
    await waitForAnimationKey(page, "idle-right")
    const idle = await readGameState(page)
    expect(idle.animationKey).toBe("idle-right")
    expect(idle.x).toBeGreaterThan(start.x ?? 0)
  })

  test("walks up and returns to idle", async ({ page }) => {
    const start = await readGameState(page)

    await pressArrow(page, "ArrowUp")
    await page.waitForFunction((y) => {
      const sprite = window.__innGame?.sprite
      return !!sprite && sprite.y < y
    }, start.y)

    await waitForAnimationKey(page, "walk-up")
    const walking = await readGameState(page)
    expect(walking.direction).toBe("up")
    expect(walking.animationKey).toBe("walk-up")

    await releaseArrow(page, "ArrowUp")
    await waitForAnimationKey(page, "idle-up")
    const idle = await readGameState(page)
    expect(idle.animationKey).toBe("idle-up")
    expect(idle.y).toBeLessThan(start.y ?? Number.MAX_SAFE_INTEGER)
  })
})
