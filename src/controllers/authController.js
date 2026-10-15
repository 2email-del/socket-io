import User from '../models/User.js';
import { signToken } from '../utils/token.js';

const sendAuth = (res, user, status = 200) => {
  res.status(status).json({
    token: signToken(user._id),
    user: { _id: user._id, username: user.username, email: user.email },
  });
};

export const register = async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const message =
        existing.email === email
          ? 'That email is already registered'
          : 'That username is already taken';
      return res.status(409).json({ message });
    }

    const user = await User.create({ username, email, password });
    sendAuth(res, user, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Wrong email or password' });
    }

    sendAuth(res, user);
  } catch (err) {
    next(err);
  }
};

export const getMe = (req, res) => {
  const { _id, username, email } = req.user;
  res.json({ user: { _id, username, email } });
};
