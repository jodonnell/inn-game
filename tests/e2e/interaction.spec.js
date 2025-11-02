import { test, expect } from "@playwright/test"
import {
  positionManager,
  readyGame,
  withBellMonitor,
} from "./utils/game-helpers.js"

const computeFootPlacement = async (page, tileOffset) => {
  return page.evaluate(({ tileOffset }) => {
    const runtime = window.__innGame
    if (!runtime) throw new Error("Runtime not available")

    const bell = runtime.map?.interactables?.find(
      (entry) => entry?.type === "bell",
    )
    if (!bell) throw new Error("Bell interactable not found")

    const tileWidth = runtime.map?.dimensions?.tilewidth ?? 32
    const tileHeight = runtime.map?.dimensions?.tileheight ?? 32
    const offsetX = runtime.map?.container?.x ?? 0
    const offsetY = runtime.map?.container?.y ?? 0

    const targetTileX = bell.tile?.x + tileOffset.x
    const targetTileY = bell.tile?.y + tileOffset.y
    if (targetTileX == null || targetTileY == null) {
      throw new Error("Bell tile coordinates missing")
    }

    const { registry, components, entities } = runtime.ecs ?? {}
    const manager = entities?.manager
    const spriteRef = registry?.getComponent?.(manager, components.SpriteRef)
    const sprite = spriteRef?.sprite

    const width =
      sprite?.width ??
      sprite?.texture?.frame?.width ??
      sprite?.texture?.width ??
      tileWidth
    const fullHeight =
      sprite?.height ??
      sprite?.texture?.frame?.height ??
      sprite?.texture?.height ??
      tileHeight
    const footprintHeight = fullHeight > 0 ? fullHeight / 2 : 0

    const offsetFootY = fullHeight - footprintHeight
    const centerX = offsetX + targetTileX * tileWidth + tileWidth / 2
    const footY = offsetY + (targetTileY + 1) * tileHeight - 1

    return {
      x: centerX - width / 2,
      y: footY - offsetFootY - footprintHeight,
    }
  }, { tileOffset })
}

const placeManagerBesideBell = async (page) => {
  const target = await computeFootPlacement(page, { x: -1, y: 0 })
  await positionManager(page, { ...target, direction: "right" })
}

const placeManagerBelowBell = async (page) => {
  const target = await computeFootPlacement(page, { x: 0, y: 1 })
  await positionManager(page, { ...target, direction: "up" })
}

const placeManagerAboveBell = async (page) => {
  const target = await computeFootPlacement(page, { x: 0, y: -1 })
  await positionManager(page, { ...target, direction: "down" })
}

const placeManagerRightOfBell = async (page) => {
  const target = await computeFootPlacement(page, { x: 1, y: 0 })
  await positionManager(page, { ...target, direction: "left" })
}

const waitForBellCount = async (
  page,
  expected,
  { comparator = "gte", description = `bell count ${comparator} ${expected}` } = {},
) => {
  try {
    await page.waitForFunction(
      ({ expectedCount, comparator: compare }) => {
        const count = typeof window.__bellCallCount === "number" ? window.__bellCallCount : 0
        if (compare === "eq") return count === expectedCount
        if (compare === "gt") return count > expectedCount
        if (compare === "lte") return count <= expectedCount
        if (compare === "lt") return count < expectedCount
        return count >= expectedCount
      },
      { expectedCount: expected, comparator },
      { timeout: 200 },
    )
  } catch (error) {
    const snapshot = await page.evaluate(() => {
      const runtime = window.__innGame
      const bell = runtime?.map?.interactables?.find(
        (entry) => entry?.type === "bell",
      )
      const map = runtime?.map
      const dimensions = map?.dimensions ?? {}
      const tilewidth = dimensions.tilewidth ?? 0
      const tileheight = dimensions.tileheight ?? 0
      const offsetX = map?.container?.x ?? 0
      const offsetY = map?.container?.y ?? 0
      const { registry, components, entities } = runtime?.ecs ?? {}
      const manager = entities?.manager
      const transform = registry?.getComponent?.(manager, components?.Transform)
      const spriteRef = registry?.getComponent?.(manager, components?.SpriteRef)
      const sprite = spriteRef?.sprite ?? null
      const width =
        sprite?.width ??
        sprite?.texture?.frame?.width ??
        sprite?.texture?.width ??
        tilewidth
      const fullHeight =
        sprite?.height ??
        sprite?.texture?.frame?.height ??
        sprite?.texture?.height ??
        tileheight
      const collisionHeight = fullHeight > 0 ? fullHeight / 2 : 0
      const footprintX = (transform?.x ?? 0) + 0
      const footprintY = (transform?.y ?? 0) + (fullHeight - collisionHeight)
      const centerX = footprintX + width / 2
      const footY = footprintY + collisionHeight - 1
      const localX = centerX - offsetX
      const localFootY = footY - offsetY
      const actorFootX = centerX
      const actorFootY = footY
      const bellFootX = offsetX + (bell?.tile?.x ?? 0) * tilewidth + tilewidth / 2
      const bellFootY = offsetY + ((bell?.tile?.y ?? 0) + 1) * tileheight - 1
      const actorTile =
        tilewidth > 0 && tileheight > 0
          ? {
              x: Math.floor(localX / tilewidth),
              y: Math.floor(localFootY / tileheight),
            }
          : null
      const distance = Math.hypot(bellFootX - actorFootX, bellFootY - actorFootY)
      return {
        count: window.__bellCallCount ?? 0,
        metadata: window.__bellLastMetadata ?? null,
        debug: runtime?.debug ?? null,
        bellTile: bell?.tile ?? null,
        actorTile,
        elapsed: window.__bellLastElapsed ?? null,
        actorFoot: { x: actorFootX, y: actorFootY },
        bellFoot: { x: bellFootX, y: bellFootY },
        distance,
      }
    })
    throw new Error(
      `${description} within 200ms not satisfied: ${JSON.stringify(snapshot)}`,
    )
  }
}

test.describe.configure({ mode: "serial" })

test.describe("Bell interaction", () => {
  test("rings the bell exactly once per press", async ({ page }) => {
    await readyGame(page, { waitForDebug: true })
    await placeManagerBesideBell(page)

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, { comparator: "eq", description: "bell count === 1" })
      await page.waitForTimeout(100)

      const { count, metadata } = await page.evaluate(() => ({
        count: window.__bellCallCount ?? 0,
        metadata: window.__bellLastMetadata,
      }))

      expect(count).toBe(1)
      expect(metadata?.interaction).toBe("bell")
    })
  })

  test("rings when the manager stands to the left of the bell and presses A", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    await placeManagerBesideBell(page)

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, {
        comparator: "gte",
        description: "bell count >= 1 (left-of-bell)",
      })
    })
  })

  test("rings when the manager stands at the predefined debug location", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    const targetBase = await computeFootPlacement(page, { x: 0, y: 0 })
    const targetPosition = {
      ...targetBase,
      direction: "up",
      animationKey: "idle-up",
    }

    await positionManager(page, targetPosition)

    await page.waitForFunction(
      ({ x, y, direction, animationKey }) => {
        const debug = window.__innGame?.debug
        if (!debug) return false
        const within = (value, expected) =>
          Math.abs((value ?? 0) - expected) < 0.01
        return (
          within(debug.x, x) &&
          within(debug.y, y) &&
          debug.direction === direction &&
          debug.animationKey === animationKey
        )
      },
      targetPosition,
    )

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, { comparator: "gte", description: "bell count >= 1" })
      const metadata = await page.evaluate(() => window.__bellLastMetadata)
      expect(metadata?.interaction).toBe("bell")
    })
  })

  test("rings when the manager stands at the predefined left-of-bell location", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    const targetBase = await computeFootPlacement(page, { x: -1, y: 0 })
    const targetPosition = {
      ...targetBase,
      direction: "right",
      animationKey: "idle-right",
    }

    await positionManager(page, targetPosition)

    await page.waitForFunction(
      ({ x, y, direction, animationKey }) => {
        const debug = window.__innGame?.debug
        if (!debug) return false
        const within = (value, expected) =>
          Math.abs((value ?? 0) - expected) < 0.01
        return (
          within(debug.x, x) &&
          within(debug.y, y) &&
          debug.direction === direction &&
          debug.animationKey === animationKey
        )
      },
      targetPosition,
    )

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, { comparator: "gte", description: "bell count >= 1" })
      const metadata = await page.evaluate(() => window.__bellLastMetadata)
      expect(metadata?.interaction).toBe("bell")
    })
  })

  test("rings when the manager stands at the predefined right-of-bell location", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    const targetBase = await computeFootPlacement(page, { x: 1, y: 0 })
    const targetPosition = {
      ...targetBase,
      direction: "left",
      animationKey: "idle-left",
    }

    await positionManager(page, targetPosition)

    await page.waitForFunction(
      ({ x, y, direction, animationKey }) => {
        const debug = window.__innGame?.debug
        if (!debug) return false
        const within = (value, expected) =>
          Math.abs((value ?? 0) - expected) < 0.01
        return (
          within(debug.x, x) &&
          within(debug.y, y) &&
          debug.direction === direction &&
          debug.animationKey === animationKey
        )
      },
      targetPosition,
    )

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, { comparator: "gte", description: "bell count >= 1" })
      const metadata = await page.evaluate(() => window.__bellLastMetadata)
      expect(metadata?.interaction).toBe("bell")
    })
  })

  test("does not ring when the manager stands above the bell facing away", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    const targetPosition = {
      x: 381.40825293108605,
      y: 108.64094115100276,
      direction: "up",
      animationKey: "idle-up",
    }

    await positionManager(page, targetPosition)

    await page.waitForFunction(
      ({ x, y, direction, animationKey }) => {
        const debug = window.__innGame?.debug
        if (!debug) return false
        const within = (value, expected) =>
          Math.abs((value ?? 0) - expected) < 0.01
        return (
          within(debug.x, x) &&
          within(debug.y, y) &&
          debug.direction === direction &&
          debug.animationKey === animationKey
        )
      },
      targetPosition,
    )

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await page.waitForTimeout(200)
      const result = await page.evaluate(() => ({
        count: window.__bellCallCount ?? 0,
        metadata: window.__bellLastMetadata ?? null,
      }))
      expect(result).toEqual({ count: 0, metadata: null })
    })
  })

  test("rings when the manager stands at a reachable left-of-bell spot", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    const targetPosition = {
      x: 350.8188614792593,
      y: 152.63958971361726,
      direction: "right",
      animationKey: "idle-right",
    }

    await positionManager(page, targetPosition)

    await page.waitForFunction(
      ({ x, y, direction, animationKey }) => {
        const debug = window.__innGame?.debug
        if (!debug) return false
        const within = (value, expected) =>
          Math.abs((value ?? 0) - expected) < 0.01
        return (
          within(debug.x, x) &&
          within(debug.y, y) &&
          debug.direction === direction &&
          debug.animationKey === animationKey
        )
      },
      targetPosition,
    )

    const proximity = await page.evaluate(() => {
      const runtime = window.__innGame
      const bell = runtime?.map?.interactables?.find(
        (entry) => entry?.type === "bell",
      )
      const map = runtime?.map
      const dimensions = map?.dimensions ?? {}
      const tilewidth = dimensions.tilewidth ?? 0
      const tileheight = dimensions.tileheight ?? 0
      const offsetX = map?.container?.x ?? 0
      const offsetY = map?.container?.y ?? 0
      const { registry, components, entities } = runtime?.ecs ?? {}
      const manager = entities?.manager
      const transform = registry?.getComponent?.(manager, components?.Transform)
      const spriteRef = registry?.getComponent?.(manager, components?.SpriteRef)
      const sprite = spriteRef?.sprite ?? null
      const width =
        sprite?.width ??
        sprite?.texture?.frame?.width ??
        sprite?.texture?.width ??
        tilewidth
      const fullHeight =
        sprite?.height ??
        sprite?.texture?.frame?.height ??
        sprite?.texture?.height ??
        tileheight
      const collisionHeight = fullHeight > 0 ? fullHeight / 2 : 0
      const footprintX = (transform?.x ?? 0) + 0
      const footprintY = (transform?.y ?? 0) + (fullHeight - collisionHeight)
      const actorFootX = footprintX + width / 2
      const actorFootY = footprintY + collisionHeight - 1
      const bellCenterX =
        offsetX + (bell?.tile?.x ?? 0) * tilewidth + tilewidth / 2
      const bellFootY =
        offsetY + ((bell?.tile?.y ?? 0) + 1) * tileheight - 1
      const deltaX = bellCenterX - actorFootX
      const deltaY = bellFootY - actorFootY
      const halfWidth = tilewidth / 2
      const verticalExtent = tileheight
      const horizontalGap = Math.max(0, Math.abs(deltaX) - halfWidth)
      const verticalGap = Math.max(0, Math.abs(deltaY) - verticalExtent)
      const distance = Math.hypot(horizontalGap, verticalGap)
      return {
        actorFoot: { x: actorFootX, y: actorFootY },
        bellFoot: { x: bellCenterX, y: bellFootY },
        horizontalGap,
        verticalGap,
        distance,
      }
    })
    expect(proximity.horizontalGap).toBeLessThanOrEqual(18)
    expect(proximity.verticalGap).toBeLessThanOrEqual(16)

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, {
        comparator: "gte",
        description: "bell count >= 1 (reachable left-of-bell)",
      })
    })
  })

  test("rings when the manager stands at a reachable below-bell spot", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    const targetPosition = {
      x: 382.62066752471446,
      y: 193.0151481293354,
      direction: "up",
      animationKey: "idle-up",
    }

    await positionManager(page, targetPosition)

    await page.waitForFunction(
      ({ x, y, direction, animationKey }) => {
        const debug = window.__innGame?.debug
        if (!debug) return false
        const within = (value, expected) =>
          Math.abs((value ?? 0) - expected) < 0.01
        return (
          within(debug.x, x) &&
          within(debug.y, y) &&
          debug.direction === direction &&
          debug.animationKey === animationKey
        )
      },
      targetPosition,
    )

    const proximity = await page.evaluate(() => {
      const runtime = window.__innGame
      const bell = runtime?.map?.interactables?.find(
        (entry) => entry?.type === "bell",
      )
      const map = runtime?.map
      const dimensions = map?.dimensions ?? {}
      const tilewidth = dimensions.tilewidth ?? 0
      const tileheight = dimensions.tileheight ?? 0
      const offsetX = map?.container?.x ?? 0
      const offsetY = map?.container?.y ?? 0
      const { registry, components, entities } = runtime?.ecs ?? {}
      const manager = entities?.manager
      const transform = registry?.getComponent?.(manager, components?.Transform)
      const spriteRef = registry?.getComponent?.(manager, components?.SpriteRef)
      const sprite = spriteRef?.sprite ?? null
      const width =
        sprite?.width ??
        sprite?.texture?.frame?.width ??
        sprite?.texture?.width ??
        tilewidth
      const fullHeight =
        sprite?.height ??
        sprite?.texture?.frame?.height ??
        sprite?.texture?.height ??
        tileheight
      const collisionHeight = fullHeight > 0 ? fullHeight / 2 : 0
      const footprintX = transform?.x ?? 0
      const footprintOffsetY = fullHeight - collisionHeight
      const footprintY = (transform?.y ?? 0) + footprintOffsetY
      const actorRect = {
        left: footprintX,
        right: footprintX + width,
        top: footprintY - footprintOffsetY,
        bottom: footprintY + collisionHeight,
      }
      const tileRect = {
        left: offsetX + (bell?.tile?.x ?? 0) * tilewidth,
        right: offsetX + ((bell?.tile?.x ?? 0) + 1) * tilewidth,
        top: offsetY + (bell?.tile?.y ?? 0) * tileheight,
        bottom: offsetY + ((bell?.tile?.y ?? 0) + 1) * tileheight,
      }
      const horizontalGap = Math.max(
        0,
        tileRect.left - actorRect.right,
        actorRect.left - tileRect.right,
      )
      const verticalGap = Math.max(
        0,
        tileRect.top - actorRect.bottom,
        actorRect.top - tileRect.bottom,
      )
      return {
        horizontalGap,
        verticalGap,
      }
    })
    expect(proximity.horizontalGap).toBeLessThanOrEqual(16)
    expect(proximity.verticalGap).toBeLessThanOrEqual(16)

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, {
        comparator: "gte",
        description: "bell count >= 1 (reachable below-bell)",
      })
    })
  })

  test("rings when approaching from each adjacent side", async ({ page }) => {
    await readyGame(page, { waitForDebug: true })

    const placements = [
      placeManagerBesideBell,
      placeManagerRightOfBell,
      placeManagerAboveBell,
      placeManagerBelowBell,
    ]

    for (const place of placements) {
      await place(page)
      await withBellMonitor(page, async () => {
        await page.keyboard.press("KeyA")
        await waitForBellCount(page, 1, { comparator: "gte", description: "bell count >= 1" })
      })
    }
  })
})
