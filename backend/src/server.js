// src/server.js - entry point: HTTP server + Socket.IO + DB check
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const { testConnection } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

(async () => {
  await testConnection();
  server.listen(PORT, () => {
    console.log(`[Server] Ecommerce backend running on http://localhost:${PORT}`);
    console.log(`[Server] Socket.IO ready for real-time order tracking`);
  });
})();
