FROM dheaps/freeswitch:latest
COPY conf /etc/freeswitch
COPY --chmod=0755 entrypoint.sh /usr/local/bin/sip-proxy-entrypoint.sh
EXPOSE 5080/udp 5080/tcp 16384-16484/udp
ENTRYPOINT ["/usr/local/bin/sip-proxy-entrypoint.sh"]
CMD ["freeswitch", "-nf", "-nonat"]
