import React, { useState } from 'react';
import { DoorOpen, Plus, Radio } from 'lucide-react';

export default function RoomLobby({ displayName, connected, onCreate, onJoin }) {
  const [roomId, setRoomId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function action(work) { setBusy(true); setError(''); try { await work(); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <main className="centered"><section className="card lobby-card"><div className="status"><Radio size={16} /> {connected ? 'Connected' : 'Connecting…'}</div><h1>Hello, {displayName}</h1><p>Create a private room or enter a six-character room code.</p><button disabled={!connected || busy} onClick={() => action(onCreate)}><Plus size={18} /> Create room</button><div className="divider">or</div><form onSubmit={event => { event.preventDefault(); action(() => onJoin(roomId)); }}><label htmlFor="roomId">Room ID</label><input id="roomId" value={roomId} onChange={event => setRoomId(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} maxLength="6" placeholder="ABC123" required /><button disabled={!connected || busy} type="submit"><DoorOpen size={18} /> Join room</button></form>{error && <p className="error" role="alert">{error}</p>}</section></main>;
}
