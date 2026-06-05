'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, LogOut, Zap, Search, Palette } from 'lucide-react'
import { Roadmap, Topic } from '@/types'
import { createRoadmap, deleteRoadmap, updateRoadmap, addTopic, deleteTopic, updateTopic } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { calculateRoadmapProgress, calculateTopicProgress, TOPIC_COLORS, cn } from '@/lib/utils'

interface SidebarProps {
  roadmaps: Roadmap[]
  activeRoadmapId: string | null
  onSelectRoadmap: (id: string) => void
  onRoadmapsChange: (roadmaps: Roadmap[]) => void
  onActiveRoadmapChange: (r: Roadmap) => void
}

export default function Sidebar({ roadmaps, activeRoadmapId, onSelectRoadmap, onRoadmapsChange, onActiveRoadmapChange }: SidebarProps) {
  const { logout } = useAuth()
  const [creatingRoadmap, setCreatingRoadmap] = useState(false)
  const [newRoadmapTitle, setNewRoadmapTitle] = useState('')
  const [creatingTopic, setCreatingTopic] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null)
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState(TOPIC_COLORS[0])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [colorIndex, setColorIndex] = useState(0)

  const activeRoadmap = roadmaps.find(r => r.id === activeRoadmapId) ?? null

  const handleCreateRoadmap = async () => {
    if (!newRoadmapTitle.trim()) return
    setLoading(true)
    try {
      const r = await createRoadmap(newRoadmapTitle.trim())
      onRoadmapsChange([...roadmaps, r])
      onSelectRoadmap(r.id)
      setCreatingRoadmap(false)
      setNewRoadmapTitle('')
    } finally { setLoading(false) }
  }

  const handleDeleteRoadmap = async (id: string) => {
    if (!confirm('Delete this roadmap?')) return
    await deleteRoadmap(id)
    const updated = roadmaps.filter(r => r.id !== id)
    onRoadmapsChange(updated)
    if (activeRoadmapId === id) onSelectRoadmap(updated[0]?.id ?? '')
  }

  const handleEditRoadmap = async (id: string) => {
    if (!editTitle.trim()) return
    await updateRoadmap(id, { title: editTitle.trim() })
    const updated = roadmaps.map(r => r.id === id ? { ...r, title: editTitle.trim() } : r)
    onRoadmapsChange(updated)
    if (activeRoadmapId === id && activeRoadmap) onActiveRoadmapChange({ ...activeRoadmap, title: editTitle.trim() })
    setEditingRoadmapId(null)
  }

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim() || !activeRoadmapId) return
    setLoading(true)
    try {
      const color = TOPIC_COLORS[colorIndex % TOPIC_COLORS.length]
      const topic = await addTopic(activeRoadmapId, newTopicTitle.trim(), '', color)
      setColorIndex(colorIndex + 1)
      if (activeRoadmap) onActiveRoadmapChange({ ...activeRoadmap, topics: { ...activeRoadmap.topics, [topic.id]: topic } })
      setCreatingTopic(false)
      setNewTopicTitle('')
    } finally { setLoading(false) }
  }

  const handleDeleteTopic = async (topicId: string) => {
    if (!activeRoadmapId || !activeRoadmap || !confirm('Delete this topic and its subtopics?')) return
    await deleteTopic(activeRoadmapId, topicId)
    const topics = { ...activeRoadmap.topics }
    delete topics[topicId]
    onActiveRoadmapChange({ ...activeRoadmap, topics })
  }

  const startEditTopic = (topic: Topic) => {
    setEditingTopicId(topic.id)
    setEditTitle(topic.title)
    setEditDescription(topic.description ?? '')
    setEditColor(topic.color ?? TOPIC_COLORS[0])
  }

  const handleSaveTopic = async () => {
    if (!activeRoadmap || !editingTopicId || !editTitle.trim()) return
    await updateTopic(activeRoadmap.id, editingTopicId, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      color: editColor,
    })
    const updated = JSON.parse(JSON.stringify(activeRoadmap)) as Roadmap
    Object.assign(updated.topics[editingTopicId], { title: editTitle.trim(), description: editDescription.trim(), color: editColor })
    onActiveRoadmapChange(updated)
    setEditingTopicId(null)
  }

  const sortedTopics = useMemo(() => {
    if (!activeRoadmap) return []
    const q = search.trim().toLowerCase()
    return Object.values(activeRoadmap.topics)
      .sort((a, b) => a.order - b.order)
      .filter(topic => {
        if (!q) return true
        const haystack = [
          topic.title,
          topic.description,
          topic.notes,
          ...Object.values(topic.subTopics).flatMap(s => [s.title, s.description, s.notes]),
        ].join(' ').toLowerCase()
        return haystack.includes(q)
      })
  }, [activeRoadmap, search])

  return (
    <aside className="flex flex-col h-full w-72 shrink-0" style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #f97316, #ea6c10)' }}><Zap size={14} className="text-white" /></div>
        <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>RoadMap</span>
        <button onClick={logout} className="ml-auto p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} title="Sign out"><LogOut size={13} /></button>
      </div>

      <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2 px-1"><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Roadmaps</span><button onClick={() => setCreatingRoadmap(!creatingRoadmap)} className="p-1 rounded-md" style={{ color: creatingRoadmap ? 'var(--accent)' : 'var(--text-muted)' }}><Plus size={13} /></button></div>
        {creatingRoadmap && <div className="flex gap-1.5 mb-2 animate-scale-in"><input value={newRoadmapTitle} onChange={e => setNewRoadmapTitle(e.target.value)} placeholder="Roadmap name..." autoFocus className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--bg-3)', border: '1px solid rgba(249,115,22,0.3)', color: 'var(--text)' }} onKeyDown={e => { if (e.key === 'Enter') handleCreateRoadmap(); if (e.key === 'Escape') setCreatingRoadmap(false) }} /><button onClick={handleCreateRoadmap} disabled={!newRoadmapTitle.trim() || loading} className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: '#f97316', color: 'white' }}><Check size={11} /></button><button onClick={() => setCreatingRoadmap(false)} className="p-1.5 rounded-lg" style={{ background: 'var(--bg-3)', color: 'var(--text-muted)' }}><X size={11} /></button></div>}
        <div className="space-y-0.5">
          {roadmaps.map(r => <div key={r.id} className="group relative">{editingRoadmapId === r.id ? <div className="flex gap-1.5"><input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--bg-3)', border: '1px solid rgba(249,115,22,0.3)', color: 'var(--text)' }} onKeyDown={e => { if (e.key === 'Enter') handleEditRoadmap(r.id); if (e.key === 'Escape') setEditingRoadmapId(null) }} /><button onClick={() => handleEditRoadmap(r.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}><Check size={11} /></button></div> : <button onClick={() => onSelectRoadmap(r.id)} className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all', activeRoadmapId === r.id ? 'bg-[var(--bg-3)]' : 'hover:bg-[rgba(15,15,40,0.04)]')}><div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: activeRoadmapId === r.id ? 'var(--accent)' : 'var(--text-muted)' }} /><span className="flex-1 text-xs truncate" style={{ color: 'var(--text)' }}>{r.title}</span><span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{calculateRoadmapProgress(r)}%</span><span className="opacity-0 group-hover:opacity-100 flex gap-1"><span onClick={e => { e.stopPropagation(); setEditingRoadmapId(r.id); setEditTitle(r.title) }} className="p-0.5 rounded" style={{ color: 'var(--text-muted)' }}><Edit2 size={10} /></span><span onClick={e => { e.stopPropagation(); handleDeleteRoadmap(r.id) }} className="p-0.5 rounded" style={{ color: '#f43f5e' }}><Trash2 size={10} /></span></span></button>}</div>)}
          {roadmaps.length === 0 && <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>No roadmaps yet</p>}
        </div>
      </div>

      {activeRoadmap && <div className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="relative mb-3"><Search size={13} className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics, notes..." className="w-full rounded-xl py-2 pl-9 pr-3 text-xs outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} /></div>
        <div className="flex items-center justify-between mb-2 px-1"><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Topics</span><button onClick={() => setCreatingTopic(!creatingTopic)} className="p-1 rounded-md" style={{ color: creatingTopic ? 'var(--accent)' : 'var(--text-muted)' }}><Plus size={13} /></button></div>
        {creatingTopic && <div className="mb-3 animate-scale-in"><div className="flex gap-1.5 mb-2"><input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} placeholder="Topic name..." autoFocus className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--bg-3)', border: '1px solid rgba(249,115,22,0.3)', color: 'var(--text)' }} onKeyDown={e => { if (e.key === 'Enter') handleAddTopic(); if (e.key === 'Escape') setCreatingTopic(false) }} /><button onClick={handleAddTopic} disabled={!newTopicTitle.trim() || loading} className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: '#f97316', color: 'white' }}><Check size={11} /></button><button onClick={() => setCreatingTopic(false)} className="p-1.5 rounded-lg" style={{ background: 'var(--bg-3)', color: 'var(--text-muted)' }}><X size={11} /></button></div><div className="flex gap-1 px-1">{TOPIC_COLORS.slice(0, 8).map((c, i) => <button key={c} onClick={() => setColorIndex(i)} className="w-4 h-4 rounded-full" style={{ background: c, transform: colorIndex === i ? 'scale(1.3)' : 'scale(1)', outline: colorIndex === i ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />)}</div></div>}
        <div className="space-y-1">
          {sortedTopics.map(topic => {
            const progress = calculateTopicProgress(topic)
            const isEditing = editingTopicId === topic.id
            return <div key={topic.id} className="rounded-xl p-2" style={{ background: isEditing ? 'var(--bg)' : 'transparent', border: isEditing ? '1px solid var(--border)' : '1px solid transparent' }}>
              {isEditing ? <div className="space-y-2"><input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full rounded-lg px-2 py-1.5 text-xs outline-none" style={{ background: 'var(--bg-3)', color: 'var(--text)' }} /><textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} placeholder="Description" className="w-full rounded-lg px-2 py-1.5 text-xs outline-none" style={{ background: 'var(--bg-3)', color: 'var(--text)' }} /><div className="flex items-center gap-1"><Palette size={12} style={{ color: 'var(--text-muted)' }} />{TOPIC_COLORS.slice(0, 8).map(c => <button key={c} onClick={() => setEditColor(c)} className="h-4 w-4 rounded-full" style={{ background: c, outline: editColor === c ? `2px solid ${c}66` : 'none', outlineOffset: 2 }} />)}</div><div className="flex gap-1"><button onClick={handleSaveTopic} className="flex-1 rounded-lg px-2 py-1.5 text-xs text-white" style={{ background: '#10b981' }}>Save</button><button onClick={() => setEditingTopicId(null)} className="rounded-lg px-2 py-1.5 text-xs" style={{ background: 'var(--bg-3)', color: 'var(--text)' }}>Cancel</button></div></div> : <div className="group flex items-center gap-2 px-1 py-1.5 rounded-xl"><div className="w-2 h-2 rounded-full shrink-0" style={{ background: topic.color ?? 'var(--accent)' }} /><span className="flex-1 text-xs truncate" style={{ color: search && [topic.title, topic.description, topic.notes].join(' ').toLowerCase().includes(search.toLowerCase()) ? 'var(--accent)' : 'var(--text)' }}>{topic.title}</span><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{progress}%</span><button onClick={() => startEditTopic(topic)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded" style={{ color: 'var(--text-muted)' }}><Edit2 size={10} /></button><button onClick={() => handleDeleteTopic(topic.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded" style={{ color: '#f43f5e' }}><Trash2 size={10} /></button></div>}
            </div>
          })}
          {sortedTopics.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>{search ? 'No matching topics' : 'No topics yet'}</p>}
        </div>
      </div>}

      {activeRoadmap && <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}><div className="flex justify-between text-xs mb-1.5"><span style={{ color: 'var(--text-muted)' }}>Overall Progress</span><span style={{ color: 'var(--accent)', fontWeight: 600 }}>{calculateRoadmapProgress(activeRoadmap)}%</span></div><div className="progress-bar"><div className={`progress-fill ${calculateRoadmapProgress(activeRoadmap) === 100 ? 'completed' : ''}`} style={{ width: `${calculateRoadmapProgress(activeRoadmap)}%` }} /></div></div>}
    </aside>
  )
}
