import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  )
}
