import type { LodgeCreditState } from "@/models/Booking"

interface ILodgeCreditsBanner {
  availableCredits: LodgeCreditState
}

/**
 * Excited banner to notify user about their available free night credits
 */
const LodgeCreditsBanner = ({ availableCredits }: ILodgeCreditsBanner) => {
  const { anyNight, weekNightsOnly } = availableCredits
  const totalCredits = anyNight + weekNightsOnly

  if (totalCredits <= 0) {
    return null
  }

  const formatNightText = (count: number) =>
    count === 1 ? "credit" : "credits"

  return (
    <div className="border-light-blue-100 bg-white flex flex-col gap-2 rounded border p-3">
      <h5 className="text-light-blue-100 font-bold uppercase">
        🎉 You have free nights available!
      </h5>
      <div>
        <p>
          Great news! You have lodge credits that will be automatically applied
          to your booking:
        </p>
        <ul className="mt-2 list-inside list-disc">
          {anyNight > 0 && (
            <li>
              <span className="text-light-blue-100 font-bold">
                {anyNight} {formatNightText(anyNight)}
              </span>{" "}
              available for any night
            </li>
          )}
          {weekNightsOnly > 0 && (
            <li>
              <span className="text-light-blue-100 font-bold">
                {weekNightsOnly} {formatNightText(weekNightsOnly)}
              </span>{" "}
              available for weeknights only
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default LodgeCreditsBanner
