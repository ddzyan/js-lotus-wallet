FROM ubuntu:18.04 as build

WORKDIR /app

COPY . .

RUN apt-get install curl

RUN curl -sL https://deb.nodesource.com/setup_12.x | -E bash -

RUN apt-get install -y nodejs


RUN npm config set registry https://registry.npm.taobao.org && \
npm ci --production

FROM node:12.18.0-alpine

COPY --from=build /app  /app

CMD ["npm","start"]
