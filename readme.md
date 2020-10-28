## 简介

lotus 钱包 demo ，支持如下功能：

- 区块同步
- 钱包创建
- 交易发送
- 交易提醒

```shell
npm  install
```

创建 config/index.js 配置

```js
module.exports = {
  lotus: {
    url: 'http://127.0.0.1:1234/rpc/v0',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIl19.crmGqRVPmgLrNgYveL6GhwF07_tVJGHK1xSaEaPy-VE',
  },
  mysql: {
    username: 'test',
    password: '123456',
    database: 'filecoin',
    options: {
      host: '127.0.0.1',
      port: 3306,
      dialect: 'mysql',
      timezone: '+08:00',
      query: {
        raw: true,
      },
      sync: { force: false }, // 开启，则每次将强制同步表结构（删除后重新创建）
      logging: (sql, timing) => {
        if (typeof timing === 'number' && timing > 5000) {
          console.warn(`[sequelize](${timing} ms) ${sql}`);
        }
      },
      poll: {
        max: 10,
        min: 5,
        acquire: 60000,
        idle: 30000,
      },
      define: {
        underscored: false,
        freezeTableName: true,
        charset: 'utf8mb4',
        engine: 'innodb',
        dialectOptions: {
          collate: 'utf8mb4_general_ci',
          connectTimeout: 30000,
          dateStrings: true,
          typeCast: true,
        },
        timestamps: true,
      },
      // isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      // operatorsAliases: false,
    },
  },
};
```
