const syncBlock = require('./lib/sysBlock');
const db = require('./orm/model');
const { lotus } = require('./config');

db.sequelize
  .authenticate()
  .then(async () => {
    console.log('mysql connect success');

    // 获取保存的区块最新高度
    const syncRes = await db.sync.findOne({
      where: {
        id: 1,
      },
      attributes: ['latest_height', 'current_height'],
      raw: true,
    });

    if (syncRes) {
      const { current_height } = syncRes;
      syncBlock(lotus.url, lotus.token, current_height);
    } else {
      console.error('请先配置sync信息');
    }
  })
  .catch(error => {
    console.error(error);
  });
