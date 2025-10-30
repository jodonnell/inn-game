import { beforeEach, describe, expect, it, jest } from "@jest/globals"

const mockPlay = jest.fn()

const buildInstance = () => ({
  play: mockPlay,
  stop: jest.fn(),
  unload: jest.fn(),
  volume: jest.fn(),
  rate: jest.fn(),
})

let createHowlMock

const resetMocks = () => {
  mockPlay.mockClear()
  createHowlMock = jest.fn(() => buildInstance())
}

describe("bell audio service", () => {
  beforeEach(() => {
    resetMocks()
  })

  it("loads the bell clip lazily and reuses the created Howl", async () => {
    const { createBellAudio } = await import(
      "../../../src/audio/bell.js"
    )

    const audio = createBellAudio({
      src: ["bell.mp3"],
      createHowl: createHowlMock,
    })

    expect(createHowlMock).not.toHaveBeenCalled()

    await audio.load()
    expect(createHowlMock).toHaveBeenCalledTimes(1)
    expect(createHowlMock).toHaveBeenCalledWith(
      expect.objectContaining({
        src: ["bell.mp3"],
        volume: 0.6,
      }),
    )

    await audio.load()
    expect(createHowlMock).toHaveBeenCalledTimes(1)
  })

  it("plays the bell clip on demand and ensures it is loaded first", async () => {
    const { createBellAudio } = await import(
      "../../../src/audio/bell.js"
    )

    const audio = createBellAudio({
      src: ["bell.mp3"],
      volume: 0.8,
      createHowl: createHowlMock,
    })

    await audio.playBell()
    expect(createHowlMock).toHaveBeenCalledTimes(1)
    expect(mockPlay).toHaveBeenCalledTimes(1)

    await audio.playBell()
    expect(createHowlMock).toHaveBeenCalledTimes(1)
    expect(mockPlay).toHaveBeenCalledTimes(2)
  })
})
