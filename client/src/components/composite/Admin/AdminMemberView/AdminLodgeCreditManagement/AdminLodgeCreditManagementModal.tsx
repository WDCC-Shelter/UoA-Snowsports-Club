import { type FormEvent, useRef, useState } from "react"
import CloseIcon from "@/assets/icons/x.svg"
import Button from "@/components/generic/FigmaButtons/FigmaButton"
import TextInput from "@/components/generic/TextInputComponent/TextInput"
import { useClickOutside } from "@/components/utils/Utils"
import { LodgeCreditState } from "@/models/Booking"

interface IAdminLodgeCreditManagementModal {
  /**
   * The user ID to manage credits for
   */
  userId: string
  /**
   * The user's name for display purposes
   */
  userName?: string
  /**
   * Current credit amount
   */
  currentAmount: LodgeCreditState
  /**
   * Whether the current amount is being loaded
   */
  isLoading?: boolean
  /**
   * Callback when credits are updated. Takes the new amount to set.
   */
  onUpdateCredits?: (
    userId: string,
    newAmount: Partial<LodgeCreditState>
  ) => void
  /**
   * Callback for when a 'close' event is triggered with the modal open
   */
  handleClose?: () => void
}

/**
 * @deprecated Do not use, exported for testing purposes
 */
export const AdminLodgeCreditFormKeys = {
  ANY_NIGHT: "anyNight",
  WEEK_NIGHTS_ONLY: "weekNightsOnly"
} as const

/**
 * Modal for setting lodge credits for a specific user.
 * Admins can set the credit amount to any value (including 0 to remove credits).
 */
export const AdminLodgeCreditManagementModal = ({
  userId,
  userName,
  currentAmount,
  isLoading = false,
  onUpdateCredits,
  handleClose
}: IAdminLodgeCreditManagementModal) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const formContainerRef = useRef<HTMLDivElement>(null)
  useClickOutside(formContainerRef, () => {
    handleClose?.()
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const newAnyNight = Number.parseInt(
      data.get(AdminLodgeCreditFormKeys.ANY_NIGHT) as string,
      10
    )
    const newWeekNightsOnly = Number.parseInt(
      data.get(AdminLodgeCreditFormKeys.WEEK_NIGHTS_ONLY) as string,
      10
    )

    // Only include changed values
    const changedValues: Partial<LodgeCreditState> = {}
    if (newAnyNight !== currentAmount.anyNight) {
      changedValues.anyNight = newAnyNight
    }
    if (newWeekNightsOnly !== currentAmount.weekNightsOnly) {
      changedValues.weekNightsOnly = newWeekNightsOnly
    }

    if (Object.keys(changedValues).length === 0) {
      alert("The new amounts are the same as the current amounts.")
      return
    }

    // Build confirmation message with only changed values
    const changeLines = []
    if (changedValues.anyNight !== undefined) {
      changeLines.push(
        `Any Night: ${currentAmount.anyNight} → ${changedValues.anyNight}`
      )
    }
    if (changedValues.weekNightsOnly !== undefined) {
      changeLines.push(
        `Week Nights Only: ${currentAmount.weekNightsOnly} → ${changedValues.weekNightsOnly}`
      )
    }

    if (
      !confirm(
        `Set lodge credits for ${userName || userId}?\n${changeLines.join("\n")}`
      )
    ) {
      return
    }

    try {
      setIsSubmitting(true)
      onUpdateCredits?.(userId, changedValues)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = isSubmitting || isLoading

  return (
    <div
      ref={formContainerRef}
      className="border-gray-4 mt-72 flex w-full max-w-[800px] flex-col
                    items-center rounded-md border bg-white px-2 py-8"
    >
      <div
        className="ml-auto h-[15px] w-[15px] cursor-pointer"
        aria-label="close lodge credit management popup"
        onClick={() => handleClose?.()}
      >
        <CloseIcon />
      </div>

      <h2 className="mb-2 text-xl font-semibold">Lodge Credits</h2>
      {userName && <p className="text-gray-600 text-sm">{userName}</p>}

      <div className="bg-gray-100 my-4 w-full rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm uppercase tracking-wide">
          Current Balance
        </p>
        <div className="mt-2 flex justify-center gap-8">
          <div>
            <p className="text-gray-500 text-xs">Any Night</p>
            <p className="text-2xl font-bold text-dark-blue-100">
              {isLoading ? "..." : currentAmount.anyNight}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Week Nights Only</p>
            <p className="text-2xl font-bold text-dark-blue-100">
              {isLoading ? "..." : currentAmount.weekNightsOnly}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <TextInput
            name={AdminLodgeCreditFormKeys.ANY_NIGHT}
            data-testid={AdminLodgeCreditFormKeys.ANY_NIGHT}
            type="number"
            label="Any Night Credits"
            description="Credits usable for any booking (including weekends)"
            min={0}
            step={1}
            defaultValue={currentAmount.anyNight}
            required
          />
          <TextInput
            name={AdminLodgeCreditFormKeys.WEEK_NIGHTS_ONLY}
            data-testid={AdminLodgeCreditFormKeys.WEEK_NIGHTS_ONLY}
            type="number"
            label="Week Nights Only Credits"
            description="Credits only usable for bookings starting Monday-Friday"
            min={0}
            step={1}
            defaultValue={currentAmount.weekNightsOnly}
            required
          />
          <Button
            disabled={isDisabled}
            type="submit"
            data-testid="set-credits-button"
          >
            Set Credits
          </Button>
        </form>
      )}
    </div>
  )
}

export default AdminLodgeCreditManagementModal
