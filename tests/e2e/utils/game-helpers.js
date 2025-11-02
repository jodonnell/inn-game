import { expect } from "@playwright/test"

export const readyGame = async (
  page,
  { waitForDebug = false, muteAudio = true } = {},
) => {
  await page.goto("/")

  await page.waitForSelector("canvas", { timeout: 15000 })
  const canvas = page.locator("canvas").first()
  await expect(canvas).toBeVisible({ timeout: 15000 })
  await canvas.click()

  await page.waitForFunction(
    (requireDebug) => {
      const game = window.__innGame
      if (!game) return false

      const hasScene = Boolean(game.scene?.world && game.map?.container)
      const hasManager = game.ecs?.entities?.manager !== undefined
      if (!hasScene || !hasManager) return false

      if (requireDebug) {
        return Boolean(game.debug)
      }

      return true
    },
    waitForDebug,
  )

  if (muteAudio) {
    await page.evaluate(() => {
      if (window.Howler?.mute) {
        window.Howler.mute(true)
      }
    })
  }
}

export const positionManager = async (
  page,
  { x, y, direction = null, animationKey = null } = {},
) => {
  await page.evaluate(
    ({ x: nextX, y: nextY, direction: nextDirection, animationKey: nextAnimationKey }) => {
      const runtime = window.__innGame
      if (!runtime) throw new Error("Runtime not available")

      const { registry, components, entities } = runtime.ecs ?? {}
      if (!registry || !components || !entities) {
        throw new Error("ECS context missing")
      }

      const manager = entities.manager
      const transform = registry.getComponent(manager, components.Transform)
      const spriteRef = registry.getComponent(manager, components.SpriteRef)
      const movement = registry.getComponent(manager, components.Movement)
      const animationState = registry.getComponent(
        manager,
        components.AnimationState,
      )

      if (transform) {
        if (typeof nextX === "number") transform.x = nextX
        if (typeof nextY === "number") transform.y = nextY
      }

      if (spriteRef?.sprite) {
        if (typeof nextX === "number") spriteRef.sprite.x = nextX
        if (typeof nextY === "number") spriteRef.sprite.y = nextY
      }

      if (movement) {
        if (nextDirection) movement.direction = nextDirection
        movement.moving = false
        movement.dx = 0
        movement.dy = 0
      }

      if (animationState && nextAnimationKey) {
        animationState.currentKey = nextAnimationKey
      }
    },
    { x, y, direction, animationKey },
  )
}

export const withBellMonitor = async (page, run) => {
  await page.evaluate(() => {
    const runtime = window.__innGame
    if (!runtime) throw new Error("Runtime not available")

    window.__bellCallCount = 0
    window.__bellLastMetadata = null
    window.__bellStartTime = performance.now()
    window.__bellLastElapsed = null

    const originalPlayBell = runtime.audio.playBell?.bind(runtime.audio)
    runtime.audio.__originalPlayBell = runtime.audio.playBell
    runtime.audio.playBell = (metadata) => {
      window.__bellCallCount = (window.__bellCallCount ?? 0) + 1
      window.__bellLastMetadata = metadata
      window.__bellLastElapsed =
        performance.now() - (window.__bellStartTime ?? performance.now())
      return originalPlayBell?.(metadata)
    }

    runtime.audio.loadBell?.()
    runtime.keyboard.flush?.()
  })

  try {
    return await run()
  } finally {
    await page.evaluate(() => {
      const runtime = window.__innGame
      if (runtime?.audio?.__originalPlayBell) {
        runtime.audio.playBell = runtime.audio.__originalPlayBell
        delete runtime.audio.__originalPlayBell
      }

      delete window.__bellCallCount
      delete window.__bellLastMetadata
      delete window.__bellStartTime
      delete window.__bellLastElapsed
    })
  }
}

export const bellPlacements = {
  debug: {
    interactable: { type: "bell", index: 0 },
    offset: { x: 0, y: 0 },
    direction: "up",
    animationKey: "idle-up",
  },
  left: {
    interactable: { type: "bell", index: 0 },
    offset: { x: -1, y: 0 },
    direction: "right",
    animationKey: "idle-right",
  },
  right: {
    interactable: { type: "bell", index: 0 },
    offset: { x: 1, y: 0 },
    direction: "left",
    animationKey: "idle-left",
  },
  above: {
    interactable: { type: "bell", index: 0 },
    offset: { x: 0, y: -1 },
    direction: "down",
    animationKey: "idle-down",
  },
  below: {
    interactable: { type: "bell", index: 0 },
    offset: { x: 0, y: 1 },
    direction: "up",
    animationKey: "idle-up",
  },
}

export const computeSpriteFootPlacement = async (
  page,
  {
    interactable: {
      type = null,
      id = null,
      name = null,
      index = 0,
    } = {},
    offset: { x = 0, y = 0 } = {},
  } = {},
) => {
  return page.evaluate(({ criteria, tileOffset }) => {
    const runtime = window.__innGame
    if (!runtime) throw new Error("Runtime not available")

    const interactables = Array.isArray(runtime.map?.interactables)
      ? runtime.map.interactables
      : []

    let candidates = interactables
    if (criteria.type != null) {
      candidates = candidates.filter((entry) => entry?.type === criteria.type)
    }
    if (criteria.id != null) {
      candidates = candidates.filter((entry) => entry?.id === criteria.id)
    }
    if (criteria.name != null) {
      candidates = candidates.filter((entry) => entry?.name === criteria.name)
    }

    const safeIndex = Math.max(0, Math.min(criteria.index ?? 0, candidates.length - 1))
    const targetInteractable = candidates[safeIndex]
    if (!targetInteractable) {
      throw new Error(
        `Interactable not found (type=${criteria.type ?? "any"}, index=${criteria.index ?? 0})`,
      )
    }

    const tileWidth = runtime.map?.dimensions?.tilewidth ?? 32
    const tileHeight = runtime.map?.dimensions?.tileheight ?? 32
    const offsetX = runtime.map?.container?.x ?? 0
    const offsetY = runtime.map?.container?.y ?? 0

    const targetTileX = targetInteractable.tile?.x + tileOffset.x
    const targetTileY = targetInteractable.tile?.y + tileOffset.y
    if (targetTileX == null || targetTileY == null) {
      throw new Error("Interactable tile coordinates missing")
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
      interactable: {
        type: targetInteractable.type ?? null,
        id: targetInteractable.id ?? null,
        name: targetInteractable.name ?? null,
        tile: targetInteractable.tile ?? null,
      },
    }
  }, { criteria: { type, id, name, index }, tileOffset: { x, y } })
}

export const waitForManagerDebugState = async (
  page,
  { x = null, y = null, direction = null, animationKey = null } = {},
  { tolerance = 0.01, timeout = 1000 } = {},
) => {
  if (
    x == null &&
    y == null &&
    direction == null &&
    animationKey == null
  ) {
    return
  }

  await page.waitForFunction(
    (
      { x: targetX, y: targetY, direction: targetDirection, animationKey: targetAnimation, tolerance: delta },
    ) => {
      const debug = window.__innGame?.debug
      if (!debug) return false
      const within = (value, expected) => {
        if (expected == null) return true
        const actual = value ?? 0
        return Math.abs(actual - expected) <= delta
      }

      const directionMatches =
        targetDirection == null || debug.direction === targetDirection
      const animationMatches =
        targetAnimation == null || debug.animationKey === targetAnimation

      return (
        within(debug.x, targetX) &&
        within(debug.y, targetY) &&
        directionMatches &&
        animationMatches
      )
    },
    { x, y, direction, animationKey, tolerance },
    { timeout },
  )
}

export const placeManagerNextToSprite = async (
  page,
  placementDescriptor,
  { verifyDebug = false } = {},
) => {
  if (!placementDescriptor) {
    throw new Error("Placement descriptor missing")
  }

  const {
    interactable = {},
    offset = {},
    direction = null,
    animationKey = null,
  } = placementDescriptor
  const { x, y, interactable: resolved } = await computeSpriteFootPlacement(
    page,
    { interactable, offset },
  )
  const targetState = { x, y, direction, animationKey }

  await positionManager(page, targetState)

  if (verifyDebug) {
    const options = typeof verifyDebug === "boolean" ? {} : verifyDebug
    await waitForManagerDebugState(page, targetState, options)
  }

  return { ...targetState, interactable: resolved }
}

export const collectInteractableSnapshot = async (
  page,
  {
    interactable: {
      type = null,
      id = null,
      name = null,
      index = 0,
    } = {},
    includeBellMonitor = false,
  } = {},
) => {
  return page.evaluate(({ criteria, includeBell }) => {
    const runtime = window.__innGame
    if (!runtime) throw new Error("Runtime not available")

    const interactables = Array.isArray(runtime.map?.interactables)
      ? runtime.map.interactables
      : []

    let candidates = interactables
    if (criteria.type != null) {
      candidates = candidates.filter((entry) => entry?.type === criteria.type)
    }
    if (criteria.id != null) {
      candidates = candidates.filter((entry) => entry?.id === criteria.id)
    }
    if (criteria.name != null) {
      candidates = candidates.filter((entry) => entry?.name === criteria.name)
    }

    const safeIndex = Math.max(
      0,
      Math.min(criteria.index ?? 0, candidates.length - 1),
    )
    const targetInteractable = candidates[safeIndex]
    if (!targetInteractable) {
      throw new Error(
        `Interactable not found (type=${criteria.type ?? "any"}, index=${
          criteria.index ?? 0
        })`,
      )
    }

    const tilewidth = runtime.map?.dimensions?.tilewidth ?? 32
    const tileheight = runtime.map?.dimensions?.tileheight ?? 32
    const offsetX = runtime.map?.container?.x ?? 0
    const offsetY = runtime.map?.container?.y ?? 0
    const tile = targetInteractable.tile ?? { x: 0, y: 0 }

    const { registry, components, entities } = runtime.ecs ?? {}
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
    const footprintOffsetY = fullHeight - collisionHeight
    const footprintX = transform?.x ?? 0
    const footprintY = (transform?.y ?? 0) + footprintOffsetY
    const actorRect = {
      left: footprintX,
      right: footprintX + width,
      top: footprintY - footprintOffsetY,
      bottom: footprintY + collisionHeight,
    }
    const actorFoot = {
      x: actorRect.left + width / 2,
      y: actorRect.bottom - 1,
    }

    const localFootX = actorFoot.x - offsetX
    const localFootY = actorFoot.y - offsetY
    const actorTile =
      tilewidth > 0 && tileheight > 0
        ? {
            x: Math.floor(localFootX / tilewidth),
            y: Math.floor(localFootY / tileheight),
          }
        : null

    const targetRect = {
      left: offsetX + (tile.x ?? 0) * tilewidth,
      right: offsetX + ((tile.x ?? 0) + 1) * tilewidth,
      top: offsetY + (tile.y ?? 0) * tileheight,
      bottom: offsetY + ((tile.y ?? 0) + 1) * tileheight,
    }
    const targetFoot = {
      x: (targetRect.left + targetRect.right) / 2,
      y: targetRect.bottom - 1,
    }

    const snapshot = {
      interactable: {
        type: targetInteractable.type ?? null,
        id: targetInteractable.id ?? null,
        name: targetInteractable.name ?? null,
        tile: targetInteractable.tile ?? null,
      },
      tileSize: { width: tilewidth, height: tileheight },
      actor: { foot: actorFoot, rect: actorRect, tile: actorTile },
      target: { foot: targetFoot, rect: targetRect },
      debug: runtime?.debug ?? null,
      distance: Math.hypot(
        targetFoot.x - actorFoot.x,
        targetFoot.y - actorFoot.y,
      ),
    }

    if (includeBell) {
      snapshot.bellMonitor = {
        count:
          typeof window.__bellCallCount === "number"
            ? window.__bellCallCount
            : 0,
        metadata: window.__bellLastMetadata ?? null,
        elapsed: window.__bellLastElapsed ?? null,
      }
    }

    return snapshot
  }, { criteria: { type, id, name, index }, includeBell: includeBellMonitor })
}
