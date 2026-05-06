const pool = require('../config/db');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a chat room
    socket.on('join_room', ({ roomId }) => {
      socket.join(`room_${roomId}`);
      console.log(`[Socket] ${socket.id} joined room_${roomId}`);
    });

    // Leave a chat room
    socket.on('leave_room', ({ roomId }) => {
      socket.leave(`room_${roomId}`);
      console.log(`[Socket] ${socket.id} left room_${roomId}`);
    });

    // Send a message
    socket.on('send_message', async ({ roomId, senderId, content, type = 'text', fileUrl }) => {
      try {
        // Save message to database
        const [result] = await pool.query(
          'INSERT INTO messages (room_id, sender_id, content, type, file_url) VALUES (?, ?, ?, ?, ?)',
          [roomId, senderId, content, type, fileUrl || null]
        );

        // Fetch the complete message with sender info
        const [messages] = await pool.query(
          `SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           WHERE m.id = ?`,
          [result.insertId]
        );

        const message = messages[0];

        // Broadcast to room
        io.to(`room_${roomId}`).emit('new_message', { message });
      } catch (error) {
        console.error('[Socket] send_message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Location update (for responder tracking)
    socket.on('location_update', ({ userId, reportId, latitude, longitude }) => {
      io.to(`room_tracking_${reportId}`).emit('responder_location', {
        responderId: userId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
    });

    // Join tracking room
    socket.on('join_tracking', ({ reportId }) => {
      socket.join(`room_tracking_${reportId}`);
    });

    // Typing indicator
    socket.on('typing', ({ roomId, userName }) => {
      socket.to(`room_${roomId}`).emit('user_typing', { userName });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(`room_${roomId}`).emit('user_stop_typing');
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};
