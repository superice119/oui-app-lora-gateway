/**
 * Mock RPC server for local OUI development
 * Simulates /oui-rpc endpoint without a real router
 *
 * Usage: node mock/server.mjs
 */

import http from 'http'

// ── In-memory state ──────────────────────────────────────────────────────────
let state = {
  active_service: 'basicstation',
  services: {
    basicstation:  { running: true,  pid: 1234, start_ts: Date.now() - 3600 * 1000 },
    lora_pkt_fwd:  { running: false, pid: null, start_ts: null }
  },
  config: {
    basicstation: {
      tc_uri:    'ws://localhost:3001',
      cups_uri:  '',
      auth_mode: 'no_auth',
      api_key:   ''
    },
    lora_pkt_fwd: {
      server_address: '',
      serv_port_up:   1700,
      serv_port_down: 1700
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function uptime(svc) {
  if (!svc.running || !svc.start_ts) return null
  return Math.floor((Date.now() - svc.start_ts) / 1000)
}

function mockToken() {
  return 'mock-token-' + Math.random().toString(36).slice(2)
}

// ── RPC handler map ──────────────────────────────────────────────────────────
const handlers = {
  // ── auth (required by OUI login page) ──
  'ui/get_locale': () => ({ locale: 'en' }),
  'ui/get_theme':  () => ({ theme: 'dark' }),
  'user/login': (p) => {
    if (p?.username === 'admin' && p?.password) {
      return { token: mockToken(), acl: 'admin' }
    }
    return null  // triggers 403-like error
  },
  'user/logout': () => ({ ok: true }),

  // ── system (used by oui-app-home) ──
  'system/board': () => ({
    hostname: 'ImmortalWrt-mock',
    model: 'GainStrong Oolite V8',
    system: 'MIPS 24Kc V8.16',
    kernel: '5.15.137',
    release: { target: 'ramips/mt7621', description: 'ImmortalWrt 23.05-SNAPSHOT' }
  }),

  // ── lora-gateway RPC ──
  'lora-gateway/get_status': () => {
    const active = state.active_service
    const svc = state.services[active]
    return {
      active_service: active,
      running:        svc.running,
      uptime:         uptime(svc),
      usb_ok:         true,
      chip_id:        'SX1302 ChipID=1',
      eui:            'ce:f4:ff:fe:c3:4f:ce:00',
      usb_path:       '/dev/ttyACM0'
    }
  },

  'lora-gateway/start_service': (p) => {
    const name = p?.service
    if (!state.services[name]) return { ok: false, error: 'unknown service' }
    state.services[name].running = true
    state.services[name].start_ts = Date.now()
    state.services[name].pid = 1000 + Math.floor(Math.random() * 9000)
    console.log(`[mock] start ${name}`)
    return { ok: true }
  },

  'lora-gateway/stop_service': (p) => {
    const name = p?.service
    if (!state.services[name]) return { ok: false, error: 'unknown service' }
    state.services[name].running = false
    state.services[name].start_ts = null
    state.services[name].pid = null
    console.log(`[mock] stop ${name}`)
    return { ok: true }
  },

  'lora-gateway/restart_service': (p) => {
    const name = p?.service
    if (!state.services[name]) return { ok: false, error: 'unknown service' }
    state.services[name].running = true
    state.services[name].start_ts = Date.now()
    state.services[name].pid = 1000 + Math.floor(Math.random() * 9000)
    console.log(`[mock] restart ${name}`)
    return { ok: true }
  },

  'lora-gateway/set_active_service': (p) => {
    const name = p?.service
    if (!state.services[name]) return { ok: false, error: 'unknown service' }
    const prev = state.active_service
    if (prev !== name) {
      state.services[prev].running = false
      state.services[prev].start_ts = null
    }
    state.active_service = name
    state.services[name].running = true
    state.services[name].start_ts = Date.now()
    console.log(`[mock] switch active service → ${name}`)
    return { ok: true, active_service: name }
  },

  'lora-gateway/get_config': () => JSON.parse(JSON.stringify(state.config)),


  // ── system performance ──
  'system/performance': () => ({
    cpu:       Math.floor(Math.random() * 30 + 5),
    mem_used:  Math.floor(45 + Math.random() * 10),
    mem_total: 123
  }),

  // ── LoRa statistics ──
  'lora-gateway/get_stats': () => ({
    rx:             Math.floor(Math.random() * 5),
    tx:             Math.floor(Math.random() * 3),
    devices_active: Math.floor(Math.random() * 3),
    devices_busy:   0
  }),

  // ── Chip hardware test ──
  'lora-gateway/chip_test': () => ({
    result: 'SX1302 ChipID=1 — Hardware OK'
  }),

  'lora-gateway/set_config': (p) => {
    if (p?.basicstation) {
      Object.assign(state.config.basicstation, p.basicstation)
    }
    if (p?.lora_pkt_fwd) {
      Object.assign(state.config.lora_pkt_fwd, p.lora_pkt_fwd)
    }
    if (p?.restart) {
      const active = state.active_service
      state.services[active].start_ts = Date.now()
      console.log(`[mock] restart after config save: ${active}`)
    }
    console.log('[mock] config saved')
    return { ok: true }
  }
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const PORT = 3000

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Token')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (req.method !== 'POST' || !req.url.startsWith('/oui-rpc')) {
    res.writeHead(404); res.end('Not Found'); return
  }

  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    let rpc
    try { rpc = JSON.parse(body) } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ code: 400, error: 'invalid json' }))
      return
    }

    const key = `${rpc.module}/${rpc.func}`
    console.log(`[mock] ${key}`, rpc.params || '')

    const handler = handlers[key]
    let result, code = 0, error = null

    if (handler) {
      try {
        result = handler(rpc.params)
        if (result === null) { code = 403; error = 'login failed' }
      } catch (e) {
        code = 500; error = e.message
      }
    } else {
      console.warn(`[mock] unhandled: ${key}`)
      code = 404; error = `RPC not found: ${key}`
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code, error, result: result ?? null }))
  })
}).listen(PORT, () => {
  console.log(`\n🚀 Mock RPC server running at http://localhost:${PORT}/oui-rpc`)
  console.log('   Start frontend: cd htdoc && npm run dev')
  console.log('   Then open:      http://localhost:5173\n')
})
