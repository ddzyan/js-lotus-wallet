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

const dao = require('../orm/dao');
const { unitConversion } = require('../util');
const { bigAdd, bigMinus, sleep } = require('../util');
const lotus = new Lotus(config.lotus.url, config.lotus.token);

const userMap = new Map();

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
 */
const checkAccount = async transactionList => {
  const confirmTransactionList = [];
  for (const transaction of transactionList) {
    const { To, From } = transaction;
    // 是否需要校验账号
    if (config.sync.checkAccount) {
      // 如果是之前已经入过账的账号，则直接通过
      if (userMap.has(To) || userMap.has(From)) {
        confirmTransactionList.push(transaction);
      } else {
        const toRes = await dao.findAccount(To);
        if (toRes) {
          // TODO 需要加入用户信息
          userMap.set(To, toRes);
          confirmTransactionList.push(transaction);
        }

        const fromRes = await dao.findAccount(From);
        if (fromRes) {
          // TODO 需要加入用户信息
          userMap.set(To, toRes);
          confirmTransactionList.push(transaction);
        }
      }
    } else {
      confirmTransactionList.push(transaction);
    }
  }
  return confirmTransactionList;
};

/**
 * 入库
 * @param {string} uid
 * @param {Array} transactionList
 */
const record = async (uid, transactionList) => {
  for (const transaction of transactionList) {
    // TODO 根据用户信息进行特殊处理
    let { Version, To, From, Nonce, Value, GasLimit, GasFeeCap, GasPremium, Method, CID, dealCid, blockCid, blockHeight } = transaction;
    try {
      // 单位转换
      Value = unitConversion(Value);
      GasFeeCap = Number.parseInt(GasFeeCap);
      GasPremium = Number.parseInt(GasPremium);
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
  async start(uid) {
    try {
      // 获取钱包同步配置信息
      const walletRes = await dao.getWalletConfig();
      const { current_height: currentHeight, step, backward } = walletRes;

      const nodeState = await lotus.getSyncState();
      if (!Array.isArray(nodeState.ActiveSyncs)) {
        throw new Error('节点异常');
      }
      const { Height: latest_height } = nodeState.ActiveSyncs[0];
      console.timeLog(
        '[autoTranctions start]',
        loggerInfo(uid, `节点最新高度=${latest_height} 钱包高度=${currentHeight} 同步步长=${step} 同步落后高度=${backward}`)
      );

      // 更新最新区块高度
      await dao.updateWalletConfig({ latest_height });
      if (bigMinus(latest_height, bigAdd(currentHeight, backward)) >= 0) {
        let transactionList = [];
        const tipSets = await scanTipSet(currentHeight, step); // 扫描指定数量的TipSet
        const successTipSetSize = tipSets.length;
        console.timeLog('[autoTranctions start]', loggerInfo(uid, `${currentHeight}~${currentHeight + step} 成功获取 ${successTipSetSize} TipSet`));
        for (const tipSet of tipSets) {
          const { Cids: blockCids, Height: blockHeight } = tipSet;

          console.timeLog('[autoTranctions start]', loggerInfo(uid, `开始分析 blockCids=${JSON.stringify(blockCids)}`));
          for (const crtBlock of blockCids) {
            const blockCid = crtBlock['/'];
            const transaction = await scanBlock(uid, crtBlock, blockCid, blockHeight); // 扫描区块信息
            console.timeLog('[autoTranctions start]', loggerInfo(uid, `区块 ${blockCid} 获取 ${transaction.length} 交易`));
            transactionList = [...transactionList, ...transaction]; // 组装符合条件的交易
          }
        }

        if (successTipSetSize > 0) {
          console.timeLog('[autoTranctions start]', loggerInfo(uid, `开始过滤 ${transactionList.length} 交易 ${JSON.stringify(transactionList)}`));
          const confirmTransactionList = await checkAccount(transactionList); //扫描账号

          console.timeLog(
            '[autoTranctions start]',
            loggerInfo(uid, `开始入账 ${confirmTransactionList.length} 交易 ${JSON.stringify(confirmTransactionList)}`)
          );
          await record(uid, confirmTransactionList);
          await dao.updateWalletConfig({
            current_height: bigAdd(currentHeight, successTipSetSize),
          });
        }
      } else {
        await sleep(bigMinus(bigAdd(currentHeight, step), latest_height) * config.sync.timer);
        console.timeLog(
          '[autoTranctions start]',
          loggerInfo(uid, `同步高度不满足条件,进行休眠 latest_height=${latest_height} currentHeight=${currentHeight} step=${step}`)
        );
      }
    } catch (error) {
      console.timeLog('[autoTranctions start]', loggerError(uid, error));
      throw error;
    }
  },
};
