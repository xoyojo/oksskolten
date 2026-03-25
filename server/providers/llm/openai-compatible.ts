import OpenAI from 'openai'
import { getSetting } from '../../db.js'
import type { LLMProvider, LLMMessageParams, LLMStreamResult } from './provider.js'

let cachedBaseUrl = ''
let cachedModel = ''
let cachedKey = ''
let cachedClient: OpenAI | null = null

export function getOpenAICompatibleClient(): OpenAI {
  const baseUrl = getSetting('openai-compatible.base_url') || ''
  const model = getSetting('openai-compatible.model') || ''
  const key = getSetting('api_key.openai-compatible') || ''
  if (cachedClient && baseUrl === cachedBaseUrl && model === cachedModel && key === cachedKey) {
    return cachedClient
  }
  cachedBaseUrl = baseUrl
  cachedModel = model
  cachedKey = key
  cachedClient = new OpenAI({
    baseURL: `${baseUrl}/v1`,
    apiKey: key || 'not-needed',
  })
  return cachedClient
}

export function getOpenAICompatibleModel(fallbackModel: string): string {
  return getSetting('openai-compatible.model') || fallbackModel
}

export const openaiCompatibleProvider: LLMProvider = {
  name: 'openai-compatible',

  requireKey() {
    if (!getSetting('openai-compatible.base_url')) {
      throw new Error('OPENAI_COMPATIBLE_BASE_URL_NOT_SET')
    }
    if (!getSetting('openai-compatible.model')) {
      throw new Error('OPENAI_COMPATIBLE_MODEL_NOT_SET')
    }
  },

  async createMessage(params: LLMMessageParams): Promise<LLMStreamResult> {
    const client = getOpenAICompatibleClient()
    const model = getOpenAICompatibleModel(params.model)
    const messages: OpenAI.ChatCompletionMessageParam[] = []
    if (params.systemInstruction) {
      messages.push({ role: 'system', content: params.systemInstruction })
    }
    for (const m of params.messages) {
      messages.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })
    }

    const response = await client.chat.completions.create({
      model,
      max_completion_tokens: params.maxTokens,
      messages,
    })

    const text = response.choices[0]?.message?.content ?? ''
    return {
      text,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    }
  },

  async streamMessage(params: LLMMessageParams, onText: (delta: string) => void): Promise<LLMStreamResult> {
    const client = getOpenAICompatibleClient()
    const model = getOpenAICompatibleModel(params.model)
    const messages: OpenAI.ChatCompletionMessageParam[] = []
    if (params.systemInstruction) {
      messages.push({ role: 'system', content: params.systemInstruction })
    }
    for (const m of params.messages) {
      messages.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })
    }

    const stream = await client.chat.completions.create({
      model,
      max_completion_tokens: params.maxTokens,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    })

    let fullText = ''
    let inputTokens = 0
    let outputTokens = 0

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) {
        fullText += delta
        onText(delta)
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? inputTokens
        outputTokens = chunk.usage.completion_tokens ?? outputTokens
      }
    }

    return { text: fullText, inputTokens, outputTokens }
  },
}
