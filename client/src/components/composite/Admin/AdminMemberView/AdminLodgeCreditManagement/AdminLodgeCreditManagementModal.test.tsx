import { fireEvent, render } from "@testing-library/react"
import AdminLodgeCreditManagementModal, {
  AdminLodgeCreditFormKeys
} from "@/components/composite/Admin/AdminMemberView/AdminLodgeCreditManagement/AdminLodgeCreditManagementModal"

describe("AdminLodgeCreditManagementModal", () => {
  let confirmSpy: any
  beforeAll(() => {
    confirmSpy = jest.spyOn(window, "confirm")
    confirmSpy.mockImplementation(jest.fn(() => true))
  })
  afterAll(() => confirmSpy.mockRestore())

  it("shows only add button when currentAmount is 0", () => {
    const { getByTestId, queryByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={0}
      />
    )

    expect(getByTestId("add-lodge-credit-button")).toBeInTheDocument()
    expect(queryByTestId("update-lodge-credit-button")).not.toBeInTheDocument()
    expect(queryByTestId("delete-lodge-credit-button")).not.toBeInTheDocument()
  })

  it("shows edit and delete buttons when currentAmount is greater than 0", () => {
    const { getByTestId, queryByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={5}
      />
    )

    expect(queryByTestId("add-lodge-credit-button")).not.toBeInTheDocument()
    expect(getByTestId("update-lodge-credit-button")).toBeInTheDocument()
    expect(getByTestId("delete-lodge-credit-button")).toBeInTheDocument()
  })

  it("calls couponUpdateHandler with correct parameters for add operation", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={0}
        couponUpdateHandler={mockHandler}
      />
    )

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.AMOUNT), {
      target: { value: "3" }
    })
    fireEvent.click(getByTestId("add-lodge-credit-button"))

    expect(mockHandler).toHaveBeenCalledWith("user-123", {
      type: "add",
      amount: 3
    })
  })

  it("calls couponUpdateHandler with correct parameters for delete operation", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={5}
        couponUpdateHandler={mockHandler}
      />
    )

    fireEvent.click(getByTestId("delete-lodge-credit-button"))

    expect(mockHandler).toHaveBeenCalledWith("user-123", {
      type: "delete"
    })
  })

  it("calls couponUpdateHandler with correct parameters for update operation", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={5}
        couponUpdateHandler={mockHandler}
      />
    )

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.AMOUNT), {
      target: { value: "2" }
    })
    fireEvent.click(getByTestId("update-lodge-credit-button"))

    expect(mockHandler).toHaveBeenCalledWith("user-123", {
      type: "edit",
      amount: 2
    })
  })

  it("disables input when isLoading is true", () => {
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={0}
        isLoading={true}
      />
    )

    expect(getByTestId(AdminLodgeCreditFormKeys.AMOUNT)).toBeDisabled()
  })

  it("shows loading text when isLoading is true", () => {
    const { getByText } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={0}
        isLoading={true}
      />
    )

    expect(getByText("Loading credit information...")).toBeInTheDocument()
    expect(getByText("Current Balance: Loading...")).toBeInTheDocument()
  })
})
