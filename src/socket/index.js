import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';

const MAX_LENGTH = 2000;

// userId -> number of open sockets (one user can have several tabs)
const connections = new Map();

const sendOnlineList = (io) => {
  io.emit('online-users', [...connections.keys()]);
};

export const initSocket = (io) => {
  // check the jwt before letting anyone connect
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('username');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // personal room, so we can reach every tab of a user at once
    socket.join(userId);
    connections.set(userId, (connections.get(userId) || 0) + 1);
    sendOnlineList(io);

    socket.on('send-message', async (data, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};

      try {
        const to = data?.to;
        const text = typeof data?.text === 'string' ? data.text.trim() : '';

        if (!mongoose.isObjectIdOrHexString(to)) {
          return reply({ error: 'Invalid recipient' });
        }
        if (String(to) === userId) {
          return reply({ error: 'You cannot message yourself' });
        }
        if (!text) {
          return reply({ error: 'Message cannot be empty' });
        }
        if (text.length > MAX_LENGTH) {
          return reply({ error: `Message is too long (max ${MAX_LENGTH} characters)` });
        }

        const receiverExists = await User.exists({ _id: to });
        if (!receiverExists) {
          return reply({ error: 'Recipient not found' });
        }

        const saved = await Message.create({ sender: userId, receiver: to, text });

        const message = {
          _id: saved._id.toString(),
          sender: userId,
          receiver: String(to),
          text: saved.text,
          createdAt: saved.createdAt,
        };

        io.to(String(to)).emit('new-message', message);
        // sender's other tabs should get it too
        socket.to(userId).emit('new-message', message);

        reply({ message });
      } catch (err) {
        console.error('send-message failed:', err.message);
        reply({ error: 'Could not send message, please try again' });
      }
    });

    socket.on('typing', (data) => {
      const to = data?.to;
      if (typeof to === 'string') io.to(to).emit('typing', { from: userId });
    });

    socket.on('stop-typing', (data) => {
      const to = data?.to;
      if (typeof to === 'string') io.to(to).emit('stop-typing', { from: userId });
    });

    socket.on('disconnect', () => {
      const left = (connections.get(userId) || 1) - 1;
      if (left <= 0) connections.delete(userId);
      else connections.set(userId, left);

      sendOnlineList(io);
    });
  });
};
