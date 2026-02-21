import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import ModalContainer from "@/components/generic/ModalContainer/ModalContainer"
import {
  AdminLodgeCreditManagementModal,
  type CouponOperation
} from "@/components/composite/Admin/AdminMemberView/AdminLodgeCreditManagement/AdminLodgeCreditManagementModal"

const meta: Meta<typeof AdminLodgeCreditManagementModal> = {
  component: AdminLodgeCreditManagementModal,
  tags: ["autodocs"],
  argTypes: {
    userId: {
      description: "The user ID to manage credits for",
      control: "text"
    },
    userName: {
      description: "The user's name for display purposes",
      control: "text"
    },
    currentAmount: {
      description:
        "Current credit amount - determines available operations (0 = add only, > 0 = edit/delete)",
      control: "number"
    },
    isLoading: {
      description: "Whether the current amount is being loaded",
      control: "boolean"
    },
    couponUpdateHandler: {
      description: "Callback when a coupon operation is submitted",
      action: "couponUpdateHandler"
    },
    handleClose: {
      description: "Callback for when a close event is triggered",
      action: "handleClose"
    }
  }
}

export default meta
type Story = StoryObj<typeof AdminLodgeCreditManagementModal>

export const NewUserNoCredits: Story = {
  args: {
    userId: "user-456",
    userName: "Jane Smith",
    currentAmount: 0
  },
  parameters: {
    docs: {
      description: {
        story:
          "Modal for a user with no existing lodge credits - only Add option available"
      }
    }
  }
}

export const UserWithExistingCredits: Story = {
  args: {
    userId: "user-789",
    userName: "Bob Wilson",
    currentAmount: 10
  },
  parameters: {
    docs: {
      description: {
        story:
          "Modal for a user with existing lodge credits - Edit and Delete options available"
      }
    }
  }
}

export const LoadingState: Story = {
  args: {
    userId: "user-loading",
    userName: "Loading User",
    currentAmount: 0,
    isLoading: true
  },
  parameters: {
    docs: {
      description: {
        story: "Modal while credit information is being loaded"
      }
    }
  }
}

export const WithoutUserName: Story = {
  args: {
    userId: "user-anonymous",
    currentAmount: 3
  },
  parameters: {
    docs: {
      description: {
        story: "Modal when user name is not available, falls back to user ID"
      }
    }
  }
}

export const OpenAndCloseExample = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [currentAmount, setCurrentAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleOpen = () => {
    setIsOpen(true)
    setIsLoading(true)
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleCouponUpdate = (userId: string, operation: CouponOperation) => {
    console.log("Coupon update:", { userId, operation })
    if (operation.type === "add" || operation.type === "edit") {
      setCurrentAmount(operation.amount)
    } else if (operation.type === "delete") {
      setCurrentAmount(0)
    }
    alert(`Operation: ${operation.type} for user: ${userId}`)
    setIsOpen(false)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <p>Current credits: {currentAmount}</p>
        <button
          type="button"
          onClick={handleOpen}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Manage Lodge Credits
        </button>
      </div>
      <ModalContainer isOpen={isOpen}>
        <AdminLodgeCreditManagementModal
          userId="user-interactive"
          userName="Interactive User"
          currentAmount={currentAmount}
          isLoading={isLoading}
          couponUpdateHandler={handleCouponUpdate}
          handleClose={() => setIsOpen(false)}
        />
      </ModalContainer>
    </>
  )
}

OpenAndCloseExample.parameters = {
  docs: {
    description: {
      story:
        "Interactive example demonstrating opening/closing the modal, loading state, and handling form submission"
    }
  }
}
