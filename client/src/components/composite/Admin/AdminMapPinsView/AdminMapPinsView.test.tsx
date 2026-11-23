import { fireEvent, render, screen } from "@testing-library/react"
import type { AdminMapPin } from "@/models/MapPin"
import AdminMapPinsView, { describeSafeSearch } from "./AdminMapPinsView"

const pin: AdminMapPin = {
  id: "pin-1",
  type: "member_photo",
  latitude: -36.8485,
  longitude: 174.7633,
  image_url: "https://firebasestorage.googleapis.com/v0/b/test/o/pin?alt=media",
  created_at: { _seconds: 1794981600, _nanoseconds: 0 } as never,
  uploader_id: "member-uid",
  moderation_status: "approved"
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

  describe("needs review", () => {
    const flagged: AdminMapPin = {
      ...pin,
      id: "flagged-1",
      moderation_status: "flagged",
      safe_search: {
        adult: "LIKELY",
        racy: "POSSIBLE",
        violence: "VERY_UNLIKELY",
        medical: "VERY_LIKELY",
        spoof: "UNLIKELY"
      }
    }

    it("lists flagged pins with why they were flagged", () => {
      render(
        <AdminMapPinsView
          pins={[pin, flagged]}
          flaggedPins={[flagged]}
          onDelete={jest.fn()}
        />
      )
      expect(screen.getByText("Needs review (1)")).toBeInTheDocument()
      expect(
        screen.getByText("Adult: likely, Racy: possible")
      ).toBeInTheDocument()
      // Shown in the latest list too
      expect(screen.getByText("Hidden, needs review")).toBeInTheDocument()
    })

    it("approves flagged pins", () => {
      const onApprove = jest.fn()
      render(
        <AdminMapPinsView
          pins={[]}
          flaggedPins={[flagged]}
          onDelete={jest.fn()}
          onApprove={onApprove}
        />
      )
      fireEvent.click(screen.getByText("Approve pin"))
      expect(onApprove).toHaveBeenCalledWith("flagged-1")
    })

    it("is hidden when nothing needs review", () => {
      render(<AdminMapPinsView pins={[pin]} onDelete={jest.fn()} />)
      expect(screen.queryByText(/Needs review/)).not.toBeInTheDocument()
    })
  })

  it("describes only notable SafeSearch results", () => {
    expect(describeSafeSearch(undefined)).toBeUndefined()
    expect(
      describeSafeSearch({
        adult: "VERY_UNLIKELY",
        racy: "UNLIKELY",
        violence: "VERY_LIKELY",
        medical: "VERY_LIKELY",
        spoof: "VERY_LIKELY"
      })
    ).toBe("Violence: very likely")
  })

  it("opens editing for a pin", () => {
    const onEdit = jest.fn()
    render(
      <AdminMapPinsView pins={[pin]} onDelete={jest.fn()} onEdit={onEdit} />
    )
    fireEvent.click(screen.getByText("Edit pin"))
    expect(onEdit).toHaveBeenCalledWith(pin)
  })
})
