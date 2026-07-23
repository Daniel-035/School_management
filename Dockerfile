FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci

COPY backend/tsconfig.json ./backend/
COPY backend/src ./backend/src
RUN cd backend && npm run build

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/backend/dist ./backend/dist

USER node
EXPOSE 8080
WORKDIR /app/backend
CMD ["node", "dist/index.js"]
