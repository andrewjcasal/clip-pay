"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

export const LandingContent = () => {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Image
                src="/placeholder.svg?height=32&width=32"
                alt="ClipPay Logo"
                width={32}
                height={32}
              />
              <span className="text-xl font-semibold">ClipPay</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button className="flex items-center text-gray-600 hover:text-gray-900">
                Products <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <button className="flex items-center text-gray-600 hover:text-gray-900">
                Solutions <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <button className="flex items-center text-gray-600 hover:text-gray-900">
                Resources <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/signin")}>
              Log in
            </Button>
            <Button variant="outline" className="hidden md:inline-flex">
              Contact sales
            </Button>
            <Button
              className="bg-[#5034FF] hover:bg-[#3A1DFF]"
              onClick={() => router.push("/signup")}
            >
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#F5F5FF] py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="flex justify-center mb-6">
            <div className="flex items-center px-4 py-1 bg-white rounded-full">
              <Image
                src="/placeholder.svg?height=24&width=24"
                alt="ClipPay Icon"
                width={24}
                height={24}
              />
              <span className="ml-2 text-sm font-medium">creator platform</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Made for creators,
            <br />
            designed to convert
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with top brands and monetize your content through
            performance-based campaigns. Track your success and scale your
            influence.
          </p>
          <Button
            className="bg-[#5034FF] hover:bg-[#3A1DFF] h-12 px-8 text-lg"
            onClick={() => router.push("/signup")}
          >
            Get Started <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            No credit card needed • Unlimited time on Free plan
          </p>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Brands Side */}
            <div>
              <h2 className="text-2xl font-semibold mb-8 text-center">
                Trusted by Leading Brands
              </h2>
              <div className="grid grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`brand-${i}`}
                    className="flex items-center justify-center"
                  >
                    <Image
                      src="/placeholder.svg?height=60&width=120"
                      alt={`Brand ${i + 1}`}
                      width={120}
                      height={60}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-lg font-medium text-gray-900 mb-2">$10M+</p>
                <p className="text-sm text-gray-600">Paid to creators</p>
              </div>
            </div>

            {/* Creators Side */}
            <div>
              <h2 className="text-2xl font-semibold mb-8 text-center">
                Top Performing Creators
              </h2>
              <div className="grid grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`creator-${i}`}
                    className="flex items-center justify-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Image
                        src="/placeholder.svg?height=80&width=80"
                        alt={`Creator ${i + 1}`}
                        width={80}
                        height={80}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-lg font-medium text-gray-900 mb-2">1M+</p>
                <p className="text-sm text-gray-600">Views generated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Campaign Management",
                description:
                  "Track and manage all your brand collaborations in one place",
              },
              {
                title: "Performance Analytics",
                description:
                  "Real-time insights into your content's performance and earnings",
              },
              {
                title: "Automated Payments",
                description:
                  "Get paid automatically when your content hits the agreed metrics",
              },
              {
                title: "Brand Matching",
                description:
                  "AI-powered matching with brands that fit your audience",
              },
              {
                title: "Content Calendar",
                description:
                  "Plan and schedule your branded content efficiently",
              },
              {
                title: "Engagement Tracking",
                description:
                  "Monitor how your audience interacts with sponsored content",
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">
            Ready to grow your influence?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of creators who are building their business with
            ClipPay
          </p>
          <Button
            className="bg-[#5034FF] hover:bg-[#3A1DFF] h-12 px-8 text-lg"
            onClick={() => router.push("/signup")}
          >
            Start Creating <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/placeholder.svg?height=24&width=24"
                  alt="ClipPay Logo"
                  width={24}
                  height={24}
                />
                <span className="font-semibold">ClipPay</span>
              </div>
              <p className="text-sm text-gray-600">
                The leading platform for creator monetization
              </p>
            </div>
            {/* ... rest of the footer columns ... */}
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              © 2024 ClipPay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
