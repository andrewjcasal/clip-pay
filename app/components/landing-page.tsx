"use client"

import { LandingNav } from "@/components/landing-nav"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const brandsContent = {
  hero: {
    title: "Go Viral with Performance-Based Creators",
    description:
      "Access 100s of talented creators who work on a CPM basis and skyrocket your brand's visibility",
    cta: {
      text: "Launch a Campaign",
      link: "/signup/brand",
    },
  },
  features: {
    title: "Why Brands love ClipPay",
    items: [
      {
        title: "Performance-Based Model",
        description:
          "Only pay for actual performance, ensuring your marketing budget is spent efficiently.",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        ),
      },
      {
        title: "Cost-Effective Advertising",
        description:
          "Only pay for actual performance, ensuring your marketing budget is spent efficiently.",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        ),
      },
      {
        title: "Access to Diverse Creators",
        description:
          "Connect with a diverse pool of talented creators across different niches and platforms.",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        ),
      },
      {
        title: "Real-time Analytics",
        description:
          "Track campaign performance in real-time with detailed analytics and insights.",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        ),
      },
    ],
  },
  howItWorks: {
    title: "How it Works for Brands",
    steps: [
      {
        number: 1,
        title: "Launch a Campaign",
        description: "Set your campaign goals, budget, and requirements",
      },
      {
        number: 2,
        title: "Creators Submit Videos",
        description: "Review and approve creator submissions",
      },
      {
        number: 3,
        title: "Watch the Views Roll In",
        description: "Track performance and only pay for results",
      },
    ],
  },
}

const creatorsContent = {
  hero: {
    title: "Get Paid to Create Content",
    description:
      "Join our platform and earn money for every view your content generates. No upfront costs, just pure creativity.",
    cta: {
      text: "Start Creating",
      link: "/signup/creator",
    },
  },
  features: {
    title: "Why Creators love ClipPay",
    items: [
      {
        title: "Performance-Based Pay",
        description:
          "Get paid for every view your content generates. The more engagement, the more you earn!",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        ),
      },
      {
        title: "Work with Top Brands",
        description:
          "Connect with established brands looking for authentic creators like you.",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        ),
      },
      {
        title: "Flexible Campaigns",
        description:
          "Choose projects that match your style and create on your schedule.",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        ),
      },
    ],
  },
  howItWorks: {
    title: "How it Works for Creators",
    steps: [
      {
        number: 1,
        title: "Join Clip Pay",
        description: "Create your Creator Account",
      },
      {
        number: 2,
        title: "Browse Campaigns",
        description: "Find brands that match your style",
      },
      {
        number: 3,
        title: "Create Content",
        description: "Produce videos based on campaign briefs",
      },
      {
        number: 4,
        title: "Earn Money",
        description: "Get paid for the views your content generates",
      },
    ],
  },
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="py-9 px-4 relative bg-[#f5f5f5] rounded-lg drop-shadow-md">
      <div className="absolute lg:right-[10px] lg:top-[24px] md:right-[8px] md:top-[24px] top-[10px] right-[10px]">
        <div className="w-12 h-12 rounded-full bg-[#ccc]/10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[#333]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {icon}
          </svg>
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold text-zinc-700 mb-2">{title}</h3>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="relative">
      <div className="flex items-start mb-4 justify-start align-top">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-600 flex items-center justify-center text-zinc-600 font-semibold">
          {number}
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <p className="text-zinc-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

interface LandingPageProps {
  view: "brands" | "creators"
}

export function LandingPage({ view }: LandingPageProps) {
  const content = view === "brands" ? brandsContent : creatorsContent

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <LandingNav view={view} />

      <main className="pt-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-16 mt-16 bg-gradient-to-br from-[#E8F0FF] via-[#E0ECFF] to-[#F5E8FF] rounded-[32px] p-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold text-zinc-900">
              {content.hero.title}
            </h1>
            <p className="text-md text-zinc-600 max-w-md mx-auto -mt-4">
              {content.hero.description}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href={content.hero.cta.link}>
                <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4]">
                  {content.hero.cta.text}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-zinc-500">
              No credit card needed • Unlimited time on Free plan
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-4">
          <h2 className="text-3xl font-bold text-center text-black mb-8">
            {content.features.title}
          </h2>
          <div
            className={`grid gap-8 ${
              view === "brands"
                ? "md:grid-cols-2 lg:grid-cols-2"
                : "md:grid-cols-3 lg:grid-cols-3"
            }`}
          >
            {content.features.items.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-br from-[#E8F0FF] via-[#E0ECFF] to-[#F5E8FF] rounded-[32px] p-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-8 text-center">
              Join the ClipPay Revolution
            </h2>
            <div className="text-zinc-500 text-base max-w-md mx-auto mb-8 text-center">
              Whether you're a brand looking to boost your visibility or a
              creator ready to monetize your talent, ClipPay is your gateway to
              success in the digital content world.
            </div>
            <div className="flex items-center justify-center">
              <Link href="/signup/creator">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-zinc-800 rounded-full rounded-xl p-[2px]">
                  <div className="text-md bg-white rounded-xl w-[300px] flex items-center justify-center p-2">
                    Start Your Creator Journey{" "}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h2 className="text-3xl text-zinc-900 font-bold text-center mb-8">
            {content.howItWorks.title}
          </h2>
          <div
            className={`grid gap-8 items-center justify-center ${
              view === "brands"
                ? "md:grid-cols-2 lg:grid-cols-2"
                : "md:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {content.howItWorks.steps.map((step) => (
              <StepCard
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-6 mt-6 text-zinc-900">
          {view === "brands"
            ? "Ready to Boost Your Brand with Creator Content?"
            : "Ready to Monetize Your Creativity?"}
        </h2>
        {/* CTA Section */}
        <div className="bg-[#7a7aaa] border-y border-[#5865F2]/10">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mx-auto">
            <div className="text-center flex items-center justify-center">
              <p className="text-lg text-white mr-4">
                {view === "brands"
                  ? "Connect with talented creators to amplify your brand message."
                  : "Join Clip Pay and start earning for your creative content today."}
              </p>
              <Link
                href={view === "brands" ? "/signup/brand" : "/signup/creator"}
              >
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-zinc-800 rounded-full rounded-xl p-[2px]">
                  <div className="text-md bg-[#7a7aaa] rounded-xl w-[200px] flex items-center justify-center p-2 text-white">
                    Get Started Now <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center space-x-4 text-sm text-zinc-600">
                <Link href="/terms" className="hover:text-zinc-900">
                  Terms of Service
                </Link>
                <span className="text-zinc-300">•</span>
                <Link href="/privacy" className="hover:text-zinc-900">
                  Privacy Policy
                </Link>
              </div>
              <p className="text-sm text-zinc-500">
                © {new Date().getFullYear()} Clip Pay. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
