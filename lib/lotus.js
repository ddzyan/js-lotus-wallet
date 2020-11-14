const { HttpJsonRpcConnector, JsonRpcProvider } = require('filecoin.js');

class Lotus {
  constructor(url, token) {
    const httpConnector = new HttpJsonRpcConnector({ url, token });
    this.jsonRpcProvider = new JsonRpcProvider(httpConnector);
  }

  /**
   * @description 获取节点状态
   */
  async getSyncState() {
    const state = await this.jsonRpcProvider.sync.state(); // 返回lotus同步系统的当前状态。
    return state;
  }

  /**
   * @param {number} blockHeight
   */
  async getTipSetByHeight(blockHeight) {
    try {
      const height = await this.jsonRpcProvider.chain.getTipSetByHeight(blockHeight);
      return height;
    } catch (error) {
      console.error(`${blockHeight} getTipSetByHeight`, error);
      return error;
    }
  }

  /**
   * @param {string} crtBlock
   */
  async checkBad(crtBlock) {
    const res = await this.jsonRpcProvider.sync.checkBad(crtBlock);
    return res;
  }

  /**
   *
   * @param {string} crtBlock
   */
  async getBlockMessages(crtBlock) {
    const blockMessages = await this.jsonRpcProvider.chain.getBlockMessages(crtBlock);
    return blockMessages;
  }

  async getMessage(dealCid) {
    const blockMessages = await this.jsonRpcProvider.chain.getMessage(dealCid);
    return blockMessages;
  }
}

module.exports = Lotus;
