import { fireEvent, render } from "@testing-library/react"
import AdminLodgeCreditManagementModal, {
  AdminLodgeCreditFormKeys
} from "@/components/composite/Admin/AdminMemberView/AdminLodgeCreditManagement/AdminLodgeCreditManagementModal"

describe("AdminLodgeCreditManagementModal", () => {
  let confirmSpy: jest.SpyInstance
  beforeAll(() => {
    confirmSpy = jest.spyOn(window, "confirm")
    confirmSpy.mockImplementation(jest.fn(() => true))
  })
  afterAll(() => confirmSpy.mockRestore())

  it("displays current balance prominently", () => {
    const { getByText } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={5}
      />
    )

    expect(getByText("Current Balance")).toBeInTheDocument()
    expect(getByText("5")).toBeInTheDocument()
  })

  it("calls onUpdateCredits with userId and new amount", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={5}
        onUpdateCredits={mockHandler}
      />
    )

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.AMOUNT), {
      target: { value: "10" }
    })
    fireEvent.click(getByTestId("set-credits-button"))

    expect(mockHandler).toHaveBeenCalledWith("user-123", 10)
  })

  it("can set credits to 0", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={5}
        onUpdateCredits={mockHandler}
      />
    )

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.AMOUNT), {
      target: { value: "0" }
    })
    fireEvent.click(getByTestId("set-credits-button"))

    expect(mockHandler).toHaveBeenCalledWith("user-123", 0)
  })

  it("disables input when isLoading is true", () => {
    const { queryByTestId, getByText } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={0}
        isLoading={true}
      />
    )

    expect(
      queryByTestId(AdminLodgeCreditFormKeys.AMOUNT)
    ).not.toBeInTheDocument()
    expect(getByText("Loading...")).toBeInTheDocument()
  })

  it("shows loading indicator for balance when isLoading is true", () => {
    const { getByText } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={0}
        isLoading={true}
      />
    )

    expect(getByText("...")).toBeInTheDocument()
  })
})
