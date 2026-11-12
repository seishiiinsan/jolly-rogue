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
RUN pnpm install --frozen-lockfile --filter @jolly-rogue/game-data...

COPY tsconfig.base.json ./
COPY packages/db packages/db
COPY packages/game-data packages/game-data
# `compile` et non `build` : game.json s'écrit à l'exécution, dans le volume data/exports.
RUN pnpm --filter @jolly-rogue/db run build \
 && pnpm --filter @jolly-rogue/game-data run compile \
 && pnpm deploy --legacy --filter @jolly-rogue/game-data --prod /out

FROM node:26-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
USER node
ENTRYPOINT ["node", "dist/cli.js"]
