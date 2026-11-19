import { fireEvent, render, screen } from "@testing-library/react"
import NewPinDetailsForm, { type INewPinDetailsForm } from "./NewPinDetailsForm"

const renderForm = (props: Partial<INewPinDetailsForm> = {}) => {
  const handlers = {
    onUseCurrentLocation: jest.fn(),
    onTypeChange: jest.fn(),
    onCaptionChange: jest.fn(),
    onRetake: jest.fn(),
    onSubmit: jest.fn()
  }
  render(
    <NewPinDetailsForm
      previewUrl="blob:preview"
      locationPicker={<div>map</div>}
      hasLocation
      type="sticker"
      caption=""
      {...handlers}
      {...props}
    />
  )
  return handlers
}

describe("NewPinDetailsForm", () => {
  it("submits when there is a location", () => {
    const { onSubmit } = renderForm()
    fireEvent.click(screen.getByText("Post pin"))
    expect(onSubmit).toHaveBeenCalled()
  })

  it("can't be submitted without a location", () => {
    renderForm({ hasLocation: false })
    expect(screen.getByText("Post pin")).toBeDisabled()
    expect(
      screen.getByText("Tap the map to place the pin.")
    ).toBeInTheDocument()
  })

  it("explains where the location came from", () => {
    renderForm({ locationSource: "photo" })
    expect(
      screen.getByText(/Location taken from the photo/)
    ).toBeInTheDocument()
  })

  it("shows location errors instead of the hint", () => {
    renderForm({
      locationSource: "device",
      locationError: "Couldn't get your location"
    })
    expect(screen.getByText("Couldn't get your location")).toBeInTheDocument()
  })

  it("changes the type", () => {
    const { onTypeChange } = renderForm()
    fireEvent.click(screen.getByLabelText("Member photo"))
    expect(onTypeChange).toHaveBeenCalledWith("member_photo")
  })

  it("limits and counts the caption", () => {
    renderForm({ caption: "hello" })
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "140")
    expect(screen.getByText("5/140")).toBeInTheDocument()
  })

  it("disables posting while submitting", () => {
    renderForm({ isSubmitting: true })
    expect(screen.getByText("Posting...")).toBeDisabled()
  })
})
