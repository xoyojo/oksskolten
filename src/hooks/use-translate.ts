import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useStreamingAI } from './use-streaming-ai'
import type { useMetrics } from './use-metrics'
import type { Article } from '../../shared/types'

type ViewMode = 'ja' | 'original'

const STREAMING_OPTIONS = {
  endpoint: (id: number) => `/api/articles/${id}/translate?stream=1`,
} as const

export function useTranslate(
  article: Pick<Article, 'id' | 'full_text_ja'> | undefined,
  metrics: ReturnType<typeof useMetrics>,
) {
  const [viewMode, setViewMode] = useState<ViewMode>('original')
  const [fullTextJa, setFullTextJa] = useState<string | null>(null)

  const initializedIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (article) {
      setFullTextJa(article.full_text_ja)
      if (initializedIdRef.current !== article.id) {
        initializedIdRef.current = article.id
        setViewMode(article.full_text_ja ? 'ja' : 'original')
      }
    }
  }, [article])

  const options = useMemo(() => ({
    ...STREAMING_OPTIONS,
    onComplete: (text: string) => {
      setFullTextJa(text)
      setViewMode('ja')
    },
  }), [])

  const { processing: translating, streamingText: translatingText, streamingHtml: translatingHtml, error, run } =
    useStreamingAI(article?.id, metrics, options)

  const handleTranslate = useCallback(() => run(), [run])

  return { viewMode, setViewMode, translating, translatingText, fullTextJa, handleTranslate, translatingHtml, error }
}
