import MapPinModerationService from "business-layer/services/MapPinModerationService"
import MapPinService from "data-layer/services/MapPinService"

const DEFAULT_INTERVAL_MINUTES = 60
const MS_IN_MINUTE = 60_000
/**
 * Wait a bit after the server starts so a failing job can't slow down startup
 */
const INITIAL_DELAY_MS = MS_IN_MINUTE

/**
 * How often the job runs, from `MAP_PIN_MODERATION_INTERVAL_MINUTES`.
 * `0` turns the job off.
 */
export const getModerationIntervalMinutes = (
  value = process.env.MAP_PIN_MODERATION_INTERVAL_MINUTES
) => {
  if (value === undefined || value.trim() === "")
    return DEFAULT_INTERVAL_MINUTES
  const minutes = Number(value)
  return Number.isFinite(minutes) && minutes >= 0
    ? minutes
    : DEFAULT_INTERVAL_MINUTES
}

/**
 * Starts checking new map pin photos on an interval, inside the server process.
 * There's only one server instance, so runs won't overlap across servers.
 *
 * @returns a function that stops the job
 */
export const startMapPinModerationJob = () => {
  const intervalMinutes = getModerationIntervalMinutes()
  if (intervalMinutes === 0) {
    console.log("[map-pin-moderation] disabled")
    return () => {}
  }

  let isRunning = false
  let hasBackfilled = false

  const run = async () => {
    // Skip if the previous run is still going
    if (isRunning) return
    isRunning = true
    try {
      if (!hasBackfilled) {
        const marked = await new MapPinService().markUnmoderatedPinsAsPending()
        if (marked > 0) {
          console.log(
            `[map-pin-moderation] marked ${marked} older pins as pending`
          )
        }
        hasBackfilled = true
      }
      const summary = await new MapPinModerationService().moderatePendingPins()
      if (Object.values(summary).some((count) => count > 0)) {
        console.log("[map-pin-moderation] run finished", summary)
      }
    } catch (e) {
      console.error("[map-pin-moderation] run failed", e)
    } finally {
      isRunning = false
    }
  }

  const initial = setTimeout(run, INITIAL_DELAY_MS)
  const interval = setInterval(run, intervalMinutes * MS_IN_MINUTE)
  console.log(`[map-pin-moderation] runs every ${intervalMinutes} minutes`)

  return () => {
    clearTimeout(initial)
    clearInterval(interval)
  }
}
