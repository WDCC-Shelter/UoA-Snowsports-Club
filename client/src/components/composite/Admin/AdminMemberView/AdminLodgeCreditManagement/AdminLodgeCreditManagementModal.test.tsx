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

  const defaultCurrentAmount = { anyNight: 5, weekNightsOnly: 3 }

  it("displays current balance prominently", () => {
    const { getByText } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={defaultCurrentAmount}
      />
    )

    expect(getByText("Current Balance")).toBeInTheDocument()
    expect(getByText("5")).toBeInTheDocument() // anyNight
    expect(getByText("3")).toBeInTheDocument() // weekNightsOnly
  })

  it("calls onUpdateCredits with userId and new amount object", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={defaultCurrentAmount}
        onUpdateCredits={mockHandler}
      />
    )

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.ANY_NIGHT), {
      target: { value: "10" }
    })
    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.WEEK_NIGHTS_ONLY), {
      target: { value: "7" }
    })
    fireEvent.click(getByTestId("set-credits-button"))

    expect(mockHandler).toHaveBeenCalledWith("user-123", {
      anyNight: 10,
      weekNightsOnly: 7
    })
  })

  it("can set credits to 0", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={defaultCurrentAmount}
        onUpdateCredits={mockHandler}
      />
    )

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.ANY_NIGHT), {
      target: { value: "0" }
    })
    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.WEEK_NIGHTS_ONLY), {
      target: { value: "0" }
    })
    fireEvent.click(getByTestId("set-credits-button"))

    expect(mockHandler).toHaveBeenCalledWith("user-123", {
      anyNight: 0,
      weekNightsOnly: 0
    })
  })

  it("disables input when isLoading is true", () => {
    const { queryByTestId, getByText } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={{ anyNight: 0, weekNightsOnly: 0 }}
        isLoading={true}
      />
    )

    expect(
      queryByTestId(AdminLodgeCreditFormKeys.ANY_NIGHT)
    ).not.toBeInTheDocument()
    expect(
      queryByTestId(AdminLodgeCreditFormKeys.WEEK_NIGHTS_ONLY)
    ).not.toBeInTheDocument()
    expect(getByText("Loading...")).toBeInTheDocument()
  })

  it("shows loading indicator for balance when isLoading is true", () => {
    const { getAllByText } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={{ anyNight: 0, weekNightsOnly: 0 }}
        isLoading={true}
      />
    )

    // Both credit types show "..." when loading
    expect(getAllByText("...")).toHaveLength(2)
  })

  it("updates only anyNight credits", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={defaultCurrentAmount}
        onUpdateCredits={mockHandler}
      />
    )

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.ANY_NIGHT), {
      target: { value: "10" }
    })
    // weekNightsOnly stays at default (3)
    fireEvent.click(getByTestId("set-credits-button"))

    // Only anyNight should be in the callback since weekNightsOnly didn't change
    expect(mockHandler).toHaveBeenCalledWith("user-123", {
      anyNight: 10
    })
  })

  it("updates only weekNightsOnly credits when anyNight unchanged", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={defaultCurrentAmount}
        onUpdateCredits={mockHandler}
      />
    )

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.WEEK_NIGHTS_ONLY), {
      target: { value: "10" }
    })
    // anyNight stays at default (5)
    fireEvent.click(getByTestId("set-credits-button"))

    // Only weekNightsOnly should be in the callback since anyNight didn't change
    expect(mockHandler).toHaveBeenCalledWith("user-123", {
      weekNightsOnly: 10
    })
  })

  it("does not call onUpdateCredits when no values changed", () => {
    const mockHandler = jest.fn()
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={defaultCurrentAmount}
        onUpdateCredits={mockHandler}
      />
    )

    // Don't change any values, just submit
    fireEvent.click(getByTestId("set-credits-button"))

    expect(alertSpy).toHaveBeenCalledWith(
      "The new amounts are the same as the current amounts."
    )
    expect(mockHandler).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })
})
