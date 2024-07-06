# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci

COPY Server ./Server
COPY prisma/postgresql ./prisma

RUN npx prisma generate

# ---- Run Stage ----
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app .

# Install dockerize
ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

RUN adduser -D appuser
RUN chown -R appuser /usr/src/app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD node Server/healthcheck.js

CMD [ "node", "Server/server.js" ]