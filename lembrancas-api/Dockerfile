# Build stage
FROM golang:1.25-alpine AS builder

# Install build dependencies for CGO (required for SQLite)
RUN apk add --no-cache gcc musl-dev

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

# Create data directory for database
RUN mkdir -p /data && chmod 755 /data

# Create entrypoint script inline to avoid Windows line ending issues
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Ensure data directory exists with proper permissions' >> /docker-entrypoint.sh && \
    echo 'mkdir -p /data' >> /docker-entrypoint.sh && \
    echo 'chmod 755 /data' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Create database file if it does not exist' >> /docker-entrypoint.sh && \
    echo 'if [ ! -f /data/habits.db ]; then' >> /docker-entrypoint.sh && \
    echo '    echo "Creating database file /data/habits.db"' >> /docker-entrypoint.sh && \
    echo '    touch /data/habits.db' >> /docker-entrypoint.sh && \
    echo '    chmod 666 /data/habits.db' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Execute the main application' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["./api"]

