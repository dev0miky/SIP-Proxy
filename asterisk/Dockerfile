FROM andrius/asterisk:18-current
COPY conf /etc/asterisk
COPY --chmod=0755 entrypoint.sh /usr/local/bin/sip-proxy-entrypoint.sh
EXPOSE 5060/udp 5060/tcp 10000-10100/udp
ENTRYPOINT ["/usr/local/bin/sip-proxy-entrypoint.sh"]
