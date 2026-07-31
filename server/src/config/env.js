import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const number = (name, fallback) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number`);
  return value;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: number('PORT', 5000),
  mongoUri: required('MONGODB_URI'),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  roomTtlHours: number('ROOM_TTL_HOURS', 24),
  messageTtlHours: number('MESSAGE_TTL_HOURS', 24),
  maxRoomMembers: number('MAX_ROOM_MEMBERS', 50)
});
