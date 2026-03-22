const PBKDF2_PREFIX = 'pbkdf2'
const PBKDF2_ITERATIONS = 120000
const PBKDF2_HASH = 'SHA-256'
const SALT_BYTES = 16

const encoder = new TextEncoder()

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex) {
  const normalized = String(hex || '').trim()
  if (!normalized || normalized.length % 2 !== 0) throw new Error('Invalid hex string')
  const bytes = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16)
  }
  return bytes
}

function randomSaltHex() {
  const bytes = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

async function deriveHash(password, saltHex, iterations = PBKDF2_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(password || '')),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(saltHex),
      iterations,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    256,
  )
  return toHex(bits)
}

export async function hashPassword(password) {
  const saltHex = randomSaltHex()
  const hashHex = await deriveHash(password, saltHex, PBKDF2_ITERATIONS)
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`
}

export function isHashedPassword(password) {
  return String(password || '').startsWith(`${PBKDF2_PREFIX}$`)
}

export async function verifyPassword(password, storedPassword) {
  const stored = String(storedPassword || '')
  if (!stored) return false

  if (!isHashedPassword(stored)) {
    return stored === String(password || '')
  }

  const [, iterationsRaw, saltHex, hashHex] = stored.split('$')
  const iterations = Number.parseInt(iterationsRaw, 10)
  if (!iterations || !saltHex || !hashHex) return false

  const derived = await deriveHash(password, saltHex, iterations)
  return derived === hashHex
}
