'use client'

import { useState } from 'react'
import { Bell, CreditCard, Save } from 'lucide-react'

type NotificationKey = 'email' | 'inApp' | 'weeklyDigest' | 'projectUpdates'

const notificationSettings: { key: NotificationKey; label: string; description: string }[] = [
  { key: 'email', label: 'Email notifications', description: 'Receive updates via email' },
  { key: 'inApp', label: 'In-app notifications', description: 'Get notified within the app' },
  { key: 'weeklyDigest', label: 'Weekly digest', description: 'A summary of activity each week' },
  { key: 'projectUpdates', label: 'Project updates', description: 'Notify me when projects are updated' },
]

export default function SettingsPage() {
  const [name, setName] = useState('Alice Johnson')
  const [email, setEmail] = useState('alice@example.com')
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    email: true,
    inApp: true,
    weeklyDigest: false,
    projectUpdates: true,
  })

  function toggleNotification(key: NotificationKey) {
    setNotifications(n => ({ ...n, [key]: !n[key] }))
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Profile */}
      <div
        data-trail-id="settings-profile-form"
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      >
        <h2 className="text-base font-semibold text-gray-900 mb-1">Profile</h2>
        <p className="text-sm text-gray-500 mb-6">Update your personal information.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              data-trail-id="settings-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              data-trail-id="settings-email-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            data-trail-id="settings-save-btn"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div
        data-trail-id="settings-notifications"
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">Choose how you want to be notified.</p>

        <div className="space-y-4">
          {notificationSettings.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifications[key]}
                onClick={() => toggleNotification(key)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  notifications[key] ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    notifications[key] ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing */}
      <div
        data-trail-id="settings-billing"
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Billing</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">Manage your subscription and payment details.</p>

        <div className="bg-indigo-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-indigo-900">Pro Plan</p>
            <span className="text-sm font-bold text-indigo-900">$49 / mo</span>
          </div>
          <p className="text-xs text-indigo-700">Renews March 1, 2026 · 5 seats used of 10</p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Manage Payment
          </button>
          <button className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  )
}
