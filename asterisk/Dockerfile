FROM andrius/asterisk:18-current
COPY conf /etc/asterisk
EXPOSE 5060/udp 5060/tcp 10000-10100/udp
CMD ["asterisk", "-fvvv", "-T", "-W", "-U", "asterisk", "-G", "asterisk"]
