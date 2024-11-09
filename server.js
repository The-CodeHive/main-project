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
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', // Use Railway domain in production
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
      rooms.get(roomId).users.add(socket.id);  // Store socket ID to uniquely identify the user
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
      rooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          socket.to(roomId).emit('user-left', socket.id); // Notify users in the room
        }
      });
    });
  });

  // Use Next.js request handler for all other routes
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Listen on PORT for production or 3001 for development
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server is running on port ${PORT}`);
  });
});
