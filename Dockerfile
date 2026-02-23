FROM oven/bun:1.2-alpine

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --production

COPY src/ ./src/
COPY public/ ./public/

EXPOSE 3000

CMD ["bun", "run", "src/server.ts"]
