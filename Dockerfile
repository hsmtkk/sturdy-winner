FROM golang:1.20 AS builder
WORKDIR /app
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY web/ /app/web/
WORKDIR /app/web
RUN CGO_ENABLED=0 go build -o web

FROM ubuntu:22.04 AS runtime
RUN apt-get -y update && apt-get -y install ca-certificates
COPY oauth2-proxy /app/oauth2-proxy
COPY --from=builder /app/web/web /app/web/web
COPY entrypoint.sh /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
