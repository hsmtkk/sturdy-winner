FROM golang:1.20 AS builder
WORKDIR /app
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY web/ /app/web/
WORKDIR /app/web
RUN CGO_ENABLED=0 go build -o web

FROM gcr.io/distroless/static-debian11 AS runtime
COPY --from=builder /app/web/web /app/web/web
ENTRYPOINT ["/app/web/web"]
