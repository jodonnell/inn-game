import { InputState, Movement } from "@/src/game/components.js"

export const inputSystem = {
  name: "input",
  components: [InputState, Movement],
  update: ({ components: { InputState: input, Movement: movement } }) => {
    const pressed = input.pressed
    let dx = 0
    let dy = 0

    if (pressed.has("ArrowLeft")) dx -= 1
    if (pressed.has("ArrowRight")) dx += 1
    if (pressed.has("ArrowUp")) dy -= 1
    if (pressed.has("ArrowDown")) dy += 1

    movement.dx = dx
    movement.dy = dy
    movement.moving = dx !== 0 || dy !== 0
  },
}
