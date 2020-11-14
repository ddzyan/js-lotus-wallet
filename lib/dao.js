const db = require('../orm/model');
const { unitConversion } = require('./utils');
module.exports = {
  async getWalletConfig() {
    const syncRes = await db.sync.findOne({
      where: {
        id: 1,
      },
      raw: true,
      attributes: ['latest_height', 'current_height', 'step', 'backward'],
    });

    return syncRes;
  },

  /**
   * @description 更新同步信息
   * @param {Object} param
   */
  async updateWalletConfig(param) {
    const syncRes = await db.sync.update(param, {
      where: {
        id: 1,
      },
    });

    return syncRes;
  },

  /**
   *
   * @param {Object} parma
   */
  async addTransaction(parma) {
    let { dealCid, blockCid, blockHeight, Version, To, From, Nonce, GasLimit, GasFeeCap, GasPremium, Method, Value } = parma;
    Value = unitConversion(Value);
    const transactionRes = await db.transaction.findCreateFind({
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
        value: Value,
        gas_limit: GasLimit,
        gas_fee_cap: GasFeeCap,
        gas_premium: GasPremium,
        method: Method,
        block_cid: blockCid,
        height: blockHeight,
        deal_cid: dealCid,
      },
    });

    return transactionRes;
  },
};
