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
        type: DataTypes.TINYINT(2),
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
        type: DataTypes.DECIMAL(36, 18).UNSIGNED,
        allowNull: false,
        comment: '金额 单位为file',
      },
      gas_limit: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        comment: '该笔交易能消耗的最大Gas量,单位为nano file',
      },
      gas_fee_cap: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        comment: '根据区块链网络拥堵状况实时更新的基础手续费率,单位为nano file',
      },
      gas_premium: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment: '用户选择支付给矿工的手续费率,单位为nano file',
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
