import cors from 'cors';
import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import { env } from './config/env.js';

export const app = express();
const uploadsDirectory = path.resolve('uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });
const extensionFor = mime => ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'audio/webm': '.webm', 'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/ogg': '.ogg', 'audio/wav': '.wav' }[mime] ?? '');
const mediaUpload = multer({
  storage: multer.diskStorage({ destination: uploadsDirectory, filename: (_req, file, done) => done(null, `${crypto.randomUUID()}${extensionFor(file.mimetype)}`) }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => done(null, file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/'))
});
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, methods: ['GET', 'POST'], credentials: true }));
app.use(express.json({ limit: '64kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/uploads', express.static(uploadsDirectory, { maxAge: '1h', index: false }));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, service: 'gupt-chat-server' }));
app.post('/api/media', mediaUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'Upload an image or audio file smaller than 10 MB.' });
  res.status(201).json({ ok: true, mediaUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` });
});
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ ok: false, error: error.code === 'LIMIT_FILE_SIZE' ? 'Media files must be 10 MB or smaller.' : 'Invalid media upload.' });
  console.error(error);
  return res.status(500).json({ ok: false, error: 'Unable to upload media.' });
});
