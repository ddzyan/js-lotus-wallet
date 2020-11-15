const EventEmitter = require('events');
const { getRandom } = require('../util');
const sysBlock = require('../lib/sysBlock');
const blockEmitter = new EventEmitter();

const errorHandle = function (error) {
  console.error('errorHandle', error);
  blockEmitter.emit('autoTranctions');
};

blockEmitter.on('autoTranctions', async () => {
  console.time('[autoTranctions start]');
  const uid = getRandom();
  try {
    await sysBlock.start(uid);
  } catch (error) {
    console.error('区块同步异常', error);
  } finally {
    console.timeEnd('[autoTranctions start]');
    console.log('-----------------------\n');
    blockEmitter.emit(`autoTranctions`);
  }
});

blockEmitter.emit('autoTranctions');

// 奔溃监测
blockEmitter.on('error', errorHandle);

// 进程崩溃监听
process.on('uncaughtException', errorHandle);
