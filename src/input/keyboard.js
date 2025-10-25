const createKeyboardAdapter = (target) => {
  const pressed = new Set()

  const handleKeyDown = (event) => {
    if (!event.code.startsWith("Arrow")) return
    event.preventDefault()
    pressed.add(event.code)
  }

  const handleKeyUp = (event) => {
    if (!event.code.startsWith("Arrow")) return
    event.preventDefault()
    pressed.delete(event.code)
  }

  target?.addEventListener?.("keydown", handleKeyDown)
  target?.addEventListener?.("keyup", handleKeyUp)

  return {
    pressed,
    dispose: () => {
      target?.removeEventListener?.("keydown", handleKeyDown)
      target?.removeEventListener?.("keyup", handleKeyUp)
    },
  }
}

export const createKeyboardInput = (target) => {
  const inputTarget = target ?? (typeof window !== "undefined" ? window : null)
  return createKeyboardAdapter(inputTarget)
}
