import Link from 'next/link'
import { auth, signOut } from '@/auth'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Compass,
  HelpCircle,
  LogOut,
  MapPin,
  Store,
} from 'lucide-react'

async function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/login' })
      }}
    >
      <Button variant="ghost" size="sm" type="submit" className="gap-2">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </form>
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside className="border-r border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col gap-1">
        <div className="px-2 pb-4 flex items-center gap-2">
          <Mark size={28} />
          <div className="flex flex-col leading-tight">
            <p className="text-base font-semibold">
              Guide<em className="not-italic text-[var(--color-primary)]">Me</em>
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Admin</p>
          </div>
        </div>
        <NavLink href="/discover/cities" icon={<MapPin className="h-4 w-4" />} label="Cities" />
        <NavLink
          href="/discover/excursions"
          icon={<Compass className="h-4 w-4" />}
          label="Excursions"
        />
        <NavLink href="/discover/places" icon={<Store className="h-4 w-4" />} label="Places" />
        <NavLink href="/stats" icon={<BarChart3 className="h-4 w-4" />} label="Stats" />
        <NavLink href="/help" icon={<HelpCircle className="h-4 w-4" />} label="Help" />
        <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <span className="text-xs text-[var(--color-muted-foreground)] truncate pl-2">
            {session?.user?.name}
          </span>
          <SignOutButton />
        </div>
      </aside>
      <main className="p-8 overflow-y-auto">{children}</main>
    </div>
  )
}

function Mark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GuideMe mark"
    >
      <path
        d="M10 50 C 22 50, 30 46, 36 34 S 46 14, 54 14"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="54" cy="14" r="6.5" fill="var(--color-brand-amber)" />
      <circle cx="10" cy="50" r="2.5" fill="var(--color-primary)" opacity=".85" />
    </svg>
  )
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-[var(--color-accent)] transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
