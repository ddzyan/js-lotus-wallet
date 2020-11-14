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
const config = require('../config');
const Lotus = require('./lotus');
const dayjs = require('dayjs');
const dao = require('./dao');
const { bigAdd, bigMinus, getRandom, sleep } = require('./utils');
const lotus = new Lotus(config.lotus.url, config.lotus.token);

const loggerInfo = function (uid, message) {
  let logText = `${uid} ${dayjs().format('YYYY-MM-DD hh:mm:ss')} Info : ${message}`;
  return logText;
};

const loggerError = function (uid, error) {
  let logText = `${uid} ${dayjs().format('YYYY-MM-DD hh:mm:ss')} Error : ${error}`;
  return logText;
};

/**
 * @description 检查账号是否存在
 * @param {Array<Object>} transactionList
 * @param {Array<string>} accountList
 */
const checkAccount = async (transactionList, accountList) => {
  const confirmTransactionList = [];
  for (const transaction of transactionList) {
    const { To, From } = transaction;
    // 是否需要入账
    if (accountList.has(From) || accountList.has(To) || !config.sync.checkAccount) {
      confirmTransactionList.push(transaction);
    }
  }
  return confirmTransactionList;
};

const record = async (uid, transactionList) => {
  for (const transaction of transactionList) {
    const { Version, To, From, Nonce, Value, GasLimit, GasFeeCap, GasPremium, Method, CID, dealCid, blockCid, blockHeight } = transaction;
    try {
      await dao.addTransaction({ Version, To, From, Nonce, Value, GasLimit, GasFeeCap, GasPremium, Method, CID, dealCid, blockCid, blockHeight });
      // rabbitMQ 消息推送
    } catch (error) {
      console.error(loggerError(uid, `入库失败 transaction=${JSON.stringify(transaction)}`));
      throw error;
    }
  }
};

/**
 * @param {number} latestHeight 最新高度
 * @param {number} step 同步步长
 */
const scanTipSet = async (latestHeight, step) => {
  const tipSetPromiseArray = [];
  for (let i = 1; i <= step; i++) {
    tipSetPromiseArray.push(lotus.getTipSetByHeight(bigAdd(latestHeight, i)));
  }

  let indexError = -1;
  const tipSetList = await Promise.all(tipSetPromiseArray);

  for (const [key, tipSet] of tipSetList.entries()) {
    if (tipSet instanceof Error) {
      indexError = key;
      break;
    }
  }

  if (indexError != -1) {
    return tipSetList.slice(0, indexError);
  } else {
    return tipSetList;
  }
};

/**
 * @description 根据 cid 获取区块信息
 * @param {string} uid
 * @param {string} crtBlock
 * @param {string} blockCid
 * @param {number} blockHeight
 * @returns {Promise<Array>}
 */
const scanBlock = async (uid, crtBlock, blockCid, blockHeight) => {
  const reason = await lotus.checkBad(crtBlock);
  const transactionList = [];
  if (!reason) {
    const blockMessages = await lotus.getBlockMessages(crtBlock);
    // 根据Cid 通过 getmessage 获取详细信息
    const { BlsMessages, SecpkMessages } = blockMessages;
    for (const transaction of BlsMessages) {
      const { Version, To, From, Nonce, Value, GasLimit, GasFeeCap, GasPremium, Method, CID } = transaction;
      const dealCid = CID['/'];
      if (config.sync.method.indexOf(Method) > -1) {
        transactionList.push({
          Version,
          To,
          From,
          Nonce,
          Value,
          GasLimit,
          GasFeeCap,
          GasPremium,
          Method,
          CID,
          dealCid,
          blockCid,
          blockHeight,
        });
      }
    }

    for (const transaction of SecpkMessages) {
      const { Message } = transaction;
      const { Version, To, From, Nonce, Value, GasLimit, GasFeeCap, GasPremium, Method, CID } = Message;
      const dealCid = CID['/'];
      if (config.sync.method.indexOf(Method) > -1) {
        transactionList.push({
          Version,
          To,
          From,
          Nonce,
          Value,
          GasLimit,
          GasFeeCap,
          GasPremium,
          Method,
          CID,
          dealCid,
          blockCid,
          blockHeight,
        });
      }
    }
  } else {
    console.error(loggerError(uid, `${crtBlock} is bad`));
  }

  return transactionList;
};

module.exports = {
  async start() {
    const uid = getRandom();
    try {
      // 获取钱包同步配置信息
      const walletRes = await dao.getWalletConfig();
      const { current_height: currentHeight, step, backward } = walletRes;

      console.timeLog('[autoTranctions start]', loggerInfo(uid, `钱包高度=${currentHeight} 同步步长=${step} 同步落后高度=${backward}`));
      // 获取用户账号信息
      const accountMap = new Map();
      const nodeState = await lotus.getSyncState();
      if (!Array.isArray(nodeState.ActiveSyncs)) {
        throw new Error('节点异常');
      }
      const { Height: latest_height } = nodeState.ActiveSyncs[0];

      // 更新最新区块高度
      await dao.updateWalletConfig({ latest_height });
      if (bigMinus(latest_height, bigAdd(currentHeight, backward)) >= 0) {
        let transactionList = [];
        const tipSets = await scanTipSet(currentHeight, step); // 扫描指定数量的TipSet
        const successTipSetSize = tipSets.length;
        console.timeLog('[autoTranctions start]', loggerInfo(uid, `成功获取 ${successTipSetSize} TipSet`));
        for (const tipSet of tipSets) {
          const { Cids: blockCids, Height: blockHeight } = tipSet;

          console.timeLog('[autoTranctions start]', loggerInfo(uid, `开始分析 ${blockCids.length} blockCids`));
          for (const crtBlock of blockCids) {
            const blockCid = crtBlock['/'];
            const transaction = await scanBlock(uid, crtBlock, blockCid, blockHeight); // 扫描区块信息
            console.timeLog('[autoTranctions start]', loggerInfo(uid, `获取 ${transaction.length} 交易`));
            transactionList = [...transactionList, ...transaction]; // 组装符合条件的交易
          }
        }

        if (successTipSetSize > 0) {
          console.timeLog('[autoTranctions start]', loggerInfo(uid, `开始过滤账号 ${transactionList.length} 交易`));
          const confirmTransactionList = await checkAccount(transactionList, accountMap); //扫描账号

          console.timeLog('[autoTranctions start]', loggerInfo(uid, `开始入账 ${confirmTransactionList.length} 交易`));
          await record(uid, confirmTransactionList);
          await dao.updateWalletConfig({
            current_height: bigAdd(currentHeight, successTipSetSize),
          });
        }
      } else {
        await sleep(bigMinus(bigAdd(currentHeight, step), latest_height) * config.sync.timer);
        console.timeLog('[autoTranctions start]', loggerInfo(uid, `同步高度不满足条件,进行休眠 latest_height=${latest_height} currentHeight=${currentHeight} step=${step}`));
      }
    } catch (error) {
      console.timeLog('[autoTranctions start]', loggerError(uid, error));
      throw error;
    }
  },
};
