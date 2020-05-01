FROM node:14.0.0-alpine3.10

WORKDIR /usr/src/app

COPY ./server/package*.json ./
COPY ./server/config/redis.conf /etc/redis/redis.conf

RUN yarn install

# If you are building your code for production
# RUN npm ci --only=production

COPY . .

EXPOSE 9000

ENV REDIS_PASS 86a2fa7bbc75b6f56fbf2ca8f09bde1bb3e9f2db

ENTRYPOINT [ "yarn", "start"]