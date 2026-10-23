#!/bin/bash
# Rebuilds the web app and uploads it to the Netlify site routiq-26581 (log in first with: npx netlify-cli login)
set -e
cd "$(dirname "$0")/.."
./scripts/build-offline.sh
npx --yes netlify-cli deploy --dir dist --prod --no-build --site 3ad1f9fc-a5ab-41ae-9864-d9a88ee43a2e
