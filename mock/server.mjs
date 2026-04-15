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

  // ── system diagnostics & settings ──
  'system/get_log': () => {
    const lines = Array.from({ length: 50 }, (_, i) => {
      const level = ['user.notice', 'user.info', 'user.warn', 'user.err'][i % 4]
      const proc  = ['lora_pkt_fwd[4056]', 'basicstation[1234]', 'system[1]'][i % 3]
      const msgs  = ['# RF packets received: 0', '# TX errors: 0', 'Listening on /dev/ttyACM0', '# PULL_DATA sent: 6', 'SX1302 ChipID=1']
      const d     = new Date(Date.now() - (50 - i) * 30000)
      return `${d.toDateString().slice(0, 10)} ${d.toTimeString().slice(0, 8)} ${level} ${proc}: ${msgs[i % msgs.length]}`
    }).join('\n')
    return { lines }
  },

  'system/net_tool': (p) => {
    const { tool, host } = p || {}
    if (!host) return { output: 'Error: no host specified' }
    const outputs = {
      ping:     `PING ${host}: 56 data bytes\n64 bytes from ${host}: icmp_seq=0 ttl=56 time=12.3 ms\n64 bytes from ${host}: icmp_seq=1 ttl=56 time=11.8 ms\n--- ${host} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`,
      trace:    `traceroute to ${host}\n 1  192.168.1.1  1.2 ms\n 2  10.0.0.1  8.4 ms\n 3  ${host}  14.2 ms`,
      nslookup: `Server: 8.8.8.8\nAddress: 8.8.8.8#53\n\nNon-authoritative answer:\nName: ${host}\nAddress: 93.184.216.34`
    }
    return { output: outputs[tool] || 'Unknown tool' }
  },

  'system/file_list': (p) => {
    const path = p?.path || '/'
    const mockFs = {
      '/':              [{ type: 'dir', name: 'etc' }, { type: 'dir', name: 'tmp' }, { type: 'dir', name: 'mnt' }, { type: 'file', name: 'banner' }, { type: 'file', name: 'openwrt_release' }],
      '/mnt':           [{ type: 'dir', name: 'mmcblk0p1' }],
      '/mnt/mmcblk0p1': [{ type: 'file', name: 'wisgateos.bin' }, { type: 'dir', name: 'logs' }, { type: 'file', name: 'config.json' }],
      '/etc':           [{ type: 'file', name: 'config' }, { type: 'dir', name: 'lora' }, { type: 'file', name: 'hostname' }],
    }
    return { path, entries: mockFs[path] || [] }
  },

  'system/get_firmware': () => ({
    version: 'ImmortalWrt_1.0.0_Oolite-V8', build_date: '2025-04-01'
  }),

  'system/get_general': () => ({
    hostname: 'oolite-v8', timezone: 'Asia/Shanghai', ntp: 'pool.ntp.org'
  }),

  'system/set_general': (p) => {
    console.log('[mock] set_general', p)
    return { ok: true }
  },

  // ── network status ──
  'network/get_status': () => ({
    wan: { iface: 'eth0', proto: 'DHCP', ip: '192.168.100.50', gateway: '192.168.100.1', dns: '8.8.8.8' },
    lan: { iface: 'br-lan', ip: '192.168.1.1', mask: '255.255.255.0' }
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
