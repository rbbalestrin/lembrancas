# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -o api ./cmd

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates sqlite wget

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/api .

# Copy database file if it exists (optional, for persistence)
# The database will be created if it doesn't exist

EXPOSE 8080

CMD ["./api"]

