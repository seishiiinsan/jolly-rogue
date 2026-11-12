# syntax=docker/dockerfile:1
# Contexte de build : racine du monorepo (voir docker-compose.yml).

FROM node:26-alpine AS build
# Corepack n'est plus livré avec Node >= 25 : pnpm est installé explicitement.
RUN npm install -g pnpm@10.28.0
WORKDIR /repo

# Manifestes d'abord pour profiter du cache Docker.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/data-pipeline/package.json packages/data-pipeline/
RUN pnpm install --frozen-lockfile --filter @jolly-rogue/data-pipeline...

COPY tsconfig.base.json ./
COPY packages/db packages/db
COPY packages/data-pipeline packages/data-pipeline
RUN pnpm --filter @jolly-rogue/data-pipeline... run build \
 && pnpm deploy --legacy --filter @jolly-rogue/data-pipeline --prod /out

FROM node:26-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
USER node
ENTRYPOINT ["node", "dist/cli.js"]
