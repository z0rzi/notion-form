FROM node:16-alpine

RUN mkdir -p /app
WORKDIR /app

# install and cache app dependencies
COPY package.json /app/package.json
RUN npm install

COPY . /app
RUN npm run build
