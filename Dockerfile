FROM node:20.17.0 AS builder
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn run build

FROM node:20.17.0-alpine
WORKDIR /app
ENV NODE_ENV production
ENV ENV_FILE=env.production

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY --from=builder /app/tsconfig.json .
COPY --from=builder /app/tsconfig.build.json .

COPY --from=builder /app/env.production ./env.production

EXPOSE 8080
