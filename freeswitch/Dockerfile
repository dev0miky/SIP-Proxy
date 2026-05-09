FROM dheaps/freeswitch:latest
COPY conf /etc/freeswitch
EXPOSE 5080/udp 5080/tcp 16384-16484/udp
CMD ["freeswitch", "-nf", "-nonat"]
