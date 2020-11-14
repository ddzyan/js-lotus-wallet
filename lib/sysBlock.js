/**
 * 1. 获取区块同步配置
 * 2. 获取节点状态
 *   -. 正常则返回最新区块高度，
 *     1. 判断区块最新区块高度是否大 > 钱包同步高度+同步步长，不满足则休眠等待下次同步
 *       1. 解析tipset
 *         1. 异步获取指定高度的TipSet，获取 blockCids
 *         2. 遍历解析 blockCids
 *           1. 检查 blockCid 是否为 bad，异常则输出日志信息并且不继续
 *           2. 获取指定 blockCid 的区块信息
 *           3. 遍历区块内的所有交易信息，只返回 method 为 0 的交易
 *        3.
 *       2. 遍历返回的所有交易，判断 from , to 是否为指定钱包地址，满足则继续，不满足则跳出
 *       3. 进行入账
 *          1. 交易入库
 *          2. rabbitMQ
 *   -. 否则跳出异常报警，休眠等待下次同步
 */

const { EventEmitter } = require('events');
const { HttpJsonRpcConnector, JsonRpcProvider } = require('filecoin.js');
const db = require('../orm/model');

const unitConversion = function (number, decimal = 18) {
  number = Number.parseInt(number);
  decimal = Math.pow(10, decimal);
  const price = number / decimal;
  return price;
};

const getWalletConfig = async function () {
  const syncRes = await db.sync.findOne({
    where: {
      id: 1,
    },
  });

  return syncRes;
};

const syncEmit = new EventEmitter();

syncEmit.on('start', async ({ latestHeight, step }) => {
  console.log(`开始解析${blockHeight}高度`);
  console.time('syncBlock');
  try {
    let promiseArr = [];
    if (blockHeight + step < latestHeight) {
      for (let i = 0; i < step; i++) {
        promiseArr.push(jsonRpcProvider.chain.getTipSetByHeight(blockHeight + i));
      }
    }

    const tipSets = await Promise.all(promiseArr);
    let transactionCount = 0;
    for (const tipSet of tipSets) {
      const { Cids: blockCids } = tipSet;

      for (let i = 0; i < blockCids.length; i++) {
        const crtBlock = blockCids[i];
        const reason = await jsonRpcProvider.sync.checkBad(crtBlock); // 应该检查一个块是否被标记为 bad
        if (!reason) {
          // 根据 blockCid 获取指定区块消息
          const blockMessages = await jsonRpcProvider.chain.getBlockMessages(crtBlock);
          const { BlsMessages, SecpkMessages } = blockMessages;
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
      blockHeight++;
    }
    console.timeEnd('syncBlock');
    console.log(`${blockHeight} 高度 step ${step}，成功同步交易 ${transactionCount} 笔`);
    await db.sync.update(
      { current_height: blockHeight },
      {
        where: {
          id: 1,
        },
      }
    );
    syncEmit.emit('start', { latestHeight, step });
  } catch (error) {
    console.timeEnd('syncBlock');
    syncEmit.emit('error', error);
  }
});

// 统一异常处理
syncEmit.on('error', error => {
  if (error instanceof Error) {
    const { message } = error;
    console.error(error);
    if (message === 'looking for tipset with height greater than start point') {
      console.error(message);
      // 等待30秒，再继续
      setTimeout(() => {
        syncEmit.emit('start', blockHeight);
      }, 30 * 1000);
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
    syncEmit.emit('start', { latestHeight: latest_height, step: 2 });
  }
};
