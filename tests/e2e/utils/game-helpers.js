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
