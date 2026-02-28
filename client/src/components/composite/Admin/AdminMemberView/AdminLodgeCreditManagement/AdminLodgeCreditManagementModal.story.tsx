import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { AdminLodgeCreditManagementModal } from "@/components/composite/Admin/AdminMemberView/AdminLodgeCreditManagement/AdminLodgeCreditManagementModal"
import ModalContainer from "@/components/generic/ModalContainer/ModalContainer"
import type { LodgeCreditState } from "@/models/Booking"

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
      description: "Current credit amounts (anyNight and weekNightsOnly)",
      control: "object"
    },
    isLoading: {
      description: "Whether the current amount is being loaded",
      control: "boolean"
    },
    onUpdateCredits: {
      description: "Callback when credits are updated with new amount",
      action: "onUpdateCredits"
    },
    handleClose: {
      description: "Callback for when a close event is triggered",
      action: "handleClose"
    }
  }
}

export default meta
type Story = StoryObj<typeof AdminLodgeCreditManagementModal>

export const NoCredits: Story = {
  args: {
    userId: "user-456",
    userName: "Jane Smith",
    currentAmount: { anyNight: 0, weekNightsOnly: 0 }
  }
}

export const WithAnyNightCredits: Story = {
  args: {
    userId: "user-789",
    userName: "Bob Wilson",
    currentAmount: { anyNight: 10, weekNightsOnly: 0 }
  }
}

export const WithWeekNightCredits: Story = {
  args: {
    userId: "user-790",
    userName: "Alice Johnson",
    currentAmount: { anyNight: 0, weekNightsOnly: 5 }
  }
}

export const WithMixedCredits: Story = {
  args: {
    userId: "user-791",
    userName: "Charlie Brown",
    currentAmount: { anyNight: 3, weekNightsOnly: 7 }
  }
}

export const LoadingState: Story = {
  args: {
    userId: "user-loading",
    userName: "Loading User",
    currentAmount: { anyNight: 0, weekNightsOnly: 0 },
    isLoading: true
  }
}

export const InteractiveExample = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [currentAmount, setCurrentAmount] = useState<LodgeCreditState>({
    anyNight: 5,
    weekNightsOnly: 2
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleOpen = () => {
    setIsOpen(true)
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleUpdate = (
    userId: string,
    newAmount: Partial<LodgeCreditState>
  ) => {
    console.log("Update credits:", { userId, newAmount })
    setCurrentAmount((prev) => ({ ...prev, ...newAmount }))
    setIsOpen(false)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <p>Current credits:</p>
        <ul className="list-inside list-disc">
          <li>Any Night: {currentAmount.anyNight}</li>
          <li>Week Nights Only: {currentAmount.weekNightsOnly}</li>
        </ul>
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
          onUpdateCredits={handleUpdate}
          handleClose={() => setIsOpen(false)}
        />
      </ModalContainer>
    </>
  )
}
