# syntax=docker/dockerfile:1
# Contexte de build : racine du monorepo (voir docker-compose.yml).

FROM node:26-alpine AS build
# Corepack n'est plus livré avec Node >= 25 : pnpm est installé explicitement.
RUN npm install -g pnpm@10.28.0
WORKDIR /repo

# Manifestes d'abord pour profiter du cache Docker.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/game-data/package.json packages/game-data/
COPY packages/engine/package.json packages/engine/
COPY packages/sim/package.json packages/sim/
RUN pnpm install --frozen-lockfile --filter @jolly-rogue/sim...

COPY tsconfig.base.json ./
COPY packages/db packages/db
COPY packages/game-data packages/game-data
COPY packages/engine packages/engine
COPY packages/sim packages/sim
RUN pnpm --filter @jolly-rogue/db run build \
 && pnpm --filter @jolly-rogue/game-data run compile \
 && pnpm --filter @jolly-rogue/engine run build \
 && pnpm --filter @jolly-rogue/sim run build \
 && pnpm deploy --legacy --filter @jolly-rogue/sim --prod /out

FROM node:26-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
USER node
ENTRYPOINT ["node", "dist/cli.js"]
