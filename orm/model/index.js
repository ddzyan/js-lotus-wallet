const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

const { mysql: mysqlOptions } = require('../../config');

const db = {};

const sequelize = new Sequelize(
  mysqlOptions.database, // 数据库名称
  mysqlOptions.username, // 用户名
  mysqlOptions.password, // 用户密码
  mysqlOptions.options // 高级配置
);

fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== 'index.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

db.Sequelize = Sequelize;

module.exports = db;
