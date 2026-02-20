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
      description: "Current credit amount (used for edit operations)",
      control: "number"
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

export const DefaultModal: Story = {
  args: {
    userId: "user-123",
    userName: "John Doe",
    currentAmount: 5
  }
}

export const NewUserNoCredits: Story = {
  args: {
    userId: "user-456",
    userName: "Jane Smith",
    currentAmount: 0
  },
  parameters: {
    docs: {
      description: {
        story: "Modal for a user with no existing lodge credits"
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
        story: "Modal for a user with existing lodge credits to edit or delete"
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

  const handleCouponUpdate = (userId: string, operation: CouponOperation) => {
    console.log("Coupon update:", { userId, operation })
    alert(`Operation: ${operation.type} for user: ${userId}`)
    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Manage Lodge Credits
      </button>
      <ModalContainer isOpen={isOpen}>
        <AdminLodgeCreditManagementModal
          userId="user-interactive"
          userName="Interactive User"
          currentAmount={7}
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
        "Interactive example demonstrating opening/closing the modal and handling form submission"
    }
  }
}
