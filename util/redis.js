const Redis = require('ioredis');
const _ = require('lodash');

const { redis: redisConfig } = require('../config/config');

const redis = new Redis({ port: redisConfig.port, host: redisConfig.host, db: redisConfig.db, password: redisConfig.password });

module.exports = {
  setHash: async () => {},

  getHash: async key => {},
};
