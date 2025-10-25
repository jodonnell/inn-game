import { SpriteRef, Transform } from "@/src/game/components.js"

export const renderSystem = {
  name: "render",
  components: [SpriteRef, Transform],
  update: ({ components: { SpriteRef: spriteRef, Transform: transform } }) => {
    if (!spriteRef.sprite) return
    spriteRef.sprite.x = transform.x
    spriteRef.sprite.y = transform.y
  },
}
