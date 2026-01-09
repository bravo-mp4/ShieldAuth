#!/bin/bash

echo "Starting ShieldAuth Backend..."

# Run migrations
echo "Running database migrations..."
npm run migrate

# Start the server
echo "Starting server..."
exec npm start
