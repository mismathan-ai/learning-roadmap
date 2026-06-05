'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { CheckCircle2, Circle, ChevronRight, BookOpen, MoreHorizontal, Maximize2 } from 'lucide-react'
import { NodeData } from '@/types'
import { cn } from '@/lib/utils'

export const RoadmapNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const progress = data.progress ?? 0

  return (
    <div
      className={cn('relative rounded-3xl px-7 py-5 cursor-pointer transition-all duration-200 min-w-[270px]', selected && 'ring-2 ring-orange-300')}
      style={{
        background: 'linear-gradient(135deg,#ffffff,#fff7ed)',
        border: '2px solid rgba(249,115,22,.35)',
        boxShadow: selected ? '0 22px 55px rgba(249,115,22,.18)' : '0 14px 34px rgba(15,15,40,.10)',
      }}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div className="flex items-start gap-3">
        <div className="text-xl">{data.icon ?? '📘'}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{data.label}</p>
          {data.description && <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--text-muted)' }}>{data.description}</p>}
        </div>
        <Maximize2 size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="mt-4 progress-bar"><div className={`progress-fill ${progress === 100 ? 'completed' : ''}`} style={{ width: `${progress}%` }} /></div>
      <div className="mt-2 flex justify-between text-xs"><span style={{ color: 'var(--text-muted)' }}>Progress</span><span className="font-semibold" style={{ color: progress === 100 ? '#10b981' : '#f97316' }}>{progress}%</span></div>
    </div>
  )
})
RoadmapNode.displayName = 'RoadmapNode'

export const TopicNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const color = data.color ?? '#f97316'
  const progress = data.progress ?? 0

  return (
    <div
      className="relative rounded-2xl px-5 py-4 cursor-pointer transition-all duration-200 min-w-[230px] group"
      style={{
        background: `linear-gradient(135deg, ${color}16, #ffffff)`,
        border: `1.7px solid ${data.completed ? 'rgba(16,185,129,.45)' : `${color}55`}`,
        boxShadow: selected ? `0 0 0 3px ${color}25, 0 18px 38px rgba(15,15,40,.15)` : '0 8px 20px rgba(15,15,40,.08)',
      }}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl text-base" style={{ background: `${color}18`, color }}>
          {data.icon ?? <BookOpen size={15} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{data.label}</p>
          <div className="mt-2 progress-bar"><div className={`progress-fill ${progress === 100 ? 'completed' : ''}`} style={{ width: `${progress}%`, background: progress === 100 ? undefined : `linear-gradient(90deg, ${color}, ${color}cc)` }} /></div>
        </div>
        {data.completed && <CheckCircle2 size={15} className="text-emerald-400" />}
        {data.hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); data.onEdit?.() }}
            className="rounded-lg p-1 opacity-60 transition hover:opacity-100"
            style={{ color: 'var(--text-muted)' }}
            title="Expand / collapse"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
})
TopicNode.displayName = 'TopicNode'

export const SubTopicNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const depth = data.depth ?? 0
  const depthColors = ['#8b5cf6', '#06b6d4', '#10b981', '#f43f5e', '#eab308']
  const color = depthColors[depth % depthColors.length]

  return (
    <div
      className="relative rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 min-w-[190px] group"
      style={{
        background: data.completed ? 'rgba(16,185,129,.08)' : 'var(--bg-2)',
        border: `1.2px solid ${data.completed ? 'rgba(16,185,129,.32)' : `${color}45`}`,
        boxShadow: selected ? `0 0 0 2px ${color}30, 0 10px 26px rgba(15,15,40,.14)` : '0 4px 14px rgba(15,15,40,.07)',
      }}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div className="flex items-center gap-2.5">
        {data.completed ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" /> : <Circle size={13} className="shrink-0" style={{ color }} />}
        {data.icon && <span className="text-sm">{data.icon}</span>}
        <p className="truncate text-xs font-semibold" style={{ color: data.completed ? '#10b981' : 'var(--text)' }}>{data.label}</p>
        {data.hasChildren && (
          <button onClick={(e) => { e.stopPropagation(); data.onEdit?.() }} className="ml-auto rounded-md p-1" style={{ color: 'var(--text-muted)' }} title="Expand / collapse">
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
})
SubTopicNode.displayName = 'SubTopicNode'

export const nodeTypes = {
  roadmapNode: RoadmapNode,
  topicNode: TopicNode,
  subTopicNode: SubTopicNode,
}
