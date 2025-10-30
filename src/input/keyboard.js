const createKeyboardAdapter = (target) => {
  const pressed = new Set()
  const justPressed = []

  const handleKeyDown = (event) => {
    const code = event.code
    if (!code.startsWith("Arrow") && code !== "KeyA") return
    event.preventDefault()
    const isRepeat = pressed.has(code)
    pressed.add(code)
    if (code === "KeyA" && !isRepeat) {
      justPressed.push(code)
    }
  }

  const handleKeyUp = (event) => {
    const code = event.code
    if (!code.startsWith("Arrow") && code !== "KeyA") return
    event.preventDefault()
    pressed.delete(code)
  }

  target?.addEventListener?.("keydown", handleKeyDown)
  target?.addEventListener?.("keyup", handleKeyUp)

  return {
    pressed,
    justPressed,
    flush: () => {
      justPressed.length = 0
    },
    dispose: () => {
      target?.removeEventListener?.("keydown", handleKeyDown)
      target?.removeEventListener?.("keyup", handleKeyUp)
      pressed.clear()
      justPressed.length = 0
    },
  }
}

export const createKeyboardInput = (target) => {
  const inputTarget = target ?? (typeof window !== "undefined" ? window : null)
  return createKeyboardAdapter(inputTarget)
}
