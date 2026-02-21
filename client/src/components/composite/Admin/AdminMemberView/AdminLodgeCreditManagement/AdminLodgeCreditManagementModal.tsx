import Button from "@/components/generic/FigmaButtons/FigmaButton"
import TextInput from "@/components/generic/TextInputComponent/TextInput"
import CloseIcon from "@/assets/icons/x.svg"
import { useClickOutside } from "@/components/utils/Utils"
import { type FormEvent, useRef, useState } from "react"

const ADD_OPERATION = "add" as const
const EDIT_OPERATION = "edit" as const
const DELETE_OPERATION = "delete" as const

export type CouponOperationType =
  | typeof ADD_OPERATION
  | typeof EDIT_OPERATION
  | typeof DELETE_OPERATION

interface CouponAddOperation {
  type: typeof ADD_OPERATION
  amount: number
}
interface CouponEditOperation {
  type: typeof EDIT_OPERATION
  amount: number
}
interface CouponDeleteOperation {
  type: typeof DELETE_OPERATION
}

export type CouponOperation =
  | CouponAddOperation
  | CouponEditOperation
  | CouponDeleteOperation

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
   * Current credit amount - determines available operations
   * - 0: Can only add credits
   * - > 0: Can edit or delete credits
   */
  currentAmount: number
  /**
   * Whether the current amount is being loaded
   */
  isLoading?: boolean
  /**
   * Callback when a coupon operation is submitted
   */
  couponUpdateHandler?: (userId: string, operation: CouponOperation) => void
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
 * Popup for managing lodge credits for a specific user.
 * Operations are determined by currentAmount:
 * - If 0: Can only add credits
 * - If > 0: Can edit or delete credits
 */
export const AdminLodgeCreditManagementModal = ({
  userId,
  userName,
  currentAmount,
  isLoading = false,
  couponUpdateHandler,
  handleClose
}: IAdminLodgeCreditManagementModal) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const formContainerRef = useRef<HTMLDivElement>(null)
  useClickOutside(formContainerRef, () => {
    handleClose?.()
  })

  const hasExistingCredits = currentAmount > 0

  const handleSubmit = (
    e: FormEvent<HTMLFormElement>,
    operationType: CouponOperationType
  ) => {
    const data = new FormData(e.currentTarget)

    let operation: CouponOperation
    const amount = Number.parseFloat(
      data.get(AdminLodgeCreditFormKeys.AMOUNT) as string
    )

    switch (operationType) {
      case "add":
        operation = { type: "add", amount }
        break
      case "edit":
        operation = { type: "edit", amount }
        break
      case "delete":
        operation = { type: "delete" }
        break
    }

    const confirmMessage =
      operationType === "delete"
        ? `Are you sure you want to delete all lodge credits for ${userName || userId}?`
        : `Are you sure you want to ${operationType} lodge credits of ${amount} for ${userName || userId}?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setIsSubmitting(true)
      couponUpdateHandler?.(userId, operation)
      e.currentTarget.reset()
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
        className="ml-auto mr-2 h-[15px] w-[15px] cursor-pointer sm:mr-8"
        aria-label="close lodge credit management popup"
        onClick={() => handleClose?.()}
      >
        <CloseIcon />
      </div>
      <h2>Manage Lodge Credits</h2>
      {userName && <p className="text-gray-600">User: {userName}</p>}
      <p className="text-gray-600">
        Current Balance: {isLoading ? "Loading..." : currentAmount}
      </p>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="xs:max-w-[500px] flex w-full max-w-[250px] flex-col gap-2"
      >
        <TextInput
          name={AdminLodgeCreditFormKeys.AMOUNT}
          data-testid={AdminLodgeCreditFormKeys.AMOUNT}
          type="number"
          label="Credit Amount"
          min={currentAmount > 0 ? 1 : 0}
          step={1}
          defaultValue={hasExistingCredits ? currentAmount : undefined}
          required
          disabled={isLoading}
        />
        {isLoading ? (
          <p className="text-gray-500 text-center text-sm">
            Loading credit information...
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {!hasExistingCredits ? (
              <>
                <p className="text-gray-600 text-sm">
                  This user has no credits. Add credits to get started.
                </p>
                <Button
                  disabled={isDisabled}
                  type="submit"
                  data-testid="add-lodge-credit-button"
                  onClick={(e) => {
                    const form = e.currentTarget.closest("form")
                    if (form?.reportValidity()) {
                      handleSubmit(
                        {
                          ...e,
                          currentTarget: form
                        } as FormEvent<HTMLFormElement>,
                        "add"
                      )
                    }
                  }}
                >
                  Add Credits
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-600 text-sm">
                  Update the credit amount or remove all credits.
                </p>
                <Button
                  disabled={isDisabled}
                  type="submit"
                  data-testid="update-lodge-credit-button"
                  onClick={(e) => {
                    const form = e.currentTarget.closest("form")
                    if (form?.reportValidity()) {
                      handleSubmit(
                        {
                          ...e,
                          currentTarget: form
                        } as FormEvent<HTMLFormElement>,
                        "edit"
                      )
                    }
                  }}
                >
                  Update Credits
                </Button>
                <Button
                  disabled={isDisabled}
                  type="button"
                  variant="secondary"
                  data-testid="delete-lodge-credit-button"
                  onClick={(e) => {
                    const form = e.currentTarget.closest("form")
                    if (form) {
                      handleSubmit(
                        {
                          ...e,
                          currentTarget: form,
                          preventDefault: () => {}
                        } as FormEvent<HTMLFormElement>,
                        "delete"
                      )
                    }
                  }}
                >
                  Delete All Credits
                </Button>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  )
}

export default AdminLodgeCreditManagementModal
