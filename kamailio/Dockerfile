FROM ghcr.io/kamailio/kamailio-ci:5.8

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY kamailio.cfg /etc/kamailio/kamailio.cfg

EXPOSE 5060/udp 5060/tcp
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
