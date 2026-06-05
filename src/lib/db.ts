import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { Roadmap, Topic, SubTopic, Resource } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// ─── Roadmaps ────────────────────────────────────────────────────────────────

export async function getRoadmaps(): Promise<Roadmap[]> {
  const q = query(collection(db, 'roadmaps'), orderBy('createdAt', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Roadmap))
}

export async function getRoadmap(id: string): Promise<Roadmap | null> {
  const ref = doc(db, 'roadmaps', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Roadmap
}

export async function createRoadmap(title: string, description = ''): Promise<Roadmap> {
  const id = uuidv4()
  const now = Date.now()
  const roadmap: Roadmap = {
    id,
    title,
    description,
    topics: {},
    createdAt: now,
    updatedAt: now,
  }
  await setDoc(doc(db, 'roadmaps', id), roadmap)
  return roadmap
}

export async function updateRoadmap(id: string, data: Partial<Roadmap>): Promise<void> {
  await updateDoc(doc(db, 'roadmaps', id), { ...data, updatedAt: Date.now() })
}

export async function deleteRoadmap(id: string): Promise<void> {
  await deleteDoc(doc(db, 'roadmaps', id))
}

// ─── Topics ──────────────────────────────────────────────────────────────────

export async function addTopic(
  roadmapId: string,
  title: string,
  description = '',
  color = '#f97316'
): Promise<Topic> {
  const roadmap = await getRoadmap(roadmapId)
  if (!roadmap) throw new Error('Roadmap not found')

  const id = uuidv4()
  const now = Date.now()
  const topic: Topic = {
    id,
    roadmapId,
    title,
    description,
    notes: '',
    completed: false,
    resources: [],
    subTopics: {},
    order: Object.keys(roadmap.topics).length,
    color,
    createdAt: now,
    updatedAt: now,
  }

  await updateDoc(doc(db, 'roadmaps', roadmapId), {
    [`topics.${id}`]: topic,
    updatedAt: now,
  })

  return topic
}

export async function updateTopic(
  roadmapId: string,
  topicId: string,
  data: Partial<Topic>
): Promise<void> {
  const now = Date.now()
  const updates: Record<string, unknown> = { updatedAt: now }
  for (const [key, val] of Object.entries(data)) {
    updates[`topics.${topicId}.${key}`] = val
  }
  updates[`topics.${topicId}.updatedAt`] = now
  await updateDoc(doc(db, 'roadmaps', roadmapId), updates)
}

export async function deleteTopic(roadmapId: string, topicId: string): Promise<void> {
  const roadmap = await getRoadmap(roadmapId)
  if (!roadmap) return
  const topics = { ...roadmap.topics }
  delete topics[topicId]
  await updateDoc(doc(db, 'roadmaps', roadmapId), { topics, updatedAt: Date.now() })
}

// ─── SubTopics ───────────────────────────────────────────────────────────────

export async function addSubTopic(
  roadmapId: string,
  topicId: string,
  title: string,
  description = '',
  parentSubTopicId: string | null = null
): Promise<SubTopic> {
  const roadmap = await getRoadmap(roadmapId)
  if (!roadmap) throw new Error('Roadmap not found')
  const topic = roadmap.topics[topicId]
  if (!topic) throw new Error('Topic not found')

  const id = uuidv4()
  const now = Date.now()
  const subTopic: SubTopic = {
    id,
    title,
    description,
    notes: '',
    completed: false,
    resources: [],
    order: Object.keys(topic.subTopics).length,
    parentId: parentSubTopicId,
    children: [],
    createdAt: now,
    updatedAt: now,
  }

  const updates: Record<string, unknown> = {
    [`topics.${topicId}.subTopics.${id}`]: subTopic,
    [`topics.${topicId}.updatedAt`]: now,
    updatedAt: now,
  }

  // If it has a parent subtopic, add this id to parent's children
  if (parentSubTopicId) {
    const parent = topic.subTopics[parentSubTopicId]
    if (parent) {
      updates[`topics.${topicId}.subTopics.${parentSubTopicId}.children`] = [
        ...parent.children,
        id,
      ]
    }
  }

  await updateDoc(doc(db, 'roadmaps', roadmapId), updates)
  return subTopic
}

export async function updateSubTopic(
  roadmapId: string,
  topicId: string,
  subTopicId: string,
  data: Partial<SubTopic>
): Promise<void> {
  const now = Date.now()
  const updates: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(data)) {
    updates[`topics.${topicId}.subTopics.${subTopicId}.${key}`] = val
  }
  updates[`topics.${topicId}.subTopics.${subTopicId}.updatedAt`] = now
  updates[`topics.${topicId}.updatedAt`] = now
  updates['updatedAt'] = now
  await updateDoc(doc(db, 'roadmaps', roadmapId), updates)
}

export async function deleteSubTopic(
  roadmapId: string,
  topicId: string,
  subTopicId: string
): Promise<void> {
  const roadmap = await getRoadmap(roadmapId)
  if (!roadmap) return
  const topic = roadmap.topics[topicId]
  if (!topic) return

  // Recursively collect all descendants
  const toDelete = new Set<string>()
  const collect = (id: string) => {
    toDelete.add(id)
    const sub = topic.subTopics[id]
    if (sub) sub.children.forEach(collect)
  }
  collect(subTopicId)

  const subTopics = { ...topic.subTopics }
  toDelete.forEach(id => delete subTopics[id])

  // Remove from parent's children if applicable
  const sub = topic.subTopics[subTopicId]
  if (sub?.parentId && subTopics[sub.parentId]) {
    subTopics[sub.parentId] = {
      ...subTopics[sub.parentId],
      children: subTopics[sub.parentId].children.filter(c => c !== subTopicId),
    }
  }

  await updateDoc(doc(db, 'roadmaps', roadmapId), {
    [`topics.${topicId}.subTopics`]: subTopics,
    [`topics.${topicId}.updatedAt`]: Date.now(),
    updatedAt: Date.now(),
  })
}

// ─── Resources ───────────────────────────────────────────────────────────────

export async function addResource(
  roadmapId: string,
  topicId: string,
  subTopicId: string | null,
  resource: Omit<Resource, 'id' | 'addedAt'>
): Promise<Resource> {
  const r: Resource = { ...resource, id: uuidv4(), addedAt: Date.now() }
  const roadmap = await getRoadmap(roadmapId)
  if (!roadmap) throw new Error('Roadmap not found')

  let currentResources: Resource[]
  let updatePath: string

  if (subTopicId) {
    currentResources = roadmap.topics[topicId]?.subTopics[subTopicId]?.resources ?? []
    updatePath = `topics.${topicId}.subTopics.${subTopicId}.resources`
  } else {
    currentResources = roadmap.topics[topicId]?.resources ?? []
    updatePath = `topics.${topicId}.resources`
  }

  await updateDoc(doc(db, 'roadmaps', roadmapId), {
    [updatePath]: [...currentResources, r],
    updatedAt: Date.now(),
  })

  return r
}

export async function deleteResource(
  roadmapId: string,
  topicId: string,
  subTopicId: string | null,
  resourceId: string
): Promise<void> {
  const roadmap = await getRoadmap(roadmapId)
  if (!roadmap) return

  let currentResources: Resource[]
  let updatePath: string

  if (subTopicId) {
    currentResources = roadmap.topics[topicId]?.subTopics[subTopicId]?.resources ?? []
    updatePath = `topics.${topicId}.subTopics.${subTopicId}.resources`
  } else {
    currentResources = roadmap.topics[topicId]?.resources ?? []
    updatePath = `topics.${topicId}.resources`
  }

  await updateDoc(doc(db, 'roadmaps', roadmapId), {
    [updatePath]: currentResources.filter(r => r.id !== resourceId),
    updatedAt: Date.now(),
  })
}
