import "@testing-library/jest-dom"
import { render, screen, fireEvent } from "@testing-library/react"
import { CreatorDashboardClient } from "@/app/dashboard/creator-client"
import { VideoPlayer } from "@/components/video-player"

// Mock the VideoPlayer component
jest.mock("@/components/video-player", () => ({
  VideoPlayer: jest.fn(() => null),
}))

// Mock the necessary components and functions
jest.mock("@/components/dashboard-header", () => ({
  DashboardHeader: () => null,
}))

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Upload: () => null,
  Share: () => null,
  X: () => null,
  DollarSign: () => null,
  Users: () => null,
  ArrowUpRight: () => null,
  RotateCw: () => null,
  Pencil: () => null,
}))

// Mock UI components
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => children,
  DialogContent: ({ children }: { children: React.ReactNode }) => children,
  DialogTitle: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
    variant,
    size,
  }: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
    variant?: string
    size?: string
  }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}))

jest.mock("@/components/video-url-input", () => ({
  VideoUrlInput: () => null,
}))

jest.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => <div className={className}>{children}</div>,
}))

jest.mock("@/components/ui/input", () => ({
  Input: ({
    id,
    type,
    accept,
    onChange,
    className,
  }: {
    id?: string
    type?: string
    accept?: string
    onChange?: (e: any) => void
    className?: string
  }) => (
    <input
      id={id}
      type={type}
      accept={accept}
      onChange={onChange}
      className={className}
    />
  ),
}))

jest.mock("@/components/ui/label", () => ({
  Label: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}))

jest.mock("@/app/dashboard/actions", () => ({
  submitVideo: jest.fn(),
  getCreatorCampaigns: jest.fn(),
  updateSubmissionVideoUrl: jest.fn(),
  checkForNotifications: jest.fn(),
  markNotificationAsSeen: jest.fn(),
}))

describe("CreatorDashboardClient", () => {
  const mockCampaign = {
    id: "campaign-1",
    title: "Test Campaign",
    budget_pool: "1000",
    remaining_budget: 1000,
    rpm: "10",
    guidelines: "Test guidelines",
    status: "active",
    video_outline: "Test outline",
    brand: {
      name: "Test Brand",
      payment_verified: true,
    },
    submission: {
      id: "submission-1",
      status: "pending",
      video_url: null,
      file_path: "/test/path.mp4",
      campaign_id: "campaign-1",
      views: 0,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders VideoPlayer when submission has file_path", () => {
    render(
      <CreatorDashboardClient
        transformedCampaigns={[mockCampaign]}
        email="test@example.com"
      />
    )

    // Click on the campaign to open details
    fireEvent.click(screen.getByText("Test Campaign"))

    // Verify VideoPlayer was called with correct props
    expect(VideoPlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/test/path.mp4",
        isSupabaseStorage: true,
      }),
      undefined
    )
  })

  it("does not render VideoPlayer when submission has no file_path", () => {
    const campaignWithoutVideo = {
      ...mockCampaign,
      submission: {
        ...mockCampaign.submission,
        file_path: null,
      },
    }

    render(
      <CreatorDashboardClient
        transformedCampaigns={[campaignWithoutVideo]}
        email="test@example.com"
      />
    )

    // Click on the campaign to open details
    fireEvent.click(screen.getByText("Test Campaign"))

    // Verify VideoPlayer was not called
    expect(VideoPlayer).not.toHaveBeenCalled()
  })

  it("renders VideoPlayer in video modal when submission exists", () => {
    render(
      <CreatorDashboardClient
        transformedCampaigns={[mockCampaign]}
        email="test@example.com"
      />
    )

    // Click on the campaign to open details
    fireEvent.click(screen.getByText("Test Campaign"))

    // Verify both VideoPlayer calls
    expect(VideoPlayer).toHaveBeenCalledTimes(2)

    // First call - regular video player
    expect(VideoPlayer).toHaveBeenNthCalledWith(
      1,
      {
        url: "/test/path.mp4",
        isSupabaseStorage: true,
      },
      undefined
    )

    // Second call - video modal with autoPlay
    expect(VideoPlayer).toHaveBeenNthCalledWith(
      2,
      {
        url: "/test/path.mp4",
        isSupabaseStorage: true,
        autoPlay: true,
      },
      undefined
    )
  })
})
