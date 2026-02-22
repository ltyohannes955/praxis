FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/web apps/web

RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile --ignore-scripts

RUN pnpm --filter @praxis/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@praxis/web", "start"]
