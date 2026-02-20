import Button from "@/components/generic/FigmaButtons/FigmaButton"
import TextInput from "@/components/generic/TextInputComponent/TextInput"
import Dropdown from "@/components/generic/Dropdown/Dropdown"
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
   * Current credit amount (used for edit operations)
   */
  currentAmount?: number
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
  OPERATION_TYPE: "operation type",
  AMOUNT: "amount"
} as const

const operationTypeDescription = (operationType: CouponOperationType) => {
  switch (operationType) {
    case "add":
      return `Add a new lodge credit coupon with the specified amount.`
    case "edit":
      return `Edit the existing lodge credit amount for this user.`
    case "delete":
      return `Remove all lodge credits from this user.`
  }
}

/**
 * Popup for managing lodge credits for a specific user.
 * Allows adding, editing, or deleting lodge credit coupons.
 */
export const AdminLodgeCreditManagementModal = ({
  userId,
  userName,
  currentAmount,
  couponUpdateHandler,
  handleClose
}: IAdminLodgeCreditManagementModal) => {
  const [operationType, setOperationType] = useState<CouponOperationType>("add")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const formContainerRef = useRef<HTMLDivElement>(null)
  useClickOutside(formContainerRef, () => {
    handleClose?.()
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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

  const showAmountField = operationType !== "delete"

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
      {currentAmount !== undefined && (
        <p className="text-gray-600">Current Balance: {currentAmount}</p>
      )}
      <form
        onSubmit={handleSubmit}
        className="xs:max-w-[500px] flex w-full max-w-[250px] flex-col gap-2"
      >
        <Dropdown
          name={AdminLodgeCreditFormKeys.OPERATION_TYPE}
          data-testid={AdminLodgeCreditFormKeys.OPERATION_TYPE}
          value={operationType}
          label="Operation Type"
          onChange={(e) =>
            setOperationType(e.target.value as CouponOperationType)
          }
        >
          <option value={ADD_OPERATION}>Add</option>
          <option value={EDIT_OPERATION}>Edit</option>
          <option value={DELETE_OPERATION}>Delete</option>
        </Dropdown>
        <h5>{operationTypeDescription(operationType)}</h5>
        {showAmountField && (
          <TextInput
            name={AdminLodgeCreditFormKeys.AMOUNT}
            data-testid={AdminLodgeCreditFormKeys.AMOUNT}
            type="number"
            label="Quantity"
            min={0}
            step={1}
            defaultValue={operationType === "edit" ? currentAmount : undefined}
            required
          />
        )}
        <Button
          disabled={isSubmitting}
          type="submit"
          data-testid="submit-lodge-credit-button"
        >
          {operationType === "add" && "Add Credit"}
          {operationType === "edit" && "Update Credit"}
          {operationType === "delete" && "Delete Credit"}
        </Button>
      </form>
    </div>
  )
}

export default AdminLodgeCreditManagementModal
