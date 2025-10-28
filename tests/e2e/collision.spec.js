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

const setManagerPosition = async (page, { x, y }) => {
  await page.evaluate(({ x: nextX, y: nextY }) => {
    const runtime = window.__innGame
    const { registry } = runtime.ecs
    const { manager } = runtime.ecs.entities
    const { Transform, SpriteRef, Movement } = runtime.ecs.components

    const transform = registry.getComponent(manager, Transform)
    if (transform) {
      transform.x = nextX
      transform.y = nextY
    }

    const spriteRef = registry.getComponent(manager, SpriteRef)
    if (spriteRef?.sprite) {
      spriteRef.sprite.x = nextX
      spriteRef.sprite.y = nextY
    }

    const movement = registry.getComponent(manager, Movement)
    if (movement) {
      movement.dx = 0
      movement.dy = 0
      movement.moving = false
    }
  }, { x, y })
}

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
    await setManagerPosition(page, { x: 160, y: 160 })

    const before = await getManagerState(page)
    await moveWithKey(page, "ArrowUp", 500)
    const after = await getManagerState(page)

    expect(after.y).not.toBeNull()
    expect(after.y).toBeLessThan(before.y)
    expect(Math.round(after.y)).toBeGreaterThanOrEqual(32)
    expect(Math.round(after.y)).toBeLessThan(64)

    if (after.spriteHeight > 0) {
      const halfHeight = after.spriteHeight / 2
      expect(after.y + halfHeight).toBeGreaterThan(64)
    }
  })

  test("blocks the manager from walking through solid walls", async ({ page }) => {
    await readyGame(page)
    await setManagerPosition(page, { x: 160, y: 160 })

    const before = await getManagerState(page)
    await moveWithKey(page, "ArrowLeft", 600)
    const after = await getManagerState(page)

    expect(after.x).not.toBeNull()
    expect(after.x).toBeLessThan(before.x)
    expect(Math.round(after.x)).toBeGreaterThanOrEqual(64)
    expect(Math.abs(after.x - 64)).toBeLessThanOrEqual(12)
  })
})
