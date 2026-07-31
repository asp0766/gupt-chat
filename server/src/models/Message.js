import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderSocketId: { type: String, required: true },
  senderName: { type: String, required: true, trim: true, maxlength: 30 },
  kind: { type: String, required: true, enum: ['text', 'image', 'audio'] },
  text: { type: String, trim: true, maxlength: 2000 },
  mediaUrl: { type: String, maxlength: 2048 },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, versionKey: false });

messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Message = mongoose.model('Message', messageSchema);
