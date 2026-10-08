#!/usr/bin/env node
// FalcoScan MCP bridge.
//
// Lets MCP clients that only run local (stdio) servers use the FalcoScan MCP
// server at https://falcoscan.com/api/mcp. Each JSON-RPC message from the
// client is sent to FalcoScan with your API key, and each reply is written
// back. No data lives in this package: every answer comes from falcoscan.com,
// and every request is checked there.

import { createInterface } from 'node:readline'

const VERSION = '1.1.0'
const ENDPOINT = 'https://falcoscan.com/api/mcp'
const ACCESS_URL = 'https://falcoscan.com/data-access'
const KEY = (process.env.FALCOSCAN_API_KEY || '').trim()

if (!KEY) {
  process.stderr.write(
    `FalcoScan MCP needs an API key.\n` +
      `Set FALCOSCAN_API_KEY to your FalcoScan key. Request access at ${ACCESS_URL}\n`,
  )
  process.exit(1)
}

let sessionId = null
let queue = Promise.resolve()

const write = (message) => process.stdout.write(JSON.stringify(message) + '\n')

/** A JSON-RPC error for a request (notifications get no reply). */
function fail(request, code, message) {
  if (request && request.id !== undefined && request.id !== null) {
    write({ jsonrpc: '2.0', id: request.id, error: { code, message } })
  }
}

/** Write what came back: JSON-RPC objects only. */
function relay(request, body, status) {
  const items = Array.isArray(body) ? body : [body]
  for (const item of items) {
    if (item && item.jsonrpc === '2.0') write(item)
    else fail(request, -32000, (item && (item.error || item.message)) || `FalcoScan returned HTTP ${status}`)
  }
}

async function forward(line) {
  let request
  try {
    request = JSON.parse(line)
  } catch {
    write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })
    return
  }

  const headers = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    authorization: `Bearer ${KEY}`,
    'user-agent': `falcoscan-mcp/${VERSION}`,
  }
  if (sessionId) headers['mcp-session-id'] = sessionId

  let res
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(request) })
  } catch (err) {
    fail(request, -32000, `Could not reach FalcoScan: ${err && err.message ? err.message : err}`)
    return
  }

  const session = res.headers.get('mcp-session-id')
  if (session) sessionId = session
  if (res.status === 202 || res.status === 204) return

  const text = await res.text()
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    for (const block of text.split(/\r?\n\r?\n/)) {
      const data = block
        .split(/\r?\n/)
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trimStart())
        .join('\n')
      if (!data) continue
      try {
        relay(request, JSON.parse(data), res.status)
      } catch {
        // A keep-alive or a non-JSON event: nothing to pass on.
      }
    }
    return
  }

  let body
  try {
    body = JSON.parse(text)
  } catch {
    fail(request, -32000, `FalcoScan returned HTTP ${res.status}`)
    return
  }
  relay(request, body, res.status)
}

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity })
lines.on('line', (line) => {
  if (!line.trim()) return
  // One at a time, so replies keep their order and the session id is set first.
  queue = queue.then(() => forward(line))
})
lines.on('close', () => {
  queue.then(() => process.exit(0))
})
