module.exports = (sequelize, DataTypes) => {
  const sync = sequelize.define(
    'sync',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键',
      },
      latest_height: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '区块最新高度',
      },
      current_height: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '区块同步高度',
      },
      step: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        comment: '同步步长',
      },
      backward: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        comment: '区块落后高度',
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
      tableName: 'sync',
      comment: '区块同步高度表',
    }
  );

  // 创建表间关系
  sync.associate = () => {};

  return sync;
};
