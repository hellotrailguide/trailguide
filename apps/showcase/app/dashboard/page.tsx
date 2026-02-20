'use client'

import { useState } from 'react'
import { CheckSquare, FolderOpen, MoreHorizontal, Plus, TrendingUp } from 'lucide-react'
import { CreateProjectModal } from '@/components/CreateProjectModal'

const stats = [
  {
    label: 'Active Projects',
    value: '12',
    icon: FolderOpen,
    change: '+2 this month',
    trailId: 'stat-projects',
  },
  {
    label: 'Open Tasks',
    value: '47',
    icon: CheckSquare,
    change: '12 due this week',
    trailId: 'stat-tasks',
  },
  {
    label: 'Avg Completion',
    value: '78%',
    icon: TrendingUp,
    change: '+5% vs last month',
    trailId: 'stat-completion',
  },
]

const recentProjects = [
  { id: '1', name: 'Website Redesign', status: 'In Progress', progress: 65, members: 3 },
  { id: '2', name: 'Mobile App v2', status: 'In Progress', progress: 42, members: 5 },
  { id: '3', name: 'API Integration', status: 'Review', progress: 90, members: 2 },
  { id: '4', name: 'Marketing Q1', status: 'Planning', progress: 15, members: 4 },
]

const activity = [
  { initials: 'AJ', user: 'Alice', action: 'completed', item: 'Design system setup', time: '2h ago' },
  { initials: 'BS', user: 'Bob', action: 'commented on', item: 'Mobile App v2', time: '4h ago' },
  { initials: 'CD', user: 'Carol', action: 'created project', item: 'Brand Refresh', time: 'Yesterday' },
  { initials: 'DL', user: 'David', action: 'joined the team', item: '', time: '2d ago' },
]

const statusColors: Record<string, string> = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Review': 'bg-amber-100 text-amber-700',
  'Planning': 'bg-gray-100 text-gray-700',
  'Complete': 'bg-green-100 text-green-700',
}

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Good morning, Alice 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s what&apos;s happening across your workspace.</p>
        </div>
        <button
          data-trail-id="create-project-btn"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(stat => (
          <div
            key={stat.label}
            data-trail-id={stat.trailId}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent projects */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Projects</h3>
            <a href="/projects" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </a>
          </div>
          <div data-trail-id="projects-list" className="space-y-3">
            {recentProjects.map(project => (
              <div
                key={project.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{project.progress}%</span>
                  </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-indigo-700">{item.initials}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{item.user}</span>{' '}
                    {item.action}
                    {item.item && (
                      <> <span className="font-medium">{item.item}</span></>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
