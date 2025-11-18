#!/bin/sh
set -e

# Create database directory if it doesn't exist
mkdir -p /app/data

# Set permissions for database directory
chmod 777 /app/data

# Create database file if it doesn't exist and set permissions
if [ ! -f /app/habits.db ]; then
    touch /app/habits.db
    chmod 666 /app/habits.db
fi

# Ensure the database file has write permissions
chmod 666 /app/habits.db 2>/dev/null || true

# Execute the main application
exec "$@"

