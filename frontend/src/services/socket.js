import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

// Rooms this client has joined - re-joined automatically after a reconnect,
// because the server forgets room membership when the connection drops.
const joinedOrderRooms = new Set();
let joinedAdminRoom = false;

socket.on('connect', () => {
  console.log(`[Socket] Connected: ${socket.id}`);
  if (joinedAdminRoom) socket.emit('join_admin_room');
  joinedOrderRooms.forEach((orderId) => socket.emit('join_order_room', orderId));
});

socket.on('connect_error', (err) => {
  console.error('[Socket] Connection error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.warn('[Socket] Disconnected:', reason);
});

// Website: join a specific order room for live tracking
export const joinOrderRoom = (orderId) => {
  joinedOrderRooms.add(orderId);
  if (socket.connected) socket.emit('join_order_room', orderId);
  else socket.connect(); // 'connect' handler joins the room
};

// Admin: join admin room for live new-order & status notifications
export const connectAdminSocket = () => {
  joinedAdminRoom = true;
  if (socket.connected) socket.emit('join_admin_room');
  else socket.connect(); // 'connect' handler joins the room
};
