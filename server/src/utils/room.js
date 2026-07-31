import crypto from 'node:crypto';
import { Room } from '../models/Room.js';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function cleanDisplayName(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  return name.length >= 1 && name.length <= 30 ? name : null;
}

export function cleanRoomId(value) {
  if (typeof value !== 'string') return null;
  const roomId = value.trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(roomId) ? roomId : null;
}

export async function generateAvailableRoomId() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const roomId = Array.from(crypto.randomBytes(6), byte => alphabet[byte % alphabet.length]).join('');
    if (!await Room.exists({ roomId })) return roomId;
  }
  throw new Error('Could not allocate a room ID. Please retry.');
}

export const publicRoom = room => ({
  roomId: room.roomId,
  ownerSocketId: room.ownerSocketId,
  members: room.members.map(({ socketId, displayName, joinedAt }) => ({ socketId, displayName, joinedAt })),
  expiresAt: room.expiresAt
});
