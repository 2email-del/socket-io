import User from '../models/User.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username')
      .sort({ username: 1 });

    res.json({ users });
  } catch (err) {
    next(err);
  }
};
