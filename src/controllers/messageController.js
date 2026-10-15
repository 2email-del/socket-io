import mongoose from 'mongoose';
import Message from '../models/Message.js';

const HISTORY_LIMIT = 100;

export const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isObjectIdOrHexString(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const me = req.user._id;

    // newest 100, then flip so the chat reads top to bottom
    const messages = await Message.find({
      $or: [
        { sender: me, receiver: userId },
        { sender: userId, receiver: me },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT);

    res.json({ messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
};
