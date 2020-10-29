## 简介

lotus 钱包 demo ，支持如下功能：

- 区块同步
- 钱包创建
- 交易发送
- 交易提醒

只支持在 ubuntu 编译运行

## 更新内容

- 优化区块同步逻辑，并且做了持久化同步和交易唯一性存储 [2020-10-29]

## 使用

### 依赖下载

```sh
sudo apt-get install ubuntu-make
```

### 配置文件

创建 config/index.js 配置，根据 lotus 环境修改

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

在 mysql 中创建 filecoin 库，初始化配置

```sql
INSERT INTO `filecoin`.`sync`(`id`, `latest_height`, `current_height`, `created_at`, `updated_at`) VALUES (1, 0, 1, '2020-10-29 23:14:06', '2020-10-29 23:14:09');

```

### 启动

```shell
npm  install

# 同步数据库表结构
npm run syncDB

# 启动
npm start
```
