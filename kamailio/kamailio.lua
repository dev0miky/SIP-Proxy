package.path = "/etc/kamailio/lua/?.lua;" .. package.path
local users = require("users")

local FS_ADDR = os.getenv("FS_ADDR") or "freeswitch:5080"

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

local function route_internal_call(user)
  KSR.pv.sets("$ru", "sip:" .. user .. "@" .. FS_ADDR)
  relay()
end

function ksr_request_route()
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

  if KSR.is_INVITE() or KSR.is_ACK() or KSR.is_BYE() or KSR.is_CANCEL() then
    if KSR.is_INVITE() then
      if not users.authenticate() then return end
    end
    local ruser = KSR.pv.get("$rU")
    if ruser == "alice" or ruser == "bob" or ruser == "9196" then
      route_internal_call(ruser)
      return
    end
    KSR.sl.sl_send_reply(404, "Not Found")
    return
  end

  KSR.sl.sl_send_reply(405, "Method Not Allowed")
end
