package.path = "/etc/kamailio/lua/?.lua;" .. package.path
local users = require("users")

function ksr_request_route()
  if KSR.maxfwd.process_maxfwd(10) < 0 then
    KSR.sl.sl_send_reply(483, "Too Many Hops")
    return
  end

  if KSR.is_OPTIONS() then
    KSR.sl.sl_send_reply(200, "OK")
    return
  end

  if KSR.is_REGISTER() then
    if not users.authenticate() then return end
    if KSR.registrar.save("location", 0) < 0 then
      KSR.sl.sl_send_reply(500, "Registrar Error")
    end
    return
  end

  KSR.sl.sl_send_reply(404, "Not Found")
end
