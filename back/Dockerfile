FROM node:16-alpine AS builder

COPY ./package.json /app/

WORKDIR /app

RUN apk add python3 make g++

RUN npm install

COPY . /app

RUN npm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]
