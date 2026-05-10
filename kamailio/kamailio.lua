function ksr_request_route()
  if KSR.maxfwd.process_maxfwd(10) < 0 then
    KSR.sl.sl_send_reply(483, "Too Many Hops")
    return
  end

  if KSR.is_OPTIONS() then
    KSR.sl.sl_send_reply(200, "OK")
    return
  end

  KSR.sl.sl_send_reply(404, "Not Found")
end
