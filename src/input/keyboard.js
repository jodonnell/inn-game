const ensureInput = () => {
  if (window.__innGameInput) return window.__innGameInput

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

  window.addEventListener("keydown", handleKeyDown)
  window.addEventListener("keyup", handleKeyUp)

  window.__innGameInput = {
    pressed,
    dispose: () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.__innGameInput = undefined
    },
  }

  return window.__innGameInput
}

export const useKeyboardInput = () => {
  return ensureInput()
}
