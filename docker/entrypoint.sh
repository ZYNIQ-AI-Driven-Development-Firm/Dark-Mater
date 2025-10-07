#!/bin/sh

# Substitute environment variables in the template
envsubst '${VITE_API_BASE_URL} ${VITE_WS_BASE_URL} ${NODE_ENV}' < /usr/share/nginx/html/env-template.js > /usr/share/nginx/html/env.js

# Start nginx
exec "$@"