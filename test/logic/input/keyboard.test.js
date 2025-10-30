import { describe, expect, it, jest } from "@jest/globals"
import { createKeyboardInput } from "../../../src/input/keyboard.js"

const getListener = (target, type) => {
  const call = target.addEventListener.mock.calls.find(
    ([eventType]) => eventType === type,
  )
  return call ? call[1] : null
}

describe("createKeyboardInput", () => {
  it("captures KeyA edge presses in justPressed while tracking pressed state", () => {
    const target = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    const keyboard = createKeyboardInput(target)
    const handleKeyDown = getListener(target, "keydown")
    const handleKeyUp = getListener(target, "keyup")

    expect(handleKeyDown).toBeInstanceOf(Function)
    expect(handleKeyUp).toBeInstanceOf(Function)
    expect(Array.isArray(keyboard.justPressed)).toBe(true)

    handleKeyDown({ code: "KeyA", preventDefault: jest.fn() })
    expect(keyboard.pressed.has("KeyA")).toBe(true)
    const firstFramePressed = [...keyboard.justPressed]
    expect(firstFramePressed).toContain("KeyA")

    keyboard.flush?.()
    expect(keyboard.justPressed).not.toContain("KeyA")

    handleKeyUp({ code: "KeyA", preventDefault: jest.fn() })
    expect(keyboard.pressed.has("KeyA")).toBe(false)

    handleKeyDown({ code: "KeyA", preventDefault: jest.fn() })
    const secondFramePressed = [...keyboard.justPressed]
    expect(secondFramePressed).toContain("KeyA")

    handleKeyUp({ code: "KeyA", preventDefault: jest.fn() })
    expect(keyboard.pressed.has("KeyA")).toBe(false)
  })

  it("ignores unrelated key codes for pressed and justPressed tracking", () => {
    const target = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    const keyboard = createKeyboardInput(target)
    const handleKeyDown = getListener(target, "keydown")
    const handleKeyUp = getListener(target, "keyup")

    handleKeyDown({ code: "KeyB", preventDefault: jest.fn() })
    expect(keyboard.pressed.has("KeyB")).toBe(false)
    expect(keyboard.justPressed).not.toContain("KeyB")

    handleKeyUp({ code: "KeyB", preventDefault: jest.fn() })
    expect(keyboard.pressed.size).toBe(0)
    expect(keyboard.justPressed.length ?? 0).toBe(0)
  })
})
