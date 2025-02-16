import "@testing-library/jest-dom"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { VideoUrlInput } from "@/components/video-url-input"
import { updateSubmissionVideoUrl } from "@/app/actions/creator"
import { toast } from "sonner"

jest.mock("@/app/actions/creator", () => ({
  updateSubmissionVideoUrl: jest.fn(),
}))

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock("lucide-react", () => ({
  Pencil: () => null,
}))

const mockUpdateSubmissionVideoUrl = updateSubmissionVideoUrl as jest.Mock

describe("VideoUrlInput", () => {
  const mockSubmissionId = "1234"
  const mockCurrentUrl = "https://example.com/video"
  const mockOnUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("displays current URL when provided", () => {
    render(
      <VideoUrlInput
        submissionId={mockSubmissionId}
        currentUrl={mockCurrentUrl}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByText(mockCurrentUrl)).toBeInTheDocument()
  })

  it("shows edit button when current URL exists", () => {
    render(
      <VideoUrlInput
        submissionId={mockSubmissionId}
        currentUrl={mockCurrentUrl}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByTestId("edit-video-url-button")).toBeInTheDocument()
  })

  it("switches to edit mode when edit button is clicked", () => {
    render(
      <VideoUrlInput
        submissionId={mockSubmissionId}
        currentUrl={mockCurrentUrl}
        onUpdate={mockOnUpdate}
      />
    )

    fireEvent.click(screen.getByTestId("edit-video-url-button"))
    expect(screen.getByTestId("video-url-input")).toBeInTheDocument()
    expect(screen.getByTestId("update-video-url-button")).toBeInTheDocument()
  })

  it("updates video URL successfully", async () => {
    const mockResult = { success: true, views: 100 }
    mockUpdateSubmissionVideoUrl.mockResolvedValue(mockResult)

    render(
      <VideoUrlInput
        submissionId={mockSubmissionId}
        currentUrl={mockCurrentUrl}
        onUpdate={mockOnUpdate}
      />
    )

    // Click edit button
    fireEvent.click(screen.getByTestId("edit-video-url-button"))

    // Enter new URL
    const input = screen.getByTestId("video-url-input")
    fireEvent.change(input, {
      target: { value: "https://example.com/new-video" },
    })

    // Click update button
    fireEvent.click(screen.getByTestId("update-video-url-button"))

    await waitFor(() => {
      expect(mockUpdateSubmissionVideoUrl).toHaveBeenCalledWith(
        mockSubmissionId,
        "https://example.com/new-video"
      )
      expect(toast.success).toHaveBeenCalledWith(
        "Video URL updated successfully!"
      )
      expect(mockOnUpdate).toHaveBeenCalledWith(100)
    })
  })

  it("handles update failure", async () => {
    const mockError = "Update failed"
    mockUpdateSubmissionVideoUrl.mockResolvedValue({
      success: false,
      error: mockError,
    })

    render(
      <VideoUrlInput
        submissionId={mockSubmissionId}
        currentUrl={mockCurrentUrl}
        onUpdate={mockOnUpdate}
      />
    )

    // Click edit button
    fireEvent.click(screen.getByTestId("edit-video-url-button"))

    // Enter new URL
    const input = screen.getByTestId("video-url-input")
    fireEvent.change(input, {
      target: { value: "https://example.com/new-video" },
    })

    // Click update button
    fireEvent.click(screen.getByTestId("update-video-url-button"))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(mockError)
      expect(mockOnUpdate).not.toHaveBeenCalled()
    })
  })

  it("disables update button when URL is empty", () => {
    render(
      <VideoUrlInput
        submissionId={mockSubmissionId}
        currentUrl={null}
        onUpdate={mockOnUpdate}
      />
    )

    const input = screen.getByTestId("video-url-input")
    const updateButton = screen.getByTestId("update-video-url-button")

    // Initially the button should be disabled
    expect(updateButton).toHaveAttribute("aria-disabled", "true")

    // Enter URL
    fireEvent.change(input, {
      target: { value: "https://example.com/new-video" },
    })
    expect(updateButton).toHaveAttribute("aria-disabled", "false")

    // Clear URL
    fireEvent.change(input, {
      target: { value: "" },
    })
    expect(updateButton).toHaveAttribute("aria-disabled", "true")
  })

  it("updates display URL and shows success UI after successful submission", async () => {
    const mockSubmissionId = "1234"
    const initialUrl = "https://example.com/video"
    const newUrl = "https://example.com/new-video"
    const mockViews = 100

    mockUpdateSubmissionVideoUrl.mockResolvedValue({
      success: true,
      views: mockViews,
    })

    render(
      <VideoUrlInput
        submissionId={mockSubmissionId}
        currentUrl={initialUrl}
        onUpdate={jest.fn()}
      />
    )

    // Initially shows the current URL
    expect(screen.getByText(initialUrl)).toBeInTheDocument()

    // Click edit button to show input
    fireEvent.click(screen.getByTestId("edit-video-url-button"))

    // Input should be visible with initial URL
    const input = screen.getByTestId("video-url-input")
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue(initialUrl)

    // Enter new URL
    fireEvent.change(input, { target: { value: newUrl } })
    expect(input).toHaveValue(newUrl)

    // Click update button
    fireEvent.click(screen.getByTestId("update-video-url-button"))

    // Wait for update to complete
    await waitFor(() => {
      // Input should be hidden
      expect(screen.queryByTestId("video-url-input")).not.toBeInTheDocument()

      // New URL should be displayed
      expect(screen.getByText(newUrl)).toBeInTheDocument()

      // Success toast should be shown
      expect(toast.success).toHaveBeenCalledWith(
        "Video URL updated successfully!"
      )
    })

    // Edit button should be visible again
    expect(screen.getByTestId("edit-video-url-button")).toBeInTheDocument()
  })
})
