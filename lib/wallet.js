class FileCoinWallet {
  constructor(url, token) {
    this.httpConnector = new HttpJsonRpcConnector({ url, token });
    this.walletLotusHttp = new HttpJsonRpcWalletProvider(this.httpConnector);
  }

  connectWalletBySeed() {}

  connectWalletByMnemonic(mnemonic, password, derivationPath) {
    this.walletProvider = new MnemonicWalletProvider(this.httpConnector, mnemonic, password, derivationPath); // 创建钱包对象
  }

  async getAddress() {
    const myAddress = await this.walletProvider.getDefaultAccount(); // 获得钱包默认地址
    return myAddress;
  }

  async transaction() {
    // 获取钱包地址
    const myAddress = await this.getAddress();

    // 序列化交易结构
    const message = await this.walletProvider.createMessage({
      From: myAddress,
      To: '',
      GasLimit: 0,
      GasFeeCap: new BigNumber(0),
      GasPremium: new BigNumber(0),
      Value: new BigNumber(12), // 交易金额
      Method: 0,
      Params: '',
      Version: 0,
      Nonce: 0,
    });

    const signMessage = await this.walletProvider.signMessage(message); // 签名交易

    const msgCid = await this.walletProvider.sendSignedMessage(signMessage); // 发送交易
    return msgCid;
  }
}

module.exports = FileCoinWallet;
