'use client'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function Mark({ size }: { size: number }) {
  return (
    <Image
      src="/mark.svg"
      alt="HeyLocal mark"
      width={size}
      height={size}
      priority
    />
  )
}

export function LoginForm() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })
      if (res?.error) {
        setError('Invalid username or password.')
      } else if (res?.ok) {
        window.location.assign('/')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Mark size={28} />
          <CardTitle>
            Hey<em className="not-italic text-[var(--color-primary)]">Local</em>
            <span className="text-[var(--color-muted-foreground)]"> · Admin</span>
          </CardTitle>
        </div>
        <CardDescription>Sign in to manage Discover content.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--color-destructive)]">{error}</p>
          )}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
