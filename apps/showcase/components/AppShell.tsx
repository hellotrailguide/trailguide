'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ExternalLink,
  FolderOpen,
  HelpCircle,
  Keyboard,
  LayoutDashboard,
  PlayCircle,
  Settings,
  Users,
} from 'lucide-react'
import { TrailRunner } from './TrailRunner'

function CrestLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 16L10 4l7 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 16L10 10l3.5 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>
      </div>
      <span className="text-lg font-semibold text-gray-900 tracking-tight">Crest</span>
    </div>
  )
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, trailId: 'nav-dashboard' },
  { href: '/projects', label: 'Projects', icon: FolderOpen, trailId: 'nav-projects' },
  { href: '/team', label: 'Team', icon: Users, trailId: 'nav-team' },
  { href: '/settings', label: 'Settings', icon: Settings, trailId: 'nav-settings' },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/team': 'Team',
  '/settings': 'Settings',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [helpOpen, setHelpOpen] = useState(false)
  const [activeTour, setActiveTour] = useState<string | null>(null)
  const helpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false)
      }
    }
    if (helpOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [helpOpen])

  const pageTitle = pageTitles[pathname] ?? 'Crest'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        data-trail-id="sidebar"
        className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-200">
          <CrestLogo />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, trailId }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                data-trail-id={trailId}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-indigo-700">AJ</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Alice Johnson</p>
              <p className="text-xs text-gray-500 truncate">alice@example.com</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>

          {/* Help menu */}
          <div className="relative" ref={helpRef}>
            <button
              data-trail-id="help-btn"
              onClick={() => setHelpOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>

            {helpOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                  onClick={() => setHelpOpen(false)}
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  Documentation
                </button>
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                  onClick={() => setHelpOpen(false)}
                >
                  <Keyboard className="w-4 h-4 text-gray-400" />
                  Keyboard Shortcuts
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  data-trail-id="help-demo"
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 text-left font-medium"
                  onClick={() => {
                    setHelpOpen(false)
                    setActiveTour('welcome')
                  }}
                >
                  <PlayCircle className="w-4 h-4" />
                  Trailguide Demo
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Tour runner */}
      <TrailRunner tourName={activeTour} onClose={() => setActiveTour(null)} />
    </div>
  )
}
