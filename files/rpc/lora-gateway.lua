local M = {}
local uci = require "eco.uci"
local log = require "eco.log"

-- Helper: run a shell command and return trimmed output
local function sh(cmd)
    local f = io.popen(cmd)
    if not f then return "" end
    local out = f:read("*a")
    f:close()
    return out:match("^%s*(.-)%s*$")
end

-- Helper: check if a file exists
local function file_exists(path)
    local f = io.open(path, "r")
    if f then f:close() return true end
    return false
end

-- Helper: get service running state via procd/init.d
local function service_running(name)
    local rc = os.execute("/etc/init.d/" .. name .. " status > /dev/null 2>&1")
    return rc == 0
end

-- Helper: get service uptime from /var/run/<name>.pid
local function service_uptime(name)
    local pid_file = "/var/run/" .. name .. ".pid"
    local f = io.open(pid_file, "r")
    if not f then return nil end
    local pid = f:read("*a"):match("%d+")
    f:close()
    if not pid then return nil end
    local stat = io.open("/proc/" .. pid .. "/stat", "r")
    if not stat then return nil end
    stat:close()
    -- uptime from /proc/uptime minus process starttime
    local uptime_s = sh("awk '{print int($1)}' /proc/uptime")
    local starttime = sh("awk '{print $22}' /proc/" .. pid .. "/stat")
    local clk_tck = tonumber(sh("getconf CLK_TCK")) or 100
    local start_s = math.floor(tonumber(starttime or 0) / clk_tck)
    local up = tonumber(uptime_s) or 0
    return up - start_s
end

-- Get SX1302 chip ID via chip_id utility
local function get_chip_id()
    if not file_exists("/usr/bin/chip_id") then
        return "tool not found"
    end
    if not file_exists("/dev/ttyACM0") then
        return "USB not connected"
    end
    local out = sh("/usr/bin/chip_id -u /dev/ttyACM0 2>&1 | grep -i 'chip id' | head -1")
    if out == "" then
        return sh("/usr/bin/chip_id -u /dev/ttyACM0 2>&1 | tail -1")
    end
    return out
end

-- Derive Station EUI from eth0 MAC (same logic as basicstation)
local function get_station_eui()
    local mac = sh("cat /sys/class/net/eth0/address 2>/dev/null")
    if mac == "" then return "unknown" end
    -- insert fffe in the middle: AA:BB:CC:DD:EE:FF -> AA:BB:CC:FF:FE:DD:EE:FF
    local bytes = {}
    for b in mac:gmatch("%x%x") do bytes[#bytes+1] = b end
    if #bytes ~= 6 then return mac end
    return string.format("%s:%s:%s:ff:fe:%s:%s:%s",
        bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6])
end

-- ============================================================
-- Public RPC methods
-- ============================================================

-- get_status: returns gateway hardware and service status
function M.get_status()
    local c = uci.cursor()
    local active = c:get("lora", "global", "active_service") or "basicstation"

    local usb_ok = file_exists("/dev/ttyACM0")
    local chip_id = get_chip_id()
    local eui = get_station_eui()

    local running = service_running(active)
    local uptime = running and service_uptime(active) or nil

    return {
        active_service = active,
        running        = running,
        uptime         = uptime,
        usb_ok         = usb_ok,
        chip_id        = chip_id,
        eui            = eui,
        usb_path       = "/dev/ttyACM0"
    }
end

-- start_service: start the given service
function M.start_service(params)
    local name = params and params.service
    if not name then return nil, "service name required" end
    local rc = os.execute("/etc/init.d/" .. name .. " start")
    return { ok = rc == 0 }
end

-- stop_service: stop the given service
function M.stop_service(params)
    local name = params and params.service
    if not name then return nil, "service name required" end
    local rc = os.execute("/etc/init.d/" .. name .. " stop")
    return { ok = rc == 0 }
end

-- restart_service: restart the given service
function M.restart_service(params)
    local name = params and params.service
    if not name then return nil, "service name required" end
    local rc = os.execute("/etc/init.d/" .. name .. " restart")
    return { ok = rc == 0 }
end

-- set_active_service: switch active service and restart it
function M.set_active_service(params)
    local name = params and params.service
    if name ~= "basicstation" and name ~= "lora_pkt_fwd" then
        return nil, "invalid service name"
    end
    local c = uci.cursor()
    local prev = c:get("lora", "global", "active_service") or ""

    -- stop previous service
    if prev ~= "" and prev ~= name then
        os.execute("/etc/init.d/" .. prev .. " stop 2>/dev/null")
    end

    c:set("lora", "global", "active_service", name)
    c:commit("lora")

    os.execute("/etc/init.d/" .. name .. " restart")
    return { ok = true, active_service = name }
end

-- get_config: read UCI lora config and return as structured object
function M.get_config()
    local c = uci.cursor()
    return {
        basicstation = {
            tc_uri    = c:get("lora", "basicstation", "tc_uri") or "",
            cups_uri  = c:get("lora", "basicstation", "cups_uri") or "",
            auth_mode = c:get("lora", "basicstation", "auth_mode") or "no_auth",
            api_key   = c:get("lora", "basicstation", "api_key") or ""
        },
        lora_pkt_fwd = {
            server_address  = c:get("lora", "lora_pkt_fwd", "server_address") or "",
            serv_port_up    = tonumber(c:get("lora", "lora_pkt_fwd", "serv_port_up")) or 1700,
            serv_port_down  = tonumber(c:get("lora", "lora_pkt_fwd", "serv_port_down")) or 1700
        }
    }
end

-- set_config: write config back to UCI and optionally sync service files
function M.set_config(params)
    if not params then return nil, "params required" end
    local c = uci.cursor()

    -- basicstation section
    if params.basicstation then
        local bs = params.basicstation
        if bs.tc_uri    ~= nil then c:set("lora", "basicstation", "tc_uri",    bs.tc_uri)    end
        if bs.cups_uri  ~= nil then c:set("lora", "basicstation", "cups_uri",  bs.cups_uri)  end
        if bs.auth_mode ~= nil then c:set("lora", "basicstation", "auth_mode", bs.auth_mode) end
        if bs.api_key   ~= nil then c:set("lora", "basicstation", "api_key",   bs.api_key)   end

        -- sync tc.uri file for basicstation
        local tc_uri = c:get("lora", "basicstation", "tc_uri") or ""
        if tc_uri ~= "" then
            os.execute("mkdir -p /etc/basicstation")
            local f = io.open("/etc/basicstation/tc.uri", "w")
            if f then f:write(tc_uri .. "\n"); f:close() end
        end
    end

    -- lora_pkt_fwd section
    if params.lora_pkt_fwd then
        local pf = params.lora_pkt_fwd
        if pf.server_address ~= nil then c:set("lora", "lora_pkt_fwd", "server_address", pf.server_address) end
        if pf.serv_port_up   ~= nil then c:set("lora", "lora_pkt_fwd", "serv_port_up",   tostring(pf.serv_port_up))   end
        if pf.serv_port_down ~= nil then c:set("lora", "lora_pkt_fwd", "serv_port_down",  tostring(pf.serv_port_down))  end
    end

    c:commit("lora")

    -- restart active service if requested
    if params.restart then
        local active = c:get("lora", "global", "active_service") or ""
        if active ~= "" then
            os.execute("/etc/init.d/" .. active .. " restart")
        end
    end

    return { ok = true }
end

return M
