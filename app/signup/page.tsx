import { AuthForm } from '@/components/auth/AuthForm'

export default function SignupPage() {
  return (
    <div className="max-w-5xl mx-auto px-xl py-2xl w-full flex flex-col items-center justify-center flex-1">
      <AuthForm mode="signup" />
    </div>
  )
}
