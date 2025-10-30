import { Howl } from "howler"
import bellFxUrl from "@/assets/sound/bell.mp3?url"

const DEFAULT_OPTIONS = {
  src: [bellFxUrl],
  volume: 0.6,
}

export const createBellAudio = (options = {}) => {
  const { createHowl, ...howlOptions } = options
  const configuration = {
    ...DEFAULT_OPTIONS,
    ...howlOptions,
    src: howlOptions.src ?? DEFAULT_OPTIONS.src,
    volume:
      typeof howlOptions.volume === "number" ? howlOptions.volume : DEFAULT_OPTIONS.volume,
  }

  let howl = null
  let loadingPromise = null

  const buildHowl = () => {
    if (typeof createHowl === "function") {
      return createHowl(configuration)
    }

    return new Howl({
      preload: true,
      ...configuration,
    })
  }

  const ensureHowl = async () => {
    if (howl) return howl
    if (loadingPromise) return loadingPromise

    loadingPromise = Promise.resolve().then(() => {
      howl = buildHowl()
      return howl
    })

    const instance = await loadingPromise
    loadingPromise = null
    return instance
  }

  return {
    async load() {
      return ensureHowl()
    },

    async playBell(metadata = {}) {
      const instance = await ensureHowl()
      const id = instance.play()

      if (typeof metadata.volume === "number" && typeof instance.volume === "function") {
        instance.volume(metadata.volume, id)
      }

      if (typeof metadata.rate === "number" && typeof instance.rate === "function") {
        instance.rate(metadata.rate, id)
      }

      if (typeof metadata.stopAfterMs === "number" && typeof instance.stop === "function") {
        setTimeout(() => instance.stop(id), metadata.stopAfterMs)
      }

      return id
    },
  }
}
