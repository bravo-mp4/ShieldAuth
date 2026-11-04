# ShieldAuth API image. Build from the repository root:
#   docker build -t shieldauth-api .

FROM node:20-alpine AS build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/migrations ./migrations
COPY backend/package.json ./
USER node
EXPOSE 3000
# Apply any pending migrations, then start the API.
CMD ["sh", "-c", "node dist/migrations/run.js && node dist/src/index.js"]
