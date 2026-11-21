#!/bin/sh
set -e

if [ -z "$JWT_SECRET" ]; then
  echo "JWT_SECRET is not set. Add JWT_SECRET (at least 32 characters) to the .env file next to docker-compose.yml and start again." >&2
  exit 1
fi

npm run migrate -- up
exec node dist/server.js
