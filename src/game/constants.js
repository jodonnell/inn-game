export const WALK_FPS = 7
export const MOVE_SPEED = 4
export const DEFAULT_DIRECTION = "down"
export const INITIAL_POSITION = { x: 500, y: 300 }

export const DIRECTION_SEGMENTS = {
  down: { walk: "frontwalk", idle: "frontidle" },
  up: { walk: "backwalk", idle: "backidle" },
  left: { walk: "leftwalk", idle: "leftidle" },
  right: { walk: "rightwalk", idle: "rightidle" },
}
