import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  displayName: { type: String, required: true, trim: true, maxlength: 30 },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, uppercase: true, trim: true, match: /^[A-Z0-9]{6}$/ },
  ownerSocketId: { type: String, required: true },
  members: { type: [memberSchema], default: [] },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, versionKey: false });

// MongoDB removes documents on a background sweep after this timestamp.
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Room = mongoose.model('Room', roomSchema);
