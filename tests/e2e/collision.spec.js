import { test, expect } from "@playwright/test"
import { readyGame, positionManager } from "./utils/game-helpers.js"

const getManagerState = async (page) => {
  return page.evaluate(() => {
    const runtime = window.__innGame
    const { registry } = runtime.ecs
    const { manager } = runtime.ecs.entities
    const { Transform, SpriteRef } = runtime.ecs.components

    const transform = registry.getComponent(manager, Transform)
    const spriteRef = registry.getComponent(manager, SpriteRef)
    const sprite = spriteRef?.sprite ?? null

    const spriteHeight =
      sprite?.height ??
      sprite?.texture?.frame?.height ??
      sprite?.texture?.height ??
      0

    return {
      x: transform?.x ?? null,
      y: transform?.y ?? null,
      spriteHeight,
    }
  })
}

const moveWithKey = async (page, key, duration = 400) => {
  await page.keyboard.down(key)
  await page.waitForTimeout(duration)
  await page.keyboard.up(key)
  await page.waitForTimeout(100)
}

test.describe("Collision detection", () => {
  test("allows the manager's head to overlap a ceiling while feet stay clear", async ({ page }) => {
    await readyGame(page)
    await positionManager(page, { x: 160, y: 160 })

    const before = await getManagerState(page)
    await moveWithKey(page, "ArrowUp", 500)
    const after = await getManagerState(page)

    expect(after.y).not.toBeNull()
    expect(after.y).toBeLessThan(before.y)
    expect(Math.round(after.y)).toBeGreaterThanOrEqual(32)

    if (after.spriteHeight > 0) {
      const halfHeight = after.spriteHeight / 2
      expect(after.y + halfHeight).toBeGreaterThan(64)
    }
  })

  test("blocks the manager from walking through solid walls", async ({ page }) => {
    await readyGame(page)
    await positionManager(page, { x: 160, y: 160 })

    const before = await getManagerState(page)
    await moveWithKey(page, "ArrowLeft", 600)
    const after = await getManagerState(page)

    expect(after.x).not.toBeNull()
    expect(after.x).toBeLessThan(before.x)
    expect(Math.round(after.x)).toBeGreaterThanOrEqual(64)
    expect(Math.abs(after.x - 64)).toBeLessThanOrEqual(12)
  })
})
