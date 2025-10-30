import { defineComponent } from "@/src/core/ecs/index.js"
import {
  DEFAULT_DIRECTION,
  INITIAL_POSITION,
  MOVE_SPEED,
} from "@/src/game/constants.js"

export const Transform = defineComponent("Transform", () => ({
  x: INITIAL_POSITION.x,
  y: INITIAL_POSITION.y,
}))

export const Movement = defineComponent("Movement", () => ({
  dx: 0,
  dy: 0,
  speed: MOVE_SPEED,
  direction: DEFAULT_DIRECTION,
  moving: false,
}))

export const SpriteRef = defineComponent("SpriteRef", () => ({
  sprite: null,
}))

export const AnimationSet = defineComponent("AnimationSet", () => ({
  animations: {},
}))

export const AnimationState = defineComponent("AnimationState", () => ({
  currentKey: "",
}))

export const InputState = defineComponent("InputState", () => ({
  pressed: new Set(),
}))

export const MapLayer = defineComponent("MapLayer", () => ({
  container: null,
  collisions: [],
  layers: [],
  dimensions: {
    tilewidth: 0,
    tileheight: 0,
    width: 0,
    height: 0,
  },
}))

export const Interactable = defineComponent("Interactable", () => ({
  tile: { x: 0, y: 0 },
  metadata: {},
}))
