// src/config/socket.js
// Socket.IO setup - used for real-time order tracking / notifications
const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_ADMIN_URL || 'http://localhost:5173',
        process.env.CLIENT_WEBSITE_URL || 'http://localhost:5174',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Client (website user) joins a room specific to their order to receive live updates
    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`[Socket] ${socket.id} joined order_${orderId}`);
    });

    // Admin joins a global room to receive new-order / status notifications
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`[Socket] ${socket.id} joined admin_room`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
  return io;
};

module.exports = { initSocket, getIO };
