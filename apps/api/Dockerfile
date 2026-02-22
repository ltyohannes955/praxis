FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/api apps/api

RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile --ignore-scripts

RUN pnpm --filter @praxis/database generate

EXPOSE 5000

CMD ["pnpm", "--filter", "@praxis/api", "dev"]
