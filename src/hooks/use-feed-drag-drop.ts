import { useState } from 'react'
import { apiPatch } from '../lib/fetcher'
import type { FeedWithCounts } from '../../shared/types'
import type { KeyedMutator } from 'swr'

interface UseFeedDragDropOpts {
  feeds: FeedWithCounts[]
  mutateFeeds: KeyedMutator<{ feeds: FeedWithCounts[]; bookmark_count: number; like_count: number; clip_feed_id: number | null }>
}

export function useFeedDragDrop({ feeds, mutateFeeds }: UseFeedDragDropOpts) {
  const [dragOverTarget, setDragOverTarget] = useState<number | 'uncategorized' | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDragStart(e: React.DragEvent, feed: FeedWithCounts) {
    e.dataTransfer.setData('text/plain', String(feed.id))
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  function handleDragOver(e: React.DragEvent, target: number | 'uncategorized') {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTarget(target)
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear when actually leaving the container (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTarget(null)
    }
  }

  async function handleDrop(e: React.DragEvent, categoryId: number | null) {
    e.preventDefault()
    setDragOverTarget(null)
    setIsDragging(false)
    const feedId = Number(e.dataTransfer.getData('text/plain'))
    if (!feedId) return
    const feed = feeds.find(f => f.id === feedId)
    if (!feed || feed.category_id === categoryId) return
    void mutateFeeds(
      prev => prev ? { ...prev, feeds: prev.feeds.map(f => f.id === feedId ? { ...f, category_id: categoryId } : f) } : prev,
      { revalidate: false },
    )
    try {
      await apiPatch(`/api/feeds/${feedId}`, { category_id: categoryId })
    } catch {
      void mutateFeeds()
    }
  }

  function handleDragEnd() {
    setDragOverTarget(null)
    setIsDragging(false)
  }

  return {
    dragOverTarget,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  }
}
