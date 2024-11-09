const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Update this if deploying to a different domain
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();

// Initialize Next.js
nextApp.prepare().then(() => {
  // Define your socket.io logic
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join-room', ({ roomId, username }) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { users: new Set(), code: '', messages: [] });
      }
      rooms.get(roomId).users.add(username);
      console.log(`${username} joined room ${roomId}`);

      // Send current code and chat history to the new user
      socket.emit('code-update', rooms.get(roomId).code);
      socket.emit('chat-history', rooms.get(roomId).messages);

      // Notify other users that a new user has joined
      socket.to(roomId).emit('user-joined', username);
    });

    socket.on('code-update', ({ roomId, code }) => {
      if (rooms.has(roomId)) {
        rooms.get(roomId).code = code;
        socket.to(roomId).emit('code-update', code);
      }
    });

    socket.on('chat-message', ({ roomId, username, message }) => {
      if (rooms.has(roomId)) {
        const newMessage = { username, message, timestamp: new Date() };
        rooms.get(roomId).messages.push(newMessage);
        io.to(roomId).emit('chat-message', newMessage);
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
      // Implement logic to remove user from room
      rooms.forEach((room, roomId) => {
        room.users.forEach((user) => {
          if (user === socket.id) {
            room.users.delete(user);
            socket.to(roomId).emit('user-left', user);
          }
        });
      });
    });
  });

  // Use Next.js request handler for all other routes
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server is running on port ${PORT}`);
  });
});
