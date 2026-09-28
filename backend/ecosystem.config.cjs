// PM2 config - runs the API + built frontend (backend/public) on one port.
//   npm run build:frontend                        build the React app into backend/public
//   pm2 start ecosystem.config.cjs --env production
//   pm2 logs ecommerce | pm2 restart ecommerce | pm2 stop ecommerce
// Everything else (DB, JWT, SMTP, Razorpay...) is read from backend/.env

module.exports = {
  apps: [
    {
      name: 'ecommerce',
      script: 'src/server.js',
      cwd: __dirname,
      // Single process: Socket.IO rooms, the captcha store and rate limits live in memory per process
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      time: true, // timestamps in pm2 logs
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      env: {
        NODE_ENV: 'development',
        PORT: 5002,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5002,
      },
    },
  ],
};
