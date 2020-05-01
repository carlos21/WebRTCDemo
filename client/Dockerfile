FROM node:14.0.0-alpine3.10

WORKDIR /usr/src/app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY ./client/package.json ./
COPY ./client/package-lock.json ./

RUN npm install

# If you are building your code for production
# RUN npm ci --only=production

COPY . .

EXPOSE 4000

CMD [ "yarn", "start"]