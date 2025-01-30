"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  BarChart2,
  Wallet,
  Users,
  Calendar,
  LineChart,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"

export const LandingContent = () => {
  const router = useRouter()

  // Brand logos from reputable tech companies (replace with actual brand partners later)
  const brandLogos = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/603px-Amazon_logo.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/500px-Google_2015_logo.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/500px-Netflix_2015_logo.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/132px-Instagram_logo_2016.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/150px-2021_Facebook_icon.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/292px-Logo_of_Twitter.svg.png",
  ]

  // Creator profile images from diverse stock photos
  const creatorImages = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop",
  ]

  const features = [
    {
      title: "Campaign Management",
      description:
        "Track and manage all your brand collaborations in one place",
      icon: <LayoutDashboard className="w-6 h-6 text-[#5034FF]" />,
    },
    {
      title: "Performance Analytics",
      description:
        "Real-time insights into your content's performance and earnings",
      icon: <BarChart2 className="w-6 h-6 text-[#5034FF]" />,
    },
    {
      title: "Automated Payments",
      description:
        "Get paid automatically when your content hits the agreed metrics",
      icon: <Wallet className="w-6 h-6 text-[#5034FF]" />,
    },
    {
      title: "Brand Matching",
      description: "AI-powered matching with brands that fit your audience",
      icon: <Users className="w-6 h-6 text-[#5034FF]" />,
    },
    {
      title: "Content Calendar",
      description: "Plan and schedule your branded content efficiently",
      icon: <Calendar className="w-6 h-6 text-[#5034FF]" />,
    },
    {
      title: "Engagement Tracking",
      description: "Monitor how your audience interacts with sponsored content",
      icon: <LineChart className="w-6 h-6 text-[#5034FF]" />,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-[#5034FF]" />
              <span className="text-xl font-bold text-gray-900">ClipPay</span>
            </div>
            <div className="hidden lg:flex items-center space-x-6">
              <button className="flex items-center text-gray-700 hover:text-gray-900 font-medium">
                Products <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <button className="flex items-center text-gray-700 hover:text-gray-900 font-medium">
                Solutions <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <button className="flex items-center text-gray-700 hover:text-gray-900 font-medium">
                Resources <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Pricing
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/signin")}
              className="text-gray-700 hover:text-gray-900"
            >
              Log in
            </Button>
            <Button
              variant="outline"
              className="hidden lg:inline-flex border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900"
            >
              Contact sales
            </Button>
            <Button
              className="bg-[#5034FF] hover:bg-[#3A1DFF] text-white whitespace-nowrap"
              onClick={() => router.push("/signup")}
            >
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#F5F5FF] py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=800&fit=crop"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="container mx-auto px-4 text-center max-w-4xl relative">
          <div className="flex justify-center mb-6">
            <div className="flex items-center px-4 py-1 bg-white rounded-full shadow-sm">
              <Zap className="w-6 h-6 text-[#5034FF]" />
              <span className="ml-2 text-sm font-medium text-gray-900">
                creator platform
              </span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            Made for creators,
            <br />
            designed to convert
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with top brands and monetize your content through
            performance-based campaigns. Track your success and scale your
            influence.
          </p>
          <Button
            className="bg-[#5034FF] hover:bg-[#3A1DFF] h-12 px-8 text-lg text-white shadow-lg"
            onClick={() => router.push("/signup")}
          >
            Get Started <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-4 text-sm text-gray-600 font-medium">
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
                Trusted by Leading Brands
              </h2>
              <div className="grid grid-cols-3 gap-8">
                {brandLogos.map((src, i) => (
                  <div
                    key={`brand-${i}`}
                    className="flex items-center justify-center"
                  >
                    <Image
                      src={src}
                      alt={`Brand ${i + 1}`}
                      width={120}
                      height={60}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-2xl font-bold text-gray-900 mb-2">$10M+</p>
                <p className="text-sm text-gray-700 font-medium">
                  Paid to creators
                </p>
              </div>
            </div>

            {/* Creators Side */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
                Top Performing Creators
              </h2>
              <div className="grid grid-cols-3 gap-8">
                {creatorImages.map((src, i) => (
                  <div
                    key={`creator-${i}`}
                    className="flex items-center justify-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden shadow-md">
                      <Image
                        src={src}
                        alt={`Creator ${i + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-2xl font-bold text-gray-900 mb-2">1M+</p>
                <p className="text-sm text-gray-700 font-medium">
                  Views generated
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything you need to succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="mr-3 p-2 bg-[#5034FF]/10 rounded-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#5034FF]">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to grow your influence?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of creators who are building their business with
            ClipPay
          </p>
          <Button
            className="bg-white hover:bg-gray-50 h-12 px-8 text-lg text-[#5034FF] shadow-lg"
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
                <Zap className="w-6 h-6 text-[#5034FF]" />
                <span className="font-bold text-gray-900">ClipPay</span>
              </div>
              <p className="text-sm text-gray-700">
                The leading platform for creator monetization
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
