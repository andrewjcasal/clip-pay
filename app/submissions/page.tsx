import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "../dashboard/header"

export const dynamic = "force-dynamic"

export default async function SubmissionsPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("Session error:", sessionError)
    redirect("/signin")
  }

  if (!session) {
    redirect("/signin")
  }

  const userType = session.user.user_metadata.user_type

  if (userType !== "creator") {
    redirect("/dashboard")
  }

  // Get all submissions for the creator with campaign and brand info
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select(
      `
      *,
      campaign:campaigns (
        title,
        rpm,
        brand:brands (
          profiles (
            organization_name
          )
        )
      )
    `
    )
    .eq("creator_id", session.user.id)
    .order("created_at", { ascending: false })

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
    return <div>Error loading submissions</div>
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="border-b border-zinc-800 bg-[#2B2D31]">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white">My Submissions</h1>
          <DashboardHeader userType={userType} />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-[#2B2D31] rounded-lg p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {submission.campaign.title}
                  </h2>
                  <p className="text-zinc-400">
                    Brand:{" "}
                    {submission.campaign.brand.profiles.organization_name ||
                      "Unnamed Brand"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      submission.status === "approved"
                        ? "bg-green-500/10 text-green-500"
                        : submission.status === "rejected"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {submission.status.charAt(0).toUpperCase() +
                      submission.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <iframe
                  src={submission.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-zinc-400">
                  Submitted:{" "}
                  {new Date(submission.created_at).toLocaleDateString()}
                </div>
                <div className="text-zinc-400">
                  RPM: ${submission.campaign.rpm}
                </div>
              </div>
            </div>
          ))}
          {submissions.length === 0 && (
            <div className="text-center text-zinc-400 py-12">
              No submissions yet. Check the dashboard for available campaigns!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
