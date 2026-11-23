import { act, fireEvent, render, screen } from "@testing-library/react"
import type { AdminMapPin } from "@/models/MapPin"
import EditMapPinForm, { getMapPinChanges } from "./EditMapPinForm"

const pin: AdminMapPin = {
  id: "pin-1",
  type: "sticker",
  caption: "Old caption",
  latitude: -39.2312,
  longitude: 175.5594,
  image_url: "https://firebasestorage.googleapis.com/v0/b/test/o/pin?alt=media",
  created_at: { _seconds: 1794981600, _nanoseconds: 0 } as never,
  uploader_id: "member-uid",
  moderation_status: "approved"
}

const original = {
  type: pin.type,
  caption: pin.caption as string,
  location: { latitude: pin.latitude, longitude: pin.longitude }
}

describe("getMapPinChanges", () => {
  it("returns nothing when nothing changed", () => {
    expect(getMapPinChanges(pin, original)).toEqual({})
    // Whitespace around the caption doesn't count as a change
    expect(
      getMapPinChanges(pin, { ...original, caption: "  Old caption " })
    ).toEqual({})
  })

  it("returns only the fields that changed", () => {
    expect(
      getMapPinChanges(pin, {
        ...original,
        type: "member_photo",
        location: { latitude: -36.8, longitude: 174.7 }
      })
    ).toEqual({ type: "member_photo", latitude: -36.8, longitude: 174.7 })
  })

  it("sends an empty caption to remove it", () => {
    expect(getMapPinChanges(pin, { ...original, caption: "  " })).toEqual({
      caption: ""
    })
  })
})

describe("EditMapPinForm", () => {
  const renderForm = () => {
    const onSave = jest.fn()
    const onCancel = jest.fn()
    let moveTo: ((l: { latitude: number; longitude: number }) => void) | null =
      null
    render(
      <EditMapPinForm
        pin={pin}
        renderLocationPicker={(_, onChange) => {
          moveTo = onChange
          return <div>map</div>
        }}
        onSave={onSave}
        onCancel={onCancel}
      />
    )
    return {
      onSave,
      onCancel,
      moveTo: (l: { latitude: number; longitude: number }) => moveTo?.(l)
    }
  }

  it("starts with the pin's values and can't be saved unchanged", () => {
    renderForm()
    expect(screen.getByRole("textbox")).toHaveValue("Old caption")
    expect(screen.getByLabelText("Sticker")).toBeChecked()
    expect(screen.getByText("Save")).toBeDisabled()
  })

  it("saves only what changed", () => {
    const { onSave } = renderForm()
    fireEvent.click(screen.getByLabelText("Member photo"))
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "New caption" }
    })
    fireEvent.click(screen.getByText("Save"))
    expect(onSave).toHaveBeenCalledWith({
      type: "member_photo",
      caption: "New caption"
    })
  })

  it("saves a new location from the map", () => {
    const { onSave, moveTo } = renderForm()
    act(() => moveTo({ latitude: -36.8, longitude: 174.7 }))
    fireEvent.click(screen.getByText("Save"))
    expect(onSave).toHaveBeenCalledWith({ latitude: -36.8, longitude: 174.7 })
  })

  it("cancels with the button or Escape", () => {
    const { onCancel } = renderForm()
    fireEvent.click(screen.getByText("Cancel"))
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onCancel).toHaveBeenCalledTimes(2)
  })
})
