'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
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

  const isAnalytics = pathname.startsWith('/analytics')
  const isHistory = pathname.startsWith('/history')

  return (
    <header className="bg-surface border-b border-border h-16 w-full sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-lg md:px-xl h-full flex items-center justify-between">
        <Link
          href="/"
          className="text-text-primary font-semibold text-base tracking-tight hover:opacity-90 transition-opacity"
        >
          Focaliser
        </Link>
        <nav className="flex items-center gap-md sm:gap-lg h-full">
          <Link
            href="/analytics"
            className={clsx(
              'h-full inline-flex items-center text-sm transition-colors border-b-2',
              isAnalytics
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary font-medium'
            )}
          >
            Analytics
          </Link>
          <Link
            href="/history"
            className={clsx(
              'h-full inline-flex items-center text-sm transition-colors border-b-2',
              isHistory
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary font-medium'
            )}
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
