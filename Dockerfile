FROM node:12.18.0-alpine as build

WORKDIR /app

COPY . .

RUN npm config set registry https://registry.npm.taobao.org && \
npm ci --production

FROM node:12.18.0-alpine

COPY --from=build /app  /app

CMD ["npm","start"]
