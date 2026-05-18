local M = {}

function M.www_authenticate()
  local rc = KSR.auth_db.auth_check("kamailio", "subscriber", 1)
  if rc < 0 then
    KSR.auth.auth_challenge("kamailio", 0)
    return false
  end
  KSR.auth.consume_credentials()
  return true
end

function M.proxy_authenticate()
  local rc = KSR.auth_db.auth_check("kamailio", "subscriber", 1)
  if rc < 0 then
    KSR.auth.auth_challenge("kamailio", 1)
    return false
  end
  KSR.auth.consume_credentials()
  return true
end

M.authenticate = M.www_authenticate

return M
