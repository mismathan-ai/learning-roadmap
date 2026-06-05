'use client'

import { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { nodeTypes } from './NodeTypes'
import { buildGraphElements, ExpandedState } from './graphLayout'
import { Roadmap, SelectedNode } from '@/types'
import NotesPanel from './NotesPanel'
import { Maximize2 } from 'lucide-react'

interface RoadmapFlowProps {
  roadmap: Roadmap
  onRoadmapUpdate: (r: Roadmap) => void
}

function FlowCanvas({ roadmap, onRoadmapUpdate }: RoadmapFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selected, setSelected] = useState<SelectedNode | null>(null)
  const [expanded, setExpanded] = useState<ExpandedState>({
    topics: new Set<string>(Object.keys(roadmap.topics)),
    subTopics: new Set<string>(),
  })
  const { fitView } = useReactFlow()

  useEffect(() => {
    setExpanded(prev => ({ ...prev, topics: new Set(Array.from(prev.topics).concat(Object.keys(roadmap.topics))) }))
  }, [roadmap.id, Object.keys(roadmap.topics).join('|')])

  const handleNodeClick = useCallback((type: string, topicId?: string, subTopicId?: string) => {
    if (type === 'roadmap') {
      setSelected({ type: 'roadmap', roadmapId: roadmap.id })
      return
    }
    if (type === 'topic' && topicId) {
      setSelected({ type: 'topic', roadmapId: roadmap.id, topicId })
      return
    }
    if (type === 'subtopic' && topicId && subTopicId) {
      setSelected({ type: 'subtopic', roadmapId: roadmap.id, topicId, subTopicId })
    }
  }, [roadmap.id])

  const handleToggleExpand = useCallback((type: string, topicId?: string, subTopicId?: string) => {
    if (type === 'topic' && topicId) {
      setExpanded(prev => {
        const topics = new Set(prev.topics)
        topics.has(topicId) ? topics.delete(topicId) : topics.add(topicId)
        return { ...prev, topics }
      })
    }
    if (type === 'subtopic' && subTopicId) {
      setExpanded(prev => {
        const subTopics = new Set(prev.subTopics)
        subTopics.has(subTopicId) ? subTopics.delete(subTopicId) : subTopics.add(subTopicId)
        return { ...prev, subTopics }
      })
    }
  }, [])

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraphElements(roadmap, expanded, handleNodeClick, handleToggleExpand)
    setNodes(n)
    setEdges(e)
    window.setTimeout(() => fitView({ padding: 0.22, duration: 500, maxZoom: 1.1 }), 80)
  }, [roadmap, expanded, handleNodeClick, handleToggleExpand, fitView, setNodes, setEdges])

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.05 }}
        minZoom={0.15}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={32} size={1} color="rgba(15,15,40,0.08)" />
        <Controls showInteractive={false} className="!bottom-4 !left-4" />
        <Panel position="top-right">
          <button
            onClick={() => fitView({ padding: 0.22, duration: 500, maxZoom: 1.05 })}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs shadow-sm"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <Maximize2 size={14} /> Fit roadmap
          </button>
        </Panel>
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.completed) return '#10b981'
            if (n.type === 'roadmapNode') return '#f97316'
            if (n.type === 'topicNode') return n.data?.color || '#8b5cf6'
            return '#8b5cf6'
          }}
          maskColor="rgba(15,15,40,0.08)"
          className="!bottom-4 !right-4 !rounded-2xl !shadow-lg"
        />
      </ReactFlow>

      {Object.keys(roadmap.topics).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-fade-in rounded-3xl p-8" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>No topics yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add a topic from the sidebar to get started</p>
          </div>
        </div>
      )}

      {selected && (
        <NotesPanel roadmap={roadmap} selected={selected} onClose={() => setSelected(null)} onRoadmapUpdate={onRoadmapUpdate} />
      )}
    </div>
  )
}

export default function RoadmapFlow(props: RoadmapFlowProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  )
}
