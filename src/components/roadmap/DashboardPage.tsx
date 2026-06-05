'use client'

import { useState, useEffect } from 'react'
import { Roadmap } from '@/types'
import { getRoadmaps } from '@/lib/db'
import Sidebar from '@/components/roadmap/Sidebar'
import RoadmapFlow from '@/components/roadmap/RoadmapFlow'
import { Loader2, Map } from 'lucide-react'

export default function DashboardPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null)
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRoadmaps().then(list => {
      setRoadmaps(list)
      if (list.length > 0) {
        setActiveRoadmapId(list[0].id)
        setActiveRoadmap(list[0])
      }
      setLoading(false)
    })
  }, [])

  const handleSelectRoadmap = (id: string) => {
    setActiveRoadmapId(id)
    const r = roadmaps.find(r => r.id === id) ?? null
    setActiveRoadmap(r)
  }

  const handleActiveRoadmapChange = (r: Roadmap) => {
    setActiveRoadmap(r)
    setRoadmaps(prev => prev.map(x => x.id === r.id ? r : x))
  }

  const handleRoadmapsChange = (updated: Roadmap[]) => {
    setRoadmaps(updated)
    // If the active roadmap was deleted, set to first available
    if (activeRoadmapId && !updated.find(r => r.id === activeRoadmapId)) {
      const first = updated[0] ?? null
      setActiveRoadmapId(first?.id ?? null)
      setActiveRoadmap(first)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea6c10)' }}>
            <Loader2 size={18} className="text-white animate-spin" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading your roadmaps...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        roadmaps={roadmaps}
        activeRoadmapId={activeRoadmapId}
        onSelectRoadmap={handleSelectRoadmap}
        onRoadmapsChange={handleRoadmapsChange}
        onActiveRoadmapChange={handleActiveRoadmapChange}
      />

      <main className="flex-1 overflow-hidden relative">
        {activeRoadmap ? (
          <RoadmapFlow
            roadmap={activeRoadmap}
            onRoadmapUpdate={handleActiveRoadmapChange}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center animate-slide-up">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-xl font-bold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                No Roadmaps Yet
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Create your first roadmap from the sidebar
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
