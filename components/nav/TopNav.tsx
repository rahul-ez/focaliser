'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Never render on fullscreen session screen or public auth pages
  if (
    pathname === '/session' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')
  ) {
    return null
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('[components/nav/TopNav:signOut]', err)
    }
  }

  return (
    <header className="bg-surface border-b border-border h-16 w-full">
      <div className="max-w-5xl mx-auto px-xl h-full flex items-center justify-between">
        <Link
          href="/"
          className="text-text-primary font-semibold text-base tracking-tight hover:opacity-90"
        >
          Focaliser
        </Link>
        <nav className="flex items-center gap-lg">
          <Link
            href="/analytics"
            className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
          >
            Analytics
          </Link>
          <Link
            href="/history"
            className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
          >
            Past Sessions
          </Link>
          <Button
            variant="ghost"
            context="chrome"
            onClick={handleSignOut}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Sign out
          </Button>
        </nav>
      </div>
    </header>
  )
}
