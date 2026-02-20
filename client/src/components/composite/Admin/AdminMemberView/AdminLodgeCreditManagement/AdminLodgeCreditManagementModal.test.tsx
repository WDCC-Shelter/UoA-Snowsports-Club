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
  it("calls couponUpdateHandler with correct parameters for add operation", () => {
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
      target: { value: "3" }
    })
    fireEvent.click(getByTestId("submit-lodge-credit-button"))

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

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.OPERATION_TYPE), {
      target: { value: "delete" }
    })
    fireEvent.click(getByTestId("submit-lodge-credit-button"))

    expect(mockHandler).toHaveBeenCalledWith("user-123", {
      type: "delete"
    })
  })

  it("calls couponUpdateHandler with correct paramters for update operation", () => {
    const mockHandler = jest.fn()
    const { getByTestId } = render(
      <AdminLodgeCreditManagementModal
        userId="user-123"
        userName="John Doe"
        currentAmount={5}
        couponUpdateHandler={mockHandler}
      />
    )

    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.OPERATION_TYPE), {
      target: { value: "edit" }
    })
    fireEvent.change(getByTestId(AdminLodgeCreditFormKeys.AMOUNT), {
      target: { value: "2" }
    })
    fireEvent.click(getByTestId("submit-lodge-credit-button"))

    expect(mockHandler).toHaveBeenCalledWith("user-123", {
      type: "edit",
      amount: 2
    })
  })
})
