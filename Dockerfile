FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma generate
RUN pnpm run build
RUN pnpm prune --prod

EXPOSE 5173

ENV NODE_ENV=production

CMD ["node", "build"]
