FROM ghcr.io/kamailio/kamailio-ci:5.8

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN mkdir -p /etc/kamailio/lua
COPY kamailio.lua /etc/kamailio/lua/kamailio.lua
COPY users.lua /etc/kamailio/lua/users.lua
COPY did_map.lua /etc/kamailio/lua/did_map.lua

COPY kamailio.cfg /etc/kamailio/kamailio.cfg

EXPOSE 5060/udp 5060/tcp
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
