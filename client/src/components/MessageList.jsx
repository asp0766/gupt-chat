import React, { useEffect, useRef } from 'react';
import { formatTime } from '../utils.js';

export default function MessageList({ messages, mySocketId }) {
  const bottom = useRef(null);
  useEffect(() => { if (typeof bottom.current?.scrollIntoView === 'function') bottom.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  return <section className="messages" aria-live="polite">{(Array.isArray(messages) ? messages : []).map(message => <article className={`message ${message.senderSocketId === mySocketId ? 'mine' : ''}`} key={message.id}><div className="message-meta"><strong>{message.senderName}</strong><time>{formatTime(message.createdAt)}</time></div>{message.kind === 'text' ? <p>{message.text}</p> : message.kind === 'image' ? <img src={message.mediaUrl} alt={`Shared by ${message.senderName}`} loading="lazy" /> : <audio controls src={message.mediaUrl}>Your browser cannot play this voice note.</audio>}</article>)}<div ref={bottom} /></section>;
}
