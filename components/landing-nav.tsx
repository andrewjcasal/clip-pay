import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingNav({ view }: { view: "brands" | "creators" }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-bold text-white">
              Clip Pay
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/brands"
                className="text-sm text-white/80 hover:text-white"
              >
                Brands
              </Link>
              <Link
                href="/creators"
                className="text-sm text-white/80 hover:text-white"
              >
                Creators
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="text-sm text-white/80 hover:text-white"
            >
              Login
            </Link>
            <Link
              href={view === "brands" ? "/signup/brand" : "/signup/creator"}
            >
              <Button
                variant="outline"
                className="dark:text-white rounded-full border-white/20 text-black hover:bg-zinc/10"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
