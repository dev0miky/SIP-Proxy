USE kamailio;

INSERT INTO subscriber (username, domain, password, ha1) VALUES
  ('alice', 'kamailio', '1234', MD5(CONCAT('alice:kamailio:1234'))),
  ('bob',   'kamailio', '1234', MD5(CONCAT('bob:kamailio:1234')));
