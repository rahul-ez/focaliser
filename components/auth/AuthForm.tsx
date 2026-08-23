'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.')
      return
    }

    if (!isMagicLink && !password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) {
          console.error('[components/auth/AuthForm:signup]', error)
          setErrorMessage('Failed to create account. Please check your details and try again.')
        } else {
          setSuccessMessage('Account created! Redirecting to home...')
          router.push('/')
          router.refresh()
        }
      } else if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) {
          console.error('[components/auth/AuthForm:magicLink]', error)
          setErrorMessage('Failed to send magic link. Please check your email and try again.')
        } else {
          setSuccessMessage('Magic link sent! Please check your inbox.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          console.error('[components/auth/AuthForm:login]', error)
          setErrorMessage('Invalid email or password. Please try again.')
        } else {
          router.push('/')
          router.refresh()
        }
      }
    } catch (err) {
      console.error('[components/auth/AuthForm:submit]', err)
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isSignup = mode === 'signup'

  return (
    <Card className="w-full max-w-md mx-auto flex flex-col gap-lg">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-xs">
          {isSignup
            ? 'Create your account'
            : isMagicLink
            ? 'Sign in with Magic Link'
            : 'Welcome back'}
        </h2>
        <p className="text-sm text-text-secondary">
          {isSignup
            ? 'Start tracking your deep work and focus sessions.'
            : isMagicLink
            ? 'We will email you a passwordless sign-in link.'
            : 'Enter your credentials to access your focus tracker.'}
        </p>
      </div>

      {errorMessage && (
        <Card accentColor="error" className="py-sm px-md">
          <p className="text-error text-xs font-medium">{errorMessage}</p>
        </Card>
      )}

      {successMessage && (
        <Card accentColor="success" className="py-sm px-md">
          <p className="text-success text-xs font-medium">{successMessage}</p>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />

        {!isMagicLink && (
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        )}

        <div className="flex flex-col gap-sm pt-xs">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? isSignup
                ? 'Creating account…'
                : isMagicLink
                ? 'Sending link…'
                : 'Logging in…'
              : isSignup
              ? 'Create account'
              : isMagicLink
              ? 'Send magic link'
              : 'Log in'}
          </Button>

          {!isSignup && (
            <Button
              type="button"
              variant="ghost"
              context="chrome"
              disabled={isLoading}
              onClick={() => {
                setIsMagicLink(!isMagicLink)
                setErrorMessage(null)
                setSuccessMessage(null)
              }}
              className="w-full text-xs"
            >
              {isMagicLink
                ? 'Sign in with password instead'
                : 'Send magic link instead'}
            </Button>
          )}
        </div>
      </form>

      <div className="border-t border-border-light pt-md text-center">
        {isSignup ? (
          <p className="text-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        ) : (
          <p className="text-sm text-text-secondary">
            Don&apos;t have an account yet?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        )}
      </div>
    </Card>
  )
}
