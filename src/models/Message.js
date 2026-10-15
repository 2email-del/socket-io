import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
      maxlength: [2000, 'Message is too long (max 2000 characters)'],
    },
  },
  { timestamps: true }
);

// history query filters on both users and sorts by time
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
