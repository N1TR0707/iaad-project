#!/bin/bash

echo "Running database migration..."
echo "Current directory: $(pwd)"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "Error: Not in backend directory. Please cd to backend directory first."
    exit 1
fi

# Check if migration file exists
if [ ! -f "migrations/add-role-to-users-v2.js" ]; then
    echo "Error: Migration file not found at migrations/add-role-to-users-v2.js"
    exit 1
fi

# Run migration
echo "Running migration..."
node migrations/add-role-to-users-v2.js

echo "Migration completed!"
