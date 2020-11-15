module.exports = {
  apps: [
    {
      name: 'lotus-wallet', // 进程名称
      script: './service/autoTrancation.js', // 启动脚本
      watch: false, // 默认关闭watch 可替换为 ['src']
      log_date_format: 'YYYY-MM-DD HH:mm Z', // 日志格式
      ignore_watch: ['node_modules', 'public', 'logs'],
      out_file: './logs/pm2-info.log', // 日志输出地址
      error_file: './logs/pm2-error.log', // 错误日志地址
      max_memory_restart: '1G', // 超过多大内存自动重启，仅防止内存泄露有意义，需要根据自己的业务设置
      env: {
        NODE_ENV: 'production', // 环境变量,在服务中通过 process.env.NODE_ENV 获取
      },
      exec_mode: 'fork', // 开启多线程模式，用于负载均衡
      instances: '1', // 启用多少个实例，可用于负载均衡
      autorestart: true, // 程序崩溃后自动重启
    },
  ],
};
