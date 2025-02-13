import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-black">
              Clip Pay
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/how-it-works"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              How it Works
            </Link>
            <Link
              href="/faq"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              FAQ
            </Link>
            <Link
              href="/login"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Login
            </Link>
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
