'use client'

import { useState } from 'react'
import { MoreHorizontal, UserPlus } from 'lucide-react'
import { InviteModal } from '@/components/InviteModal'

const members = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'Active',
    joined: 'Jan 2024',
    initials: 'AJ',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'Member',
    status: 'Active',
    joined: 'Feb 2024',
    initials: 'BS',
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    role: 'Member',
    status: 'Active',
    joined: 'Feb 2024',
    initials: 'CD',
  },
  {
    id: '4',
    name: 'David Lee',
    email: 'david@example.com',
    role: 'Viewer',
    status: 'Invited',
    joined: '—',
    initials: 'DL',
  },
]

export default function TeamPage() {
  const [showInviteModal, setShowInviteModal] = useState(false)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{members.length} members</p>
        <button
          data-trail-id="invite-member-btn"
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Table */}
      <div
        data-trail-id="team-table"
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                Member
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                Role
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                Joined
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-700">{member.initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{member.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex text-xs px-2 py-1 rounded-full font-medium ${
                      member.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{member.joined}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </div>
  )
}
