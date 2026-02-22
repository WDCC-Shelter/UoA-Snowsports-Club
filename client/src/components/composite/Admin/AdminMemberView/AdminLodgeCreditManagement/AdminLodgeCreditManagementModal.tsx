import { type FormEvent, useRef, useState } from "react"
import CloseIcon from "@/assets/icons/x.svg"
import Button from "@/components/generic/FigmaButtons/FigmaButton"
import TextInput from "@/components/generic/TextInputComponent/TextInput"
import { useClickOutside } from "@/components/utils/Utils"

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
  currentAmount: number
  /**
   * Whether the current amount is being loaded
   */
  isLoading?: boolean
  /**
   * Callback when credits are updated. Takes the new amount to set.
   */
  onUpdateCredits?: (userId: string, newAmount: number) => void
  /**
   * Callback for when a 'close' event is triggered with the modal open
   */
  handleClose?: () => void
}

/**
 * @deprecated Do not use, exported for testing purposes
 */
export const AdminLodgeCreditFormKeys = {
  AMOUNT: "amount"
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
    const newAmount = Number.parseInt(
      data.get(AdminLodgeCreditFormKeys.AMOUNT) as string,
      10
    )

    if (newAmount === currentAmount) {
      alert("The new amount is the same as the current amount.")
      return
    }

    if (
      !confirm(`Set lodge credits to ${newAmount} for ${userName || userId}?`)
    ) {
      return
    }

    try {
      setIsSubmitting(true)
      onUpdateCredits?.(userId, newAmount)
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

      {/* Prominent current balance display */}
      <div className="bg-gray-100 my-4 w-full rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm uppercase tracking-wide">
          Current Balance
        </p>
        <p className="text-3xl font-bold text-dark-blue-100">
          {isLoading ? "..." : currentAmount}
        </p>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <TextInput
            name={AdminLodgeCreditFormKeys.AMOUNT}
            data-testid={AdminLodgeCreditFormKeys.AMOUNT}
            type="number"
            label="New Credit Amount"
            min={0}
            step={1}
            defaultValue={currentAmount}
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
