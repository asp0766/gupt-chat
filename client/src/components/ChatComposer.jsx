import React, { useRef, useState } from 'react';
import { ImagePlus, Mic, Send, Square } from 'lucide-react';

export default function ChatComposer({ onText, onMedia }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const recorder = useRef(null);
  const chunks = useRef([]);
  const fileInput = useRef(null);

  async function sendText(event) {
    event.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setError('');
    try { await onText(body); setText(''); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function chooseImage(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try { await onMedia(file, 'image'); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function toggleRecording() {
    if (recording) { recorder.current?.stop(); return; }
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.ondataavailable = event => event.data.size && chunks.current.push(event.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop()); setRecording(false); setBusy(true);
        try {
          const type = mediaRecorder.mimeType || 'audio/webm';
          const file = new File([new Blob(chunks.current, { type })], 'voice-note.webm', { type });
          await onMedia(file, 'audio');
        } catch (err) { setError(err.message); } finally { setBusy(false); }
      };
      recorder.current = mediaRecorder; mediaRecorder.start(); setRecording(true);
    } catch (err) { setError(err.name === 'NotAllowedError' ? 'Microphone permission was denied.' : err.message); }
  }
  return <div className="composer-wrap"><form className="composer" onSubmit={sendText}><input aria-label="Message" value={text} onChange={event => setText(event.target.value)} maxLength="2000" placeholder="Write a message" disabled={busy} /><input ref={fileInput} type="file" accept="image/*" hidden onChange={chooseImage} /><button type="button" title="Attach image" aria-label="Attach image" disabled={busy} onClick={() => fileInput.current?.click()}><ImagePlus size={20} /></button><button type="button" title={recording ? 'Stop recording' : 'Record voice note'} aria-label={recording ? 'Stop recording' : 'Record voice note'} className={recording ? 'recording' : ''} disabled={busy} onClick={toggleRecording}>{recording ? <Square size={18} /> : <Mic size={20} />}</button><button type="submit" aria-label="Send message" disabled={busy || !text.trim()}><Send size={20} /></button></form>{error && <p className="composer-error" role="alert">{error}</p>}</div>;
}
