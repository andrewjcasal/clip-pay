import Link from "next/link"
import Image from "next/image"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={120}
              height={40}
              priority
            />
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/legal/privacy"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/terms"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Terms of Service
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  )
}
