FROM node:22-slim

WORKDIR /app

# git is required at runtime — this service clones a target repo per task
# (see src/server.ts) — node:22-slim (Debian-based) doesn't include it.
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# Production deps only — server.mjs is already the fully-bundled application
# code (built locally via `npm run build`, esbuild inlines everything except
# these two, which stay external: @anthropic-ai/claude-agent-sdk bundles a
# native per-platform Claude Code binary that must come from this
# container's own `npm install` (linux x64), never copied from a local Mac
# (arm64) dev machine — same lesson already learned for stt-stream-service's
# native deps; firebase-admin stays external because it's a large,
# frequently-updated dependency with its own native bits.
#
# NOT --omit=optional — firebase-admin/firestore requires the OPTIONAL dep
# @google-cloud/firestore at runtime (confirmed the hard way: first deploy
# crashed on boot with MODULE_NOT_FOUND for it once optional deps were
# dropped).
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.mjs ./

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.mjs"]
