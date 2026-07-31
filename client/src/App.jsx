import React, { useEffect, useState } from 'react';
import ChatRoom from './components/ChatRoom.jsx';
import NameEntry from './components/NameEntry.jsx';
import RoomLobby from './components/RoomLobby.jsx';
import { useSocket } from './hooks/useSocket.js';
import { uploadMedia } from './utils.js';

export default function App() {
  const { socket, connected, emit } = useSocket();
  const [displayName, setDisplayName] = useState(() => sessionStorage.getItem('gupt-display-name') || '');
  const [room, setRoom] = useState(null); const [messages, setMessages] = useState([]); const [notice, setNotice] = useState('');
  useEffect(() => {
    const updated = next => setRoom(current => current?.roomId === next.roomId ? next : current);
    const received = message => setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
    const ended = ({ roomId, reason }) => setRoom(current => { if (current?.roomId !== roomId) return current; setMessages([]); setNotice(reason || 'This room was terminated.'); return null; });
    const removed = ({ roomId, reason }) => setRoom(current => { if (current?.roomId !== roomId) return current; setMessages([]); setNotice(reason); return null; });
    socket.on('room-updated', updated); socket.on('message-received', received); socket.on('room-terminated', ended); socket.on('removed-from-room', removed);
    return () => { socket.off('room-updated', updated); socket.off('message-received', received); socket.off('room-terminated', ended); socket.off('removed-from-room', removed); };
  }, [socket]);
  function enter(response) { setRoom(response.room); setMessages(response.messages); setNotice(''); }
  async function createRoom() { enter(await emit('create-room', { displayName })); }
  async function joinRoom(roomId) { enter(await emit('join-room', { roomId, displayName })); }
  async function sendText(text) { await emit('send-message', { roomId: room.roomId, text }); }
  async function sendMedia(file, mediaType) { const mediaUrl = await uploadMedia(file); await emit('send-media', { roomId: room.roomId, mediaUrl, mediaType }); }
  async function kick(targetSocketId) { try { await emit('kick-user', { roomId: room.roomId, targetSocketId }); } catch (error) { setNotice(error.message); } }
  async function terminate() { await emit('terminate-room', { roomId: room.roomId }); }
  if (!displayName) return <NameEntry onContinue={name => { sessionStorage.setItem('gupt-display-name', name); setDisplayName(name); }} />;
  if (!room) return <><RoomLobby displayName={displayName} connected={connected} onCreate={createRoom} onJoin={joinRoom} />{notice && <div className="toast" role="status">{notice}</div>}</>;
  async function leaveRoom() { try { await emit('leave-room', { roomId: room.roomId }); setRoom(null); setMessages([]); } catch (error) { setNotice(error.message); } }
  return <><ChatRoom room={room} messages={messages} socketId={socket.id} onText={sendText} onMedia={sendMedia} onKick={kick} onTerminate={terminate} onLeave={leaveRoom} />{notice && <div className="toast" role="status">{notice}</div>}</>;
}
