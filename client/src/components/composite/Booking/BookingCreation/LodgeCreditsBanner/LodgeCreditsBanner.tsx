interface ILodgeCreditsBanner {
  availableCredits: number
}

/**
 * Excited banner to notify user about their available free night credits
 */
const LodgeCreditsBanner = ({ availableCredits }: ILodgeCreditsBanner) => {
  if (availableCredits <= 0) {
    return null
  }

  const nightText = availableCredits === 1 ? "night" : "nights"

  return (
    <div className="border-light-blue-100 bg-white flex flex-col gap-2 rounded border p-3">
      <h5 className="text-light-blue-100 font-bold uppercase">
        🎉 You have free nights available!
      </h5>
      <div>
        <p>
          Great news! You can book up to{" "}
          <span className="text-light-blue-100 font-bold">
            {availableCredits} {nightText}
          </span>{" "}
          for free using your lodge credits. These will be automatically applied
          to your booking!
        </p>
      </div>
    </div>
  )
}

export default LodgeCreditsBanner
