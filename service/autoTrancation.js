const EventEmitter = require('events');
const sysBlock = require('../lib/autoTranctions');
const blockEmitter = new EventEmitter();

const errorHandle = function (error) {
  console.error('errorHandle', error);
  blockEmitter.emit('autoTranctions');
};

blockEmitter.on('autoTranctions', async () => {
  console.time('[autoTranctions start]');
  try {
    await sysBlock.start();
  } catch (error) {
    console.error('区块同步异常', error);
  } finally {
    console.timeEnd('[autoTranctions start]');
    blockEmitter.emit('autoTranctions', '同步结束 \n');
  }
});

blockEmitter.emit('autoTranctions');

// 奔溃监测
blockEmitter.on('error', errorHandle);

// 进程崩溃监听
process.on('uncaughtException', errorHandle);
