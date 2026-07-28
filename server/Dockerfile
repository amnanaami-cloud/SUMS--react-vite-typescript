FROM node:22-alpine AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
RUN npm ci
COPY server ./server
RUN npm run db:generate && npm run build:api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/prisma ./server/prisma
EXPOSE 3000
USER node
CMD ["node", "server/dist/main.js"]
