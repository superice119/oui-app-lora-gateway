# oui-app-lora-gateway

LoRa Gateway management UI for [OUI](https://github.com/zhaojh329/oui), running on the GainStrong Oolite V8 router (MT7621A, ImmortalWrt 23.05) with the WM1303 / SX1302 LoRa module.

Supports **basicstation** and **lora_pkt_fwd** with real-time status monitoring, service control and configuration — all from a clean, responsive Web UI.

---

## Screenshots

| Overview | Service Control | Configuration |
|----------|-----------------|---------------|
| Status cards, chip ID, EUI | Start / Stop / Restart | basicstation & lora_pkt_fwd forms |

---

## Local Development (no router needed)

The project includes a **Mock RPC server** so you can develop and test the entire UI locally.

```bash
# 1. Install dependencies
cd htdoc && npm install

# 2. Terminal A — start Mock RPC server (simulates all router calls)
npm run mock

# 3. Terminal B — start Vite dev server with HMR
npm run dev

# 4. Open browser
open http://localhost:5173
```

Vite proxies `/oui-rpc` → `localhost:3000` (mock server) automatically in dev mode.

### Mock server capabilities

- Stateful service start/stop/restart (in-memory state)
- Service switching (basicstation ↔ lora_pkt_fwd)
- Full config read/write
- Simulated uptime counter, chip ID, EUI

---

## Project Structure

```
oui-app-lora-gateway/
├── Makefile                     # OpenWrt IPK build definition
├── mock/
│   └── server.mjs               # Local dev Mock RPC server
├── files/
│   ├── menu.json                 # OUI sidebar menu registration
│   ├── rpc/lora-gateway.lua      # Lua-eco RPC backend (runs on router)
│   ├── etc/config/lora           # Default UCI config schema
│   └── lighttpd/50-oui-port.conf # lighttpd port 8080 override
└── htdoc/                        # Vue3 frontend (Vite + Element Plus)
    ├── index.vue                 # Overview page (status + hardware info)
    ├── service.vue               # Service control page
    ├── config.vue                # Configuration page (tabbed forms)
    ├── locale.json               # en / zh-CN i18n strings
    ├── dev-main.mjs              # Dev-only app entry (OUI stubs)
    ├── dev-shell.vue             # Dev-only sidebar shell
    ├── components/
    │   └── StatusBadge.vue       # Animated running/stopped badge
    └── styles/
        ├── variables.scss        # Element Plus theme overrides
        └── lora-cards.scss       # Status card styles
```

---

## Architecture

```
Browser
  │
  ├─ Dev mode:   localhost:5173  ──proxy──►  localhost:3000 (mock/server.mjs)
  └─ Production: :8080 (lighttpd)  ──SCGI──►  lua-eco (lora-gateway.lua)
                                                │
                                         UCI /etc/config/lora
                                         /etc/basicstation/tc.uri
                                         /etc/init.d/basicstation
                                         /etc/init.d/lora_pkt_fwd
```

### Coexistence with LuCI

| Service | Port | Usage |
|---------|------|-------|
| uhttpd (LuCI) | **:80** | System management (stays untouched) |
| lighttpd (OUI) | **:8080** | LoRa Gateway UI |

The two HTTP stacks are completely independent — no conflicts.

---

## Installation on Router

### Prerequisites

```bash
opkg update
opkg install oui oui-ui-core
```

### Install the app

```bash
# Copy IPK to router
scp lora-gateway_1.0.0-1_all.ipk root@192.168.1.1:/tmp/

# Install
ssh root@192.168.1.1 opkg install /tmp/lora-gateway_1.0.0-1_all.ipk

# Restart OUI
/etc/init.d/oui restart
```

Access at: `http://192.168.1.1:8080/`

---

## UCI Config Schema

```
/etc/config/lora

config lora 'global'
    option active_service 'basicstation'   # or 'lora_pkt_fwd'

config basicstation
    option tc_uri    'ws://your-lns:3001'
    option cups_uri  ''
    option auth_mode 'no_auth'             # no_auth | tls_server | tls_mutual
    option api_key   ''

config lora_pkt_fwd
    option server_address 'eu1.cloud.thethings.network'
    option serv_port_up   1700
    option serv_port_down 1700
```

---

## Building the IPK

### via GitHub Actions (recommended)

Push to `main` → CI builds and uploads `lora-gateway_1.0.0-1_all.ipk` as an artifact.

Tag a release (`git tag v1.0.0 && git push --tags`) to automatically create a GitHub Release with the IPK attached.

### via ImmortalWrt SDK (local)

```bash
# Place package in SDK
cp -r . sdk/package/oui-apps/lora-gateway/

# Build
cd sdk
make package/lora-gateway/compile V=s
```

---

## Hardware

| Component | Details |
|-----------|---------|
| Router | GainStrong Oolite V8 (MT7621A) |
| OS | ImmortalWrt 23.05-SNAPSHOT |
| LoRa Module | WM1303 (SX1302 + USB-CDC) |
| USB Device | `/dev/ttyACM0` (USB ID `19f5:5740`) |
| Station EUI | `ce:f4:ff:fe:c3:4f:ce:00` |
| Frequency | 868 MHz (EU868) |

---

## License

MIT © 2024 superice119
