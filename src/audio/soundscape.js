import { Howl } from "howler"
import bellFxUrl from "@/assets/sound/bell.mp3"

const ambienceLibrary = new Map()
const effectLibrary = new Map()

let activeAmbienceName = null

const SILENCE_WAV =
  "data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA"

const defaultAmbienceTracks = [
  {
    name: "quiet-lobby",
    src: [SILENCE_WAV],
    loop: true,
    volume: 0.35,
  },
]

const defaultEffectTracks = {
  "bell-ring": {
    src: [bellFxUrl],
    volume: 0.6,
  },
}

const ensureTrackHasName = (name, type) => {
  if (!name) {
    throw new Error(`Missing ${type} name for Howl registration`)
  }
}

const buildHowl = (options, defaults = {}) => new Howl({ ...defaults, ...options })

export const registerAmbienceTracks = (tracks = []) => {
  tracks.forEach((track) => {
    const { name, ...howlOptions } = track
    ensureTrackHasName(name, "ambience")
    if (ambienceLibrary.has(name)) {
      return
    }
    ambienceLibrary.set(name, buildHowl(howlOptions, { loop: true, volume: 0.4 }))
  })
}

export const registerEffectTracks = (tracks = {}) => {
  Object.entries(tracks).forEach(([name, howlOptions]) => {
    ensureTrackHasName(name, "effect")
    if (effectLibrary.has(name)) {
      return
    }
    effectLibrary.set(name, buildHowl(howlOptions, { volume: 0.8 }))
  })
}

export const playAmbience = (name) => {
  const track = ambienceLibrary.get(name)
  if (!track) {
    return false
  }

  if (activeAmbienceName && activeAmbienceName !== name) {
    const previous = ambienceLibrary.get(activeAmbienceName)
    if (previous && previous.playing()) {
      previous.stop()
    }
  }

  activeAmbienceName = name

  if (!track.playing()) {
    track.play()
  }

  return true
}

export const stopAmbience = (name = activeAmbienceName) => {
  const track = name ? ambienceLibrary.get(name) : null
  if (!track) {
    return false
  }
  if (track.playing()) {
    track.stop()
  }
  if (activeAmbienceName === name) {
    activeAmbienceName = null
  }
  return true
}

export const playEffect = (name, overrides = {}) => {
  const effect = effectLibrary.get(name)
  if (!effect) {
    return false
  }

  const id = effect.play()

  if (typeof overrides.volume === "number") {
    effect.volume(overrides.volume, id)
  }

  if (typeof overrides.rate === "number") {
    effect.rate(overrides.rate, id)
  }

  if (overrides.stopAfterMs) {
    setTimeout(() => effect.stop(id), overrides.stopAfterMs)
  }

  return true
}

export const getAmbienceNames = () => Array.from(ambienceLibrary.keys())
export const getEffectNames = () => Array.from(effectLibrary.keys())

export const resetSoundscape = () => {
  ambienceLibrary.forEach((howl) => {
    if (howl.playing()) {
      howl.stop()
    }
  })
  effectLibrary.forEach((howl) => {
    if (howl.playing()) {
      howl.stop()
    }
  })
  ambienceLibrary.clear()
  effectLibrary.clear()
  activeAmbienceName = null
}

registerAmbienceTracks(defaultAmbienceTracks)
registerEffectTracks(defaultEffectTracks)
