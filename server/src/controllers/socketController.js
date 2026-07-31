import { env } from '../config/env.js';
import { Message } from '../models/Message.js';
import { Room } from '../models/Room.js';
import { cleanDisplayName, cleanRoomId, generateAvailableRoomId, publicRoom } from '../utils/room.js';

const fail = (ack, message) => ack?.({ ok: false, error: message });
const success = (ack, data) => ack?.({ ok: true, ...data });
const expiresIn = hours => new Date(Date.now() + hours * 60 * 60 * 1000);
const safeMessage = message => ({
  id: message._id.toString(), roomId: message.roomId, senderSocketId: message.senderSocketId,
  senderName: message.senderName, kind: message.kind, text: message.text,
  mediaUrl: message.mediaUrl, createdAt: message.createdAt
});

function allowSocketEvent(socket, event, limit, windowMs) {
  const key = `rate:${event}`;
  const current = socket.data[key] ?? { count: 0, startedAt: Date.now() };
  if (Date.now() - current.startedAt >= windowMs) {
    socket.data[key] = { count: 1, startedAt: Date.now() };
    return true;
  }
  current.count += 1;
  socket.data[key] = current;
  return current.count <= limit;
}

function isAllowedMediaUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return true;
    return env.nodeEnv !== 'production' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch { return false; }
}

async function requireMembership(socket, roomId, ack) {
  const room = await Room.findOne({ roomId });
  if (!room) { fail(ack, 'Room not found or it has expired.'); return null; }
  const member = room.members.find(item => item.socketId === socket.id);
  if (!member) { fail(ack, 'You are not a member of this room.'); return null; }
  return { room, member };
}

export function registerSocketHandlers(io) {
  io.on('connection', socket => {
    socket.on('create-room', async ({ displayName } = {}, ack) => {
      try {
        if (!allowSocketEvent(socket, 'create-room', 5, 60_000)) return fail(ack, 'Too many room requests. Please wait a minute.');
        const name = cleanDisplayName(displayName);
        if (!name) return fail(ack, 'Display name must be 1 to 30 characters.');
        const roomId = await generateAvailableRoomId();
        const room = await Room.create({ roomId, ownerSocketId: socket.id, members: [{ socketId: socket.id, displayName: name }], expiresAt: expiresIn(env.roomTtlHours) });
        await socket.join(roomId);
        success(ack, { room: publicRoom(room), messages: [] });
      } catch (error) { console.error(error); fail(ack, 'Unable to create room.'); }
    });

    socket.on('join-room', async ({ roomId: rawRoomId, displayName } = {}, ack) => {
      try {
        if (!allowSocketEvent(socket, 'join-room', 10, 60_000)) return fail(ack, 'Too many join attempts. Please wait a minute.');
        const roomId = cleanRoomId(rawRoomId);
        const name = cleanDisplayName(displayName);
        if (!roomId || !name) return fail(ack, 'Enter a valid room ID and display name.');
        const room = await Room.findOne({ roomId });
        if (!room) return fail(ack, 'Room not found or it has expired.');
        if (room.members.some(member => member.socketId === socket.id)) return fail(ack, 'Already joined this room.');
        if (room.members.length >= env.maxRoomMembers) return fail(ack, 'This room is full.');
        room.members.push({ socketId: socket.id, displayName: name });
        room.expiresAt = expiresIn(env.roomTtlHours);
        await room.save();
        await socket.join(roomId);
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(100).lean();
        io.to(roomId).emit('room-updated', publicRoom(room));
        success(ack, { room: publicRoom(room), messages: messages.map(safeMessage) });
      } catch (error) { console.error(error); fail(ack, 'Unable to join room.'); }
    });

    socket.on('send-message', async ({ roomId: rawRoomId, text } = {}, ack) => {
      try {
        if (!allowSocketEvent(socket, 'send-message', 20, 10_000)) return fail(ack, 'You are sending messages too quickly.');
        const roomId = cleanRoomId(rawRoomId);
        const body = typeof text === 'string' ? text.trim() : '';
        if (!roomId || !body || body.length > 2000) return fail(ack, 'Message must be 1 to 2000 characters.');
        const access = await requireMembership(socket, roomId, ack); if (!access) return;
        const message = await Message.create({ roomId, senderSocketId: socket.id, senderName: access.member.displayName, kind: 'text', text: body, expiresAt: expiresIn(env.messageTtlHours) });
        const payload = safeMessage(message); io.to(roomId).emit('message-received', payload); success(ack, { message: payload });
      } catch (error) { console.error(error); fail(ack, 'Unable to send message.'); }
    });

    socket.on('send-media', async ({ roomId: rawRoomId, mediaUrl, mediaType } = {}, ack) => {
      try {
        if (!allowSocketEvent(socket, 'send-media', 5, 60_000)) return fail(ack, 'You are uploading media too quickly.');
        const roomId = cleanRoomId(rawRoomId);
        if (!roomId || !['image', 'audio'].includes(mediaType) || typeof mediaUrl !== 'string' || !isAllowedMediaUrl(mediaUrl) || mediaUrl.length > 2048) return fail(ack, 'Provide a valid media URL and type.');
        const access = await requireMembership(socket, roomId, ack); if (!access) return;
        const message = await Message.create({ roomId, senderSocketId: socket.id, senderName: access.member.displayName, kind: mediaType, mediaUrl, expiresAt: expiresIn(env.messageTtlHours) });
        const payload = safeMessage(message); io.to(roomId).emit('message-received', payload); success(ack, { message: payload });
      } catch (error) { console.error(error); fail(ack, 'Unable to send media.'); }
    });

    socket.on('kick-user', async ({ roomId: rawRoomId, targetSocketId } = {}, ack) => {
      try {
        if (!allowSocketEvent(socket, 'kick-user', 10, 60_000)) return fail(ack, 'Too many moderation requests.');
        const roomId = cleanRoomId(rawRoomId);
        const access = roomId && await requireMembership(socket, roomId, ack); if (!access) return;
        if (access.room.ownerSocketId !== socket.id) return fail(ack, 'Only the room owner can remove members.');
        if (targetSocketId === socket.id) return fail(ack, 'The owner cannot kick themselves.');
        const target = access.room.members.find(member => member.socketId === targetSocketId);
        if (!target) return fail(ack, 'User is no longer in this room.');
        access.room.members = access.room.members.filter(member => member.socketId !== targetSocketId);
        await access.room.save();
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        targetSocket?.leave(roomId); targetSocket?.emit('removed-from-room', { roomId, reason: 'You were removed by the room owner.' });
        io.to(roomId).emit('room-updated', publicRoom(access.room)); success(ack, {});
      } catch (error) { console.error(error); fail(ack, 'Unable to remove user.'); }
    });

    socket.on('terminate-room', async ({ roomId: rawRoomId } = {}, ack) => {
      try {
        if (!allowSocketEvent(socket, 'terminate-room', 3, 60_000)) return fail(ack, 'Too many termination requests.');
        const roomId = cleanRoomId(rawRoomId);
        const access = roomId && await requireMembership(socket, roomId, ack); if (!access) return;
        if (access.room.ownerSocketId !== socket.id) return fail(ack, 'Only the room owner can terminate the room.');
        await Promise.all([Room.deleteOne({ roomId }), Message.deleteMany({ roomId })]);
        io.to(roomId).emit('room-terminated', { roomId });
        for (const member of access.room.members) io.sockets.sockets.get(member.socketId)?.leave(roomId);
        success(ack, {});
      } catch (error) { console.error(error); fail(ack, 'Unable to terminate room.'); }
    });

    socket.on('leave-room', async ({ roomId: rawRoomId } = {}, ack) => {
      try {
        const roomId = cleanRoomId(rawRoomId);
        const access = roomId && await requireMembership(socket, roomId, ack); if (!access) return;
        // An anonymous owner cannot safely be restored after leaving, so their departure terminates the room.
        if (access.room.ownerSocketId === socket.id) {
          await Promise.all([Room.deleteOne({ _id: access.room._id }), Message.deleteMany({ roomId })]);
          io.to(roomId).emit('room-terminated', { roomId, reason: 'The room owner left.' });
          for (const member of access.room.members) io.sockets.sockets.get(member.socketId)?.leave(roomId);
        } else {
          access.room.members = access.room.members.filter(member => member.socketId !== socket.id);
          await access.room.save(); await socket.leave(roomId);
          io.to(roomId).emit('room-updated', publicRoom(access.room));
        }
        success(ack, {});
      } catch (error) { console.error(error); fail(ack, 'Unable to leave room.'); }
    });

    socket.on('disconnect', async () => {
      try {
        const rooms = await Room.find({ 'members.socketId': socket.id });
        for (const room of rooms) {
          // Owner departure terminates the anonymous room; no ownership transfer can expose stale control.
          if (room.ownerSocketId === socket.id) {
            await Promise.all([Room.deleteOne({ _id: room._id }), Message.deleteMany({ roomId: room.roomId })]);
            io.to(room.roomId).emit('room-terminated', { roomId: room.roomId, reason: 'The room owner left.' });
          } else {
            room.members = room.members.filter(member => member.socketId !== socket.id);
            await room.save(); io.to(room.roomId).emit('room-updated', publicRoom(room));
          }
        }
      } catch (error) { console.error('Disconnect cleanup failed:', error); }
    });
  });
}
