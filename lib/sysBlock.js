const { EventEmitter } = require('events');
const { HttpJsonRpcConnector, JsonRpcProvider } = require('filecoin.js');
const db = require('../orm/model');

const unitConversion = function (number, decimal = 18) {
  number = Number.parseInt(number);
  decimal = Math.pow(10, decimal);
  const price = number / decimal;
  return price;
};

const syncEmit = new EventEmitter();

syncEmit.on('start', async () => {
  console.log(`开始解析${blockHeight}高度`);
  console.time('syncBlock');
  try {
    const tipSet = await jsonRpcProvider.chain.getTipSetByHeight(blockHeight);

    const { Cids: blockCids } = tipSet;

    let transactionCount = 0;
    for (let i = 0; i < blockCids.length; i++) {
      const crtBlock = blockCids[i];
      const reason = await jsonRpcProvider.sync.checkBad(crtBlock); // 应该检查一个块是否被标记为 bad
      if (!reason) {
        // 根据 blockCid 获取指定区块消息
        const blockMessages = await jsonRpcProvider.chain.getBlockMessages(crtBlock);
        const { BlsMessages } = blockMessages;
        for (const transaction of BlsMessages) {
          const { Version, To, From, Nonce, Value, GasLimit, GasFeeCap, GasPremium, Method, Params, CID } = transaction;
          const dealCid = CID['/'];
          const blockCid = blockCids[i]['/'];
          await db.transaction.findCreateFind({
            where: {
              deal_cid: dealCid,
              block_cid: blockCid,
              height: blockHeight,
            },
            defaults: {
              version: Version,
              to: To,
              from: From,
              nonce: Nonce,
              value: unitConversion(Value),
              gas_limit: GasLimit,
              gas_fee_cap: GasFeeCap,
              gas_premium: GasPremium,
              method: Method,
              block_cid: blockCid,
              height: blockHeight,
              params: Params,
              deal_cid: dealCid,
            },
          });
          transactionCount++;
        }
      } else {
        throw reason;
      }
    }
    console.timeEnd('syncBlock');
    console.log(`${blockHeight} 高度，成功同步交易 ${transactionCount} 笔`);
    await db.sync.update(
      { current_height: blockHeight },
      {
        where: {
          id: 1,
        },
      }
    );
    syncEmit.emit('start', blockHeight++);
  } catch (error) {
    syncEmit.emit('error', error);
  }
});

// 统一异常处理
syncEmit.on('error', error => {
  if (error instanceof Error) {
    const { message } = error;
    if (message === 'looking for tipset with height greater than start point') {
      // 等待30秒，再继续
      setTimeout(() => {
        syncEmit.emit('start', blockHeight);
      }, 30 * 1000);
    } else {
      console.error(error);
    }
  } else {
    console.error(error);
  }
});

let httpConnector;
let jsonRpcProvider;
let blockHeight;

module.exports = async function (url, token, height) {
  blockHeight = height;
  if (!httpConnector || !httpConnector) {
    httpConnector = new HttpJsonRpcConnector({ url, token });
    jsonRpcProvider = new JsonRpcProvider(httpConnector);
  }

  const state = await jsonRpcProvider.sync.state(); // 返回lotus同步系统的当前状态。
  if (Array.isArray(state.ActiveSyncs)) {
    const { Height: latest_height } = state.ActiveSyncs[0];
    // 更新最新区块高度
    await db.sync.update(
      {
        latest_height,
      },
      {
        where: {
          id: 1,
        },
      }
    );
    console.log('lotus 节点同步正常');
    syncEmit.emit('start');
  }
};
