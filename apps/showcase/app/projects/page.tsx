'use client'

import { useState } from 'react'
import { Calendar, MoreHorizontal, Plus, Users } from 'lucide-react'
import { CreateProjectModal } from '@/components/CreateProjectModal'

const projects = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the marketing website with new design system',
    status: 'In Progress',
    progress: 65,
    members: 3,
    dueDate: 'Mar 15',
  },
  {
    id: '2',
    name: 'Mobile App v2',
    description: 'New features and redesigned UI for iOS and Android',
    status: 'In Progress',
    progress: 42,
    members: 5,
    dueDate: 'Apr 30',
  },
  {
    id: '3',
    name: 'API Integration',
    description: 'Stripe, Zapier, and HubSpot integrations for enterprise customers',
    status: 'Review',
    progress: 90,
    members: 2,
    dueDate: 'Feb 28',
  },
  {
    id: '4',
    name: 'Marketing Q1',
    description: 'Q1 campaigns, content calendar, and product launch events',
    status: 'Planning',
    progress: 15,
    members: 4,
    dueDate: 'Mar 31',
  },
  {
    id: '5',
    name: 'Data Analytics',
    description: 'Internal analytics dashboard for product and growth metrics',
    status: 'Complete',
    progress: 100,
    members: 3,
    dueDate: 'Jan 31',
  },
  {
    id: '6',
    name: 'Brand Refresh',
    description: 'Updated visual identity, design tokens, and component library',
    status: 'Planning',
    progress: 8,
    members: 2,
    dueDate: 'May 15',
  },
]

const statusColors: Record<string, string> = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Review': 'bg-amber-100 text-amber-700',
  'Planning': 'bg-gray-100 text-gray-700',
  'Complete': 'bg-green-100 text-green-700',
}

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{projects.length} projects</p>
        <button
          data-trail-id="create-project-btn"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Grid */}
      <div
        data-trail-id="projects-list"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {projects.map(project => (
          <div
            key={project.id}
            data-trail-id="project-card"
            data-project-id={project.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{project.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded -mt-1 -mr-1 flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{project.description}</p>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs font-medium text-gray-700">{project.progress}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {project.members} members
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {project.dueDate}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
