import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Roadmap, Topic } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateTopicProgress(topic: Topic): number {
  const subs = Object.values(topic.subTopics)
  if (subs.length === 0) return topic.completed ? 100 : 0
  const completed = subs.filter(s => s.completed).length
  return Math.round((completed / subs.length) * 100)
}

export function calculateRoadmapProgress(roadmap: Roadmap): number {
  const topics = Object.values(roadmap.topics)
  if (topics.length === 0) return 0
  const total = topics.reduce((sum, t) => sum + calculateTopicProgress(t), 0)
  return Math.round(total / topics.length)
}

export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export const TOPIC_COLORS = [
  '#f97316', // orange
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f43f5e', // rose
  '#eab308', // yellow
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
  '#a855f7', // purple
]
