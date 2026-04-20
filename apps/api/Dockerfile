# syntax=docker/dockerfile:1.7
# ---------- 1) deps stage: install all deps (incl. dev) ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Native build deps for bcrypt and prisma engines
RUN apk add --no-cache python3 make g++ openssl libc6-compat

COPY package.json yarn.lock* ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile --network-timeout 600000

# ---------- 2) build stage: prisma generate + nest build ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn prisma:generate
RUN yarn build

# Strip dev deps
RUN yarn install --production --ignore-scripts --prefer-offline --frozen-lockfile

# ---------- 3) runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache openssl libc6-compat tini \
 && addgroup -g 1001 -S nodejs \
 && adduser  -u 1001 -S nestjs -G nodejs

COPY --from=build --chown=nestjs:nodejs /app/dist           ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules   ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/prisma         ./prisma
COPY --from=build --chown=nestjs:nodejs /app/package.json   ./package.json

USER nestjs
EXPOSE 3001

# tini for proper PID 1 signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
