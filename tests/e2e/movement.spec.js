import { test, expect } from "@playwright/test"
import { readyGame } from "./utils/game-helpers.js"

const readGameState = async (page) => {
  return page.evaluate(() => {
    const debug = window.__innGame?.debug
    return {
      x: debug?.x ?? null,
      y: debug?.y ?? null,
      direction: debug?.direction ?? null,
      animationKey: debug?.animationKey ?? null,
    }
  })
}

const waitForAnimationKey = async (page, key) => {
  await page.waitForFunction(
    (expected) => window.__innGame?.debug?.animationKey === expected,
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
      const debug = window.__innGame?.debug
      return !!debug && debug.x > x
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
      const debug = window.__innGame?.debug
      return !!debug && debug.y < y
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
