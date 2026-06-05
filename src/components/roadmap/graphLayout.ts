import dagre from 'dagre'
import { Node, Edge } from 'reactflow'
import { Roadmap, Topic, SubTopic } from '@/types'
import { calculateTopicProgress, calculateRoadmapProgress } from '@/lib/utils'

const ROOT_WIDTH = 270
const TOPIC_WIDTH = 230
const SUB_WIDTH = 190
const ROOT_HEIGHT = 96
const TOPIC_HEIGHT = 76
const SUB_HEIGHT = 52
const H_SEP = 110
const V_SEP = 54

export interface ExpandedState {
  topics: Set<string>
  subTopics: Set<string>
}

export function buildGraphElements(
  roadmap: Roadmap,
  expanded: ExpandedState,
  onNodeClick: (type: string, topicId?: string, subTopicId?: string) => void,
  onToggleExpand?: (type: string, topicId?: string, subTopicId?: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',
    nodesep: V_SEP,
    ranksep: H_SEP,
    marginx: 80,
    marginy: 80,
    acyclicer: 'greedy',
    ranker: 'tight-tree',
  })

  const roadmapNodeId = `roadmap-${roadmap.id}`
  const roadmapProgress = calculateRoadmapProgress(roadmap)
  g.setNode(roadmapNodeId, { width: ROOT_WIDTH, height: ROOT_HEIGHT })
  nodes.push({
    id: roadmapNodeId,
    type: 'roadmapNode',
    position: { x: 0, y: 0 },
    data: {
      label: roadmap.title,
      description: roadmap.description,
      completed: roadmapProgress === 100,
      progress: roadmapProgress,
      type: 'roadmap',
      roadmapId: roadmap.id,
      icon: '🗺️',
      onClick: () => onNodeClick('roadmap'),
    },
  })

  const sortedTopics = Object.values(roadmap.topics).sort((a, b) => a.order - b.order)

  for (const topic of sortedTopics) {
    const topicNodeId = `topic-${topic.id}`
    const topicProgress = calculateTopicProgress(topic)
    const hasChildren = Object.keys(topic.subTopics).length > 0
    g.setNode(topicNodeId, { width: TOPIC_WIDTH, height: TOPIC_HEIGHT })
    nodes.push({
      id: topicNodeId,
      type: 'topicNode',
      position: { x: 0, y: 0 },
      data: {
        label: topic.title,
        description: topic.description,
        completed: topic.completed,
        progress: topicProgress,
        type: 'topic',
        roadmapId: roadmap.id,
        topicId: topic.id,
        color: topic.color,
        icon: topic.icon,
        hasChildren,
        onClick: () => onNodeClick('topic', topic.id),
        onEdit: () => onToggleExpand?.('topic', topic.id),
      },
    })
    edges.push(makeEdge(`e-roadmap-${topic.id}`, roadmapNodeId, topicNodeId, topic.completed, topic.color))

    if (expanded.topics.has(topic.id)) {
      addSubTopicNodes(g, nodes, edges, roadmap, topic, null, topicNodeId, 0, expanded, onNodeClick, onToggleExpand)
    }
  }

  dagre.layout(g)
  for (const node of nodes) {
    const pos = g.node(node.id)
    if (pos) node.position = { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 }
  }

  return { nodes, edges }
}

function makeEdge(id: string, source: string, target: string, completed: boolean, color = '#8b5cf6'): Edge {
  return {
    id,
    source,
    target,
    type: 'smoothstep',
    style: {
      stroke: completed ? 'rgba(16,185,129,0.5)' : `${color}55`,
      strokeWidth: completed ? 2.4 : 1.8,
    },
    pathOptions: { borderRadius: 18 },
  } as Edge
}

function addSubTopicNodes(
  g: dagre.graphlib.Graph,
  nodes: Node[],
  edges: Edge[],
  roadmap: Roadmap,
  topic: Topic,
  parentSubTopicId: string | null,
  parentNodeId: string,
  depth: number,
  expanded: ExpandedState,
  onNodeClick: (type: string, topicId?: string, subTopicId?: string) => void,
  onToggleExpand?: (type: string, topicId?: string, subTopicId?: string) => void
) {
  const subs = Object.values(topic.subTopics)
    .filter(s => s.parentId === parentSubTopicId)
    .sort((a, b) => a.order - b.order)

  for (const sub of subs) {
    const subNodeId = `subtopic-${sub.id}`
    const hasChildren = sub.children.length > 0
    g.setNode(subNodeId, { width: SUB_WIDTH, height: SUB_HEIGHT })
    nodes.push({
      id: subNodeId,
      type: 'subTopicNode',
      position: { x: 0, y: 0 },
      data: {
        label: sub.title,
        description: sub.description,
        completed: sub.completed,
        type: 'subtopic',
        roadmapId: roadmap.id,
        topicId: topic.id,
        subTopicId: sub.id,
        depth,
        icon: sub.icon,
        hasChildren,
        onClick: () => onNodeClick('subtopic', topic.id, sub.id),
        onEdit: () => onToggleExpand?.('subtopic', topic.id, sub.id),
      },
    })
    edges.push(makeEdge(`e-${parentNodeId}-${sub.id}`, parentNodeId, subNodeId, sub.completed, topic.color))

    if (hasChildren && expanded.subTopics.has(sub.id)) {
      addSubTopicNodes(g, nodes, edges, roadmap, topic, sub.id, subNodeId, depth + 1, expanded, onNodeClick, onToggleExpand)
    }
  }
}
