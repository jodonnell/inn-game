import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"

const howlRecordings = []

await jest.unstable_mockModule("howler", () => {
  class MockHowl {
    constructor(options) {
      this.options = options
      this.playInvocations = []
      this.stopInvocations = []
      this.volumeInvocations = []
      this.rateInvocations = []
      this._lastId = 0
      this._activeIds = new Set()
      this._isPlaying = false
      howlRecordings.push(this)
    }

    play() {
      const id = ++this._lastId
      this._activeIds.add(id)
      this._isPlaying = true
      this.playInvocations.push(id)
      return id
    }

    stop(id = null) {
      if (id === null) {
        this._activeIds.clear()
      } else {
        this._activeIds.delete(id)
      }
      this._isPlaying = this._activeIds.size > 0
      this.stopInvocations.push(id)
      return this
    }

    playing() {
      return this._isPlaying
    }

    volume(value, id) {
      if (value === undefined) {
        return this.options.volume ?? 1
      }
      this.volumeInvocations.push({ value, id })
      return this
    }

    rate(value, id) {
      if (value === undefined) {
        return this.options.rate ?? 1
      }
      this.rateInvocations.push({ value, id })
      return this
    }
  }

  MockHowl.instances = howlRecordings
  MockHowl.reset = () => {
    howlRecordings.splice(0, howlRecordings.length)
  }

  return { Howl: MockHowl }
})

const soundscape = await import("../../../src/audio/soundscape.js")

const {
  registerAmbienceTracks,
  registerEffectTracks,
  playAmbience,
  stopAmbience,
  playEffect,
  getAmbienceNames,
  getEffectNames,
  resetSoundscape,
} = soundscape

const { Howl } = await import("howler")

const resetHowlerMock = () => {
  Howl.reset()
}

describe("soundscape audio facade", () => {
  beforeEach(() => {
    resetSoundscape()
    resetHowlerMock()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("keeps ambience playback exclusive per track", () => {
    registerAmbienceTracks([
      { name: "fireplace", src: ["fireplace.mp3"] },
      { name: "rain", src: ["rain.mp3"] },
    ])

    expect(getAmbienceNames()).toEqual(["fireplace", "rain"])

    const [fireplace, rain] = Howl.instances

    expect(playAmbience("fireplace")).toBe(true)
    expect(fireplace.playInvocations).toHaveLength(1)
    expect(fireplace.playing()).toBe(true)

    expect(playAmbience("rain")).toBe(true)
    expect(fireplace.stopInvocations).toEqual([null])
    expect(fireplace.playing()).toBe(false)
    expect(rain.playInvocations).toHaveLength(1)
    expect(rain.playing()).toBe(true)

    expect(stopAmbience()).toBe(true)
    expect(rain.stopInvocations).toEqual([null])
    expect(rain.playing()).toBe(false)

    expect(stopAmbience()).toBe(false)
    expect(playAmbience("unknown-room")).toBe(false)
    expect(fireplace.stopInvocations).toHaveLength(1)
  })

  it("reuses the same Howl when an effect triggers repeatedly", () => {
    registerEffectTracks({
      "bell-ring": { src: ["click.mp3"] },
    })

    expect(getEffectNames()).toEqual(["bell-ring"])
    expect(Howl.instances).toHaveLength(1)

    playEffect("bell-ring")
    playEffect("bell-ring")
    playEffect("bell-ring")

    const [click] = Howl.instances
    expect(click.playInvocations).toHaveLength(3)
    expect(playEffect("unknown-effect")).toBe(false)
  })

  it("applies per-trigger overrides when playing effects", () => {
    jest.useFakeTimers()

    registerEffectTracks({
      chime: { src: ["chime.mp3"], volume: 0.2 },
    })

    const [chime] = Howl.instances

    expect(playEffect("chime", { volume: 0.5, rate: 1.2, stopAfterMs: 50 })).toBe(true)

    const [firstPlayId] = chime.playInvocations

    expect(chime.volumeInvocations).toEqual([{ value: 0.5, id: firstPlayId }])
    expect(chime.rateInvocations).toEqual([{ value: 1.2, id: firstPlayId }])

    jest.advanceTimersByTime(50)

    expect(chime.stopInvocations).toEqual([firstPlayId])
  })
})
