package.path = "/etc/kamailio/lua/?.lua;" .. package.path
local users = require("users")
local did_map = require("did_map")

local FS_ADDR = os.getenv("FS_ADDR") or "freeswitch:5080"
local ITSP_HOST = (os.getenv("ITSP_PROXY") or ""):gsub(":%d+$", "")

local function loose_route()
  if KSR.rr.loose_route() > 0 then
    KSR.tm.t_relay()
    return true
  end
  return false
end

local function relay()
  KSR.rr.record_route()
  if KSR.tm.t_relay() < 0 then
    KSR.sl.sl_reply_error()
  end
end

local function route_to_fs(target)
  KSR.pv.sets("$ru", "sip:" .. target .. "@" .. FS_ADDR)
  relay()
end

local function looks_like_pstn(ruser)
  return ruser ~= nil and ruser:match("^%+?%d%d%d%d%d%d%d%d+$") ~= nil
end

local function source_is_itsp()
  if ITSP_HOST == "" then return false end
  return KSR.pv.get("$si") == ITSP_HOST
end

local function route_inbound()
  local dialed = KSR.pv.get("$rU")
  local target = did_map[dialed]
  if not target then
    KSR.sl.sl_send_reply(404, "Unknown DID")
    return
  end
  route_to_fs(target)
end

function ksr_request_route()
  KSR.siptrace.sip_trace()

  if KSR.maxfwd.process_maxfwd(10) < 0 then
    KSR.sl.sl_send_reply(483, "Too Many Hops")
    return
  end

  if KSR.is_OPTIONS() then
    KSR.sl.sl_send_reply(200, "OK")
    return
  end

  if loose_route() then return end

  if KSR.is_REGISTER() then
    if not users.authenticate() then return end
    if KSR.registrar.save("location", 0) < 0 then
      KSR.sl.sl_send_reply(500, "Registrar Error")
    end
    return
  end

  if KSR.is_INVITE() and source_is_itsp() then
    route_inbound()
    return
  end

  if KSR.is_INVITE() or KSR.is_ACK() or KSR.is_BYE() or KSR.is_CANCEL() then
    if KSR.is_INVITE() then
      if not users.authenticate() then return end
    end
    local ruser = KSR.pv.get("$rU")
    if ruser == "alice" or ruser == "bob" or ruser == "9196" then
      route_to_fs(ruser)
      return
    end
    if looks_like_pstn(ruser) then
      route_to_fs(ruser)
      return
    end
    KSR.sl.sl_send_reply(404, "Not Found")
    return
  end

  KSR.sl.sl_send_reply(405, "Method Not Allowed")
end

function ksr_reply_route()
  KSR.siptrace.sip_trace()
  return 1
end
