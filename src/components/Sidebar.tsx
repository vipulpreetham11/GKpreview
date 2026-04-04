'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  role: 'admin' | 'worker'
  fullName: string
  department?: string
}

export default function Sidebar({ role, fullName, department }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: '▦' },
    { href: '/admin/users', label: 'Users', icon: '⊕' },
    { href: '/admin/staff', label: 'Staff', icon: '👥' },
    { href: '/admin/salary', label: 'Salaries', icon: '💰' },
    { href: '/admin/budget', label: 'Budgets', icon: '📊' },
    { href: '/admin/audit', label: 'Audit Log', icon: '📋' },
    { href: '/admin/export', label: 'Export', icon: '↓' },
  ]

  const workerLinks = [
    { href: '/worker', label: 'My Expenses', icon: '▦' },
  ]

  const links = role === 'admin' ? adminLinks : workerLinks

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">GK</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">GK Hospitals</p>
            <p className="text-white/40 text-xs">Expense Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              pathname === link.href
                ? 'bg-white/15 text-white font-medium'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-2">
          <p className="text-white text-sm font-medium truncate">{fullName}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {role === 'admin' ? 'Admin' : department}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition"
        >
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0f2744] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/10 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">GK</span>
          </div>
          <span className="text-white font-semibold text-sm">GK Hospitals</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white/70 hover:text-white text-xl"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-[#0f2744]" onClick={e => e.stopPropagation()}>
            <div className="pt-16">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-56 bg-[#0f2744] z-30">
        <SidebarContent />
      </div>
    </>
  )
}
