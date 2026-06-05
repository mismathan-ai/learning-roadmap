// Core data types

export interface Resource {
  id: string
  type: 'youtube' | 'link'
  title: string
  url: string
  addedAt: number
}

export interface SubTopic {
  id: string
  title: string
  description: string
  notes: string
  completed: boolean
  resources: Resource[]
  order: number
  parentId: string | null
  children: string[] // IDs of child subtopics
  icon?: string
  createdAt: number
  updatedAt: number
}

export interface Topic {
  id: string
  roadmapId: string
  title: string
  description: string
  notes: string
  completed: boolean
  resources: Resource[]
  subTopics: Record<string, SubTopic>
  order: number
  color: string
  icon?: string
  createdAt: number
  updatedAt: number
}

export interface Roadmap {
  id: string
  title: string
  description: string
  topics: Record<string, Topic>
  createdAt: number
  updatedAt: number
}

export interface NodeData {
  label: string
  description?: string
  completed: boolean
  progress?: number
  type: 'roadmap' | 'topic' | 'subtopic'
  color?: string
  icon?: string
  onEdit?: () => void
  topicId?: string
  subTopicId?: string
  roadmapId?: string
  depth?: number
  hasChildren?: boolean
  onClick?: () => void
}

export type SelectedNode = {
  type: 'roadmap'
  roadmapId: string
} | {
  type: 'topic'
  roadmapId: string
  topicId: string
} | {
  type: 'subtopic'
  roadmapId: string
  topicId: string
  subTopicId: string
}
