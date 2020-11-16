const db = require('./model');

module.exports = {
  /**
   * @description 获取钱包同步配置
   */
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

    return syncRes[0];
  },

  /**
   *@description 添加交易
   * @param {Object} parma
   */
  async addTransaction(parma) {
    const { dealCid, blockCid, blockHeight, Version, To, From, Nonce, GasLimit, GasFeeCap, GasPremium, Method, Value } = parma;
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

  /**
   * @description 查询指定地址信息
   * @param {string} walletAddress
   */
  async findAccount(walletAddress) {
    const res = db.user.findOne({
      wallet: walletAddress,
      attributes: [''], // 返回的具体信息
      raw: true,
    });

    return res;
  },
};
