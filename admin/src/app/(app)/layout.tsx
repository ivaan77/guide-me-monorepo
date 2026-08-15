import Image from 'next/image'
import Link from 'next/link'
import { auth, signOut } from '@/auth'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Compass,
  Globe,
  HelpCircle,
  Images,
  LogOut,
  MapPin,
  Newspaper,
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
              Hey<em className="not-italic text-[var(--color-primary)]">Local</em>
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
        <NavLink
          href="/discover/places"
          icon={<Store className="h-4 w-4" />}
          label="Places & Events"
        />
        <NavLink href="/blogs" icon={<Newspaper className="h-4 w-4" />} label="Blog" />
        <NavLink href="/media" icon={<Images className="h-4 w-4" />} label="Media" />
        <NavLink href="/stats" icon={<BarChart3 className="h-4 w-4" />} label="Stats" />
        <NavLink href="/web-content" icon={<Globe className="h-4 w-4" />} label="Web content" />
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
    <Image
      src="/mark.svg"
      alt="HeyLocal mark"
      width={size}
      height={size}
      priority
    />
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
