FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Build frontend
FROM base AS frontend-build
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && bun install
COPY frontend ./frontend
RUN cd frontend && bun run build

# Final image
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY src ./src
COPY package.json tsconfig.json drizzle.config.ts ./

EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]
