#!/bin/sh
set -e

# Create database file if it doesn't exist
if [ ! -f /app/habits.db ]; then
    echo "Creating database file /app/habits.db"
    touch /app/habits.db
fi

# Ensure the database file has write permissions (666 = rw-rw-rw-)
chmod 666 /app/habits.db

# Also ensure the directory has proper permissions
chmod 755 /app

# Execute the main application
exec "$@"

