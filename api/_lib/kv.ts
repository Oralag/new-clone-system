// 统一存储层 — Vercel KV + 内存回退
import { createClient } from '@vercel/kv'

let _kv: ReturnType<typeof createClient> | null = null
const MEM: Record<string, string> = {}

function getKV() {
  if (_kv) return _kv
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (url && token) _kv = createClient({ url, token })
  return _kv
}

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    const client = getKV()
    if (client) {
      try { return await client.get<T>(key) ?? null } catch { return null }
    }
    const raw = MEM[key]
    return raw ? JSON.parse(raw) : null
  },

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<void> {
    const client = getKV()
    if (client) {
      try { await client.set(key, value, opts) } catch { MEM[key] = JSON.stringify(value) }
    } else {
      MEM[key] = JSON.stringify(value)
    }
  },

  async lpush(key: string, item: unknown): Promise<void> {
    const existing = (await this.get<unknown[]>(key)) || []
    await this.set(key, [item, ...existing])
  },

  async rpush(key: string, item: unknown): Promise<void> {
    const existing = (await this.get<unknown[]>(key)) || []
    await this.set(key, [...existing, item])
  },

  async lrange<T>(key: string, start = 0, stop = -1): Promise<T[]> {
    const list = (await this.get<T[]>(key)) || []
    return stop === -1 ? list.slice(start) : list.slice(start, stop + 1)
  },

  async del(key: string): Promise<void> {
    const client = getKV()
    if (client) {
      try { await client.delete(key) } catch { delete MEM[key] }
    } else {
      delete MEM[key]
    }
  },
}
