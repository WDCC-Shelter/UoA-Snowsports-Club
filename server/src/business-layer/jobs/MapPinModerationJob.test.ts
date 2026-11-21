import { getModerationIntervalMinutes } from "./MapPinModerationJob"

describe("getModerationIntervalMinutes", () => {
  it.each([
    [undefined, 60],
    ["", 60],
    ["15", 15],
    ["0", 0],
    ["-5", 60],
    ["soon", 60]
  ])("reads %p as %p minutes", (value, expected) => {
    expect(getModerationIntervalMinutes(value)).toBe(expected)
  })
})
