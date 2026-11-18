import { fireEvent, render, screen } from "@testing-library/react"
import type { AdminMapPin } from "@/models/MapPin"
import AdminMapPinsView from "./AdminMapPinsView"

const pin: AdminMapPin = {
  id: "pin-1",
  type: "member_photo",
  latitude: -36.8485,
  longitude: 174.7633,
  image_url: "https://firebasestorage.googleapis.com/v0/b/test/o/pin?alt=media",
  created_at: { _seconds: 1794981600, _nanoseconds: 0 } as never,
  uploader_id: "member-uid"
}

describe("AdminMapPinsView", () => {
  it("shows the uploader and lets admins delete", () => {
    const onDelete = jest.fn()
    render(<AdminMapPinsView pins={[pin]} onDelete={onDelete} />)

    expect(screen.getByText("Uploaded by member-uid")).toBeInTheDocument()
    expect(screen.getByText("View on map")).toHaveAttribute(
      "href",
      "/map?lat=-36.8485&lng=174.7633&zoom=15&pin=pin-1"
    )
    fireEvent.click(screen.getByText("Delete pin"))
    expect(onDelete).toHaveBeenCalledWith("pin-1")
  })

  it("loads more pins", () => {
    const onLoadMore = jest.fn()
    render(
      <AdminMapPinsView
        pins={[pin]}
        onDelete={jest.fn()}
        hasMore
        onLoadMore={onLoadMore}
      />
    )
    fireEvent.click(screen.getByText("Load more"))
    expect(onLoadMore).toHaveBeenCalled()
  })

  it("says when there are no pins", () => {
    render(<AdminMapPinsView pins={[]} onDelete={jest.fn()} />)
    expect(
      screen.getByText("No pins have been posted yet.")
    ).toBeInTheDocument()
  })
})
