# syntax=docker/dockerfile:1
# Contexte de build : racine du monorepo (voir docker-compose.yml).
# Build statique du front, servi par nginx : aucun back, tout se joue dans le navigateur.

FROM node:26-alpine AS build
# Corepack n'est plus livré avec Node >= 25 : pnpm est installé explicitement.
RUN npm install -g pnpm@10.28.0
WORKDIR /repo

# Manifestes d'abord pour profiter du cache Docker.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/game-data/package.json packages/game-data/
COPY packages/engine/package.json packages/engine/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile --filter @jolly-rogue/web...

COPY tsconfig.base.json ./
COPY packages/db packages/db
COPY packages/game-data packages/game-data
COPY packages/engine packages/engine
COPY packages/web packages/web
# Le build lit les exports commités : données de jeu et noms du canon.
COPY data/exports/game.json data/exports/canon.json data/exports/
RUN pnpm --filter @jolly-rogue/web run build

FROM nginx:1-alpine
COPY --from=build /repo/packages/web/dist /usr/share/nginx/html
EXPOSE 80
