import { animationSystem } from "@/src/game/systems/animation-system.js"
import { inputSystem } from "@/src/game/systems/input-system.js"
import { interactionSystem } from "@/src/game/systems/interaction-system.js"
import { movementSystem } from "@/src/game/systems/movement-system.js"
import { renderSystem } from "@/src/game/systems/render-system.js"

export const managerSystems = [
  inputSystem,
  interactionSystem,
  movementSystem,
  animationSystem,
  renderSystem,
]
