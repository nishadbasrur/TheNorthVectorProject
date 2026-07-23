FROM node:22-slim

WORKDIR /app

# Production deps only — server.js is already the fully-bundled application
# code (built locally via `npm run build`, esbuild inlines everything except
# these three, which stay external because they ship native/binary bits
# esbuild shouldn't try to bundle).
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --omit=optional

COPY server.js ./

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]
