FROM alpine:3.20
RUN apk add --no-cache baresip
COPY accounts /root/.baresip/accounts
ENTRYPOINT ["baresip", "-f", "/root/.baresip"]
