'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Loader2, TrendingUp, Users, Target, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { usePageTour } from '@/lib/hooks/use-page-tour'
import { PageTour } from '@/components/help'
import { ANALYTICS_TOUR, TOUR_KEYS } from '@/components/help/tours'

interface AnalyticsEvent {
  id: string
  trail_id: string
  event_type: string
  step_id: string | null
  step_index: number | null
  session_id: string
  created_at: string
}

interface TrailStats {
  trailId: string
  totalStarts: number
  totalCompletes: number
  completionRate: number
  averageSteps: number
  stepDropoffs: { step: number; dropoff: number }[]
}

export default function AnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTrail, setSelectedTrail] = useState<string>('all')
  const [days, setDays] = useState(30)
  const { showTour, complete } = usePageTour(TOUR_KEYS.analytics, { ready: !isLoading })

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({ days: days.toString() })
        if (selectedTrail !== 'all') {
          params.set('trail_id', selectedTrail)
        }

        const response = await fetch(`/api/analytics?${params}`)
        const { events: data, error } = await response.json()

        if (error) {
          console.error('Analytics error:', error)
        } else {
          setEvents(data || [])
        }
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [selectedTrail, days])

  // Get unique trail IDs
  const trailIds = Array.from(new Set(events.map((e) => e.trail_id)))

  // Calculate stats
  const stats = calculateStats(events)

  // Daily completions chart data
  const dailyData = calculateDailyData(events, days)

  // Funnel data (steps progression)
  const funnelData = calculateFunnelData(events)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8" data-tour-target="analytics-header">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your trail performance</p>
          </div>
          <div className="flex items-center gap-4" data-tour-target="analytics-filters">
            <Select value={selectedTrail} onChange={(e) => setSelectedTrail(e.target.value)}>
              <option value="all">All Trails</option>
              {trailIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </Select>
            <Select value={days.toString()} onChange={(e) => setDays(parseInt(e.target.value))}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </Select>
          </div>
        </div>

        <div data-tour-target="analytics-content">
        {events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No analytics data yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Analytics will appear here once users start interacting with your trails.
                {"Make sure you've added the analytics endpoint to your trail configuration."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Starts</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalStarts}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    Unique sessions
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Completions</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalCompletes}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Target className="h-4 w-4 mr-1" />
                    Finished trails
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Completion Rate</CardDescription>
                  <CardTitle className="text-3xl">{stats.completionRate.toFixed(1)}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Of started trails
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg. Steps Viewed</CardDescription>
                  <CardTitle className="text-3xl">{stats.avgStepsViewed.toFixed(1)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    Before completion/skip
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily completions */}
              <Card>
                <CardHeader>
                  <CardTitle>Completions Over Time</CardTitle>
                  <CardDescription>Daily trail completions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="completions"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Step funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Step Funnel</CardTitle>
                  <CardDescription>Drop-off by step</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={60} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))">
                          {funnelData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`hsl(var(--primary) / ${1 - index * 0.15})`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top skipped steps */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Drop-off Points</CardTitle>
                <CardDescription>Steps where users most frequently exit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.dropoffPoints.slice(0, 5).map((point, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">Step {point.step + 1}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {point.count} exits ({point.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div
                        className="h-2 bg-destructive/20 rounded"
                        style={{ width: `${Math.min(point.percentage * 2, 100)}px` }}
                      >
                        <div
                          className="h-full bg-destructive rounded"
                          style={{ width: `${point.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {stats.dropoffPoints.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No drop-off data available yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </div>

      <PageTour trail={ANALYTICS_TOUR} show={showTour} onDismiss={complete} />
    </div>
  )
}

function calculateStats(events: AnalyticsEvent[]) {
  const sessionEvents = new Map<string, AnalyticsEvent[]>()

  events.forEach((e) => {
    if (!sessionEvents.has(e.session_id)) {
      sessionEvents.set(e.session_id, [])
    }
    sessionEvents.get(e.session_id)!.push(e)
  })

  const starts = events.filter((e) => e.event_type === 'trail_started').length
  const completes = events.filter((e) => e.event_type === 'trail_completed').length
  const completionRate = starts > 0 ? (completes / starts) * 100 : 0

  // Calculate avg steps viewed per session
  let totalSteps = 0
  let sessionCount = 0
  sessionEvents.forEach((sessionEvts) => {
    const stepViews = sessionEvts.filter((e) => e.event_type === 'step_viewed')
    if (stepViews.length > 0) {
      totalSteps += stepViews.length
      sessionCount++
    }
  })
  const avgStepsViewed = sessionCount > 0 ? totalSteps / sessionCount : 0

  // Calculate drop-off points
  const skipEvents = events.filter((e) => e.event_type === 'trail_skipped')
  const dropoffCounts = new Map<number, number>()
  skipEvents.forEach((e) => {
    if (e.step_index !== null) {
      dropoffCounts.set(e.step_index, (dropoffCounts.get(e.step_index) || 0) + 1)
    }
  })

  const dropoffPoints = Array.from(dropoffCounts.entries())
    .map(([step, count]) => ({
      step,
      count,
      percentage: starts > 0 ? (count / starts) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalStarts: starts,
    totalCompletes: completes,
    completionRate,
    avgStepsViewed,
    dropoffPoints,
  }
}

function calculateDailyData(events: AnalyticsEvent[], days: number) {
  const dailyCounts = new Map<string, number>()

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0]
    dailyCounts.set(key, 0)
  }

  // Count completions
  events
    .filter((e) => e.event_type === 'trail_completed')
    .forEach((e) => {
      const key = e.created_at.split('T')[0]
      if (dailyCounts.has(key)) {
        dailyCounts.set(key, dailyCounts.get(key)! + 1)
      }
    })

  return Array.from(dailyCounts.entries())
    .map(([date, completions]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completions,
    }))
    .reverse()
}

function calculateFunnelData(events: AnalyticsEvent[]) {
  const stepCounts = new Map<number, number>()

  events
    .filter((e) => e.event_type === 'step_viewed' && e.step_index !== null)
    .forEach((e) => {
      stepCounts.set(e.step_index!, (stepCounts.get(e.step_index!) || 0) + 1)
    })

  return Array.from(stepCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(0, 10)
    .map(([step, count]) => ({
      name: `Step ${step + 1}`,
      count,
    }))
}
