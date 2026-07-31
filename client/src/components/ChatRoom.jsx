import React, { useState } from 'react';
import { Copy, Crown, LogOut, Trash2, UserRoundX } from 'lucide-react';
import ChatComposer from './ChatComposer.jsx';
import MessageList from './MessageList.jsx';
import { initials } from '../utils.js';

export default function ChatRoom({ room, messages, socketId, onText, onMedia, onKick, onTerminate, onLeave }) {
  const [copied, setCopied] = useState(false); const members = Array.isArray(room.members) ? room.members : []; const isOwner = room.ownerSocketId === socketId;
  function copyRoomId() { navigator.clipboard.writeText(room.roomId); setCopied(true); setTimeout(() => setCopied(false), 1200); }
  async function terminate() { if (window.confirm('Terminate this room? All messages will be deleted immediately.')) await onTerminate(); }
  return <main className="chat-layout"><aside className="sidebar"><div><div className="brand">Gupt Chat</div><button className="room-code" onClick={copyRoomId}>Room: {room.roomId} <Copy size={15} /> {copied && 'Copied'}</button></div><div className="members"><h2>People ({members.length})</h2>{members.map(member => <div className="member" key={member.socketId}><span className="avatar">{initials(member.displayName)}</span><span>{member.displayName}{member.socketId === room.ownerSocketId && <Crown size={14} className="crown" />}</span>{isOwner && member.socketId !== socketId && <button title={`Remove ${member.displayName}`} aria-label={`Remove ${member.displayName}`} onClick={() => onKick(member.socketId)}><UserRoundX size={16} /></button>}</div>)}</div><div className="sidebar-actions">{isOwner && <button className="danger" onClick={terminate}><Trash2 size={17} /> Terminate room</button>}<button onClick={onLeave}><LogOut size={17} /> Leave</button></div></aside><section className="chat-panel"><header><div><h1>Anonymous room</h1><p>Messages automatically disappear.</p></div></header><MessageList messages={messages} mySocketId={socketId} /><ChatComposer onText={onText} onMedia={onMedia} /></section></main>;
}
