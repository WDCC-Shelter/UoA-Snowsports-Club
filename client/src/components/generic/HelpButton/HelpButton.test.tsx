import { fireEvent, render, screen } from "@testing-library/react"
import type { PageHelp } from "@/models/sanity/PageHelp/Utils"
import HelpButton from "./HelpButton"

const help: PageHelp = {
  title: "About the map",
  content: [
    {
      _type: "block",
      _key: "a",
      style: "normal",
      markDefs: [],
      children: [
        { _type: "span", _key: "b", text: "Pins show stickers.", marks: [] }
      ]
    }
  ]
}

const open = () =>
  fireEvent.click(screen.getByRole("button", { name: "Help: About the map" }))

describe("HelpButton", () => {
  it("renders nothing when there is no help content", () => {
    const { container } = render(<HelpButton help={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("opens a dialog with the help content", () => {
    render(<HelpButton help={help} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    open()
    const dialog = screen.getByRole("dialog", { name: "About the map" })
    expect(dialog).toHaveTextContent("Pins show stickers.")
  })

  it("closes with the close button", () => {
    render(<HelpButton help={help} />)
    open()
    fireEvent.click(screen.getByRole("button", { name: "Close help" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("closes with Escape", () => {
    render(<HelpButton help={help} />)
    open()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("closes when clicking outside, but not inside, the dialog", () => {
    render(<HelpButton help={help} />)
    open()
    fireEvent.click(screen.getByText("Pins show stickers."))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
