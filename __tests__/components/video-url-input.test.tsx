import "@testing-library/jest-dom"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { VideoUrlInput } from "@/components/video-url-input"
import { updateSubmissionVideoUrl } from "@/app/actions/creator"
import { toast } from "sonner"

// Mock the dependencies
jest.mock("@/app/actions/creator")
jest.mock("sonner")

describe("VideoUrlInput", () => {
  const mockSubmissionId = "123"
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
    ;(updateSubmissionVideoUrl as jest.Mock).mockResolvedValue(mockResult)

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
      expect(updateSubmissionVideoUrl).toHaveBeenCalledWith(
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
    ;(updateSubmissionVideoUrl as jest.Mock).mockResolvedValue({
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
        currentUrl={mockCurrentUrl}
        onUpdate={mockOnUpdate}
      />
    )

    // Click edit button
    fireEvent.click(screen.getByTestId("edit-video-url-button"))

    const updateButton = screen.getByTestId("update-video-url-button")
    expect(updateButton).toBeDisabled()

    // Enter URL
    const input = screen.getByTestId("video-url-input")
    fireEvent.change(input, {
      target: { value: "https://example.com/new-video" },
    })

    expect(updateButton).not.toBeDisabled()
  })
})
