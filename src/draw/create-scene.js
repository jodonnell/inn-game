import { Application } from "pixi.js"

export const createScene = async () => {
  const app = new Application()
  await app.init({ background: "#000000", resizeTo: window })
  document.body.appendChild(app.canvas)
  return app
}
