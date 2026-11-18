import { fireEvent, render, screen } from "@testing-library/react"
import type { PublicMapPin } from "@/models/MapPin"
import MapPinPopup from "./MapPinPopup"

const pin: PublicMapPin = {
  id: "pin-1",
  type: "sticker",
  caption: "On the chairlift",
  latitude: -39.2,
  longitude: 175.5,
  image_url: "https://firebasestorage.googleapis.com/v0/b/test/o/pin?alt=media",
  // 18 Nov 2026 06:00 UTC, in the shape the server serialises Firestore timestamps
  created_at: { _seconds: 1794981600, _nanoseconds: 0 } as never
}

describe("MapPinPopup", () => {
  it("shows the caption, type and date", () => {
    render(<MapPinPopup pin={pin} />)
    expect(screen.getByText("On the chairlift")).toBeInTheDocument()
    expect(screen.getByText("Sticker")).toBeInTheDocument()
    expect(screen.getByText("18 Nov 2026")).toBeInTheDocument()
    expect(screen.getByRole("img")).toHaveAttribute("alt", "On the chairlift")
  })

  it("only shows delete when allowed", () => {
    const { rerender } = render(<MapPinPopup pin={pin} />)
    expect(screen.queryByText("Delete pin")).not.toBeInTheDocument()

    const onDelete = jest.fn()
    rerender(<MapPinPopup pin={pin} canDelete onDelete={onDelete} />)
    fireEvent.click(screen.getByText("Delete pin"))
    expect(onDelete).toHaveBeenCalledWith("pin-1")
  })

  it("disables delete while deleting", () => {
    render(<MapPinPopup pin={pin} canDelete isDeleting />)
    expect(screen.getByText("Deleting...")).toBeDisabled()
  })
})
