module.exports = (sequelize, DataTypes) => {
  const transaction = sequelize.define(
    'transaction',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键',
      },
      version: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '',
      },
      to: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '接收地址',
      },
      from: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '发送地址',
      },
      method: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '交易类型',
      },
      params: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '参数',
      },
      nonce: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'Nonce',
      },
      value: {
        type: DataTypes.FLOAT(40, 18),
        allowNull: false,
        comment: '金额，已经除以10^18',
      },
      gas_limit: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: '该笔交易能消耗的最大Gas量',
      },
      gas_fee_cap: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '根据区块链网络拥堵状况实时更新的基础手续费率',
      },
      gas_premium: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '用户选择支付给矿工的手续费率',
      },
      block_cid: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '区块 cid',
      },
      deal_cid: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '消息 cid',
      },
      height: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '区块高度',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        comment: '创建时间',
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        comment: '更新时间',
      },
    },
    {
      tableName: 'transaction',
      comment: '交易表',
    }
  );

  // 创建表间关系
  transaction.associate = () => {};

  return transaction;
};
