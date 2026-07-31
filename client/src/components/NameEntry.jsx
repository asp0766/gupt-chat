import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function NameEntry({ onContinue }) {
  function submit(event) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('displayName').trim();
    if (name) onContinue(name);
  }
  return <main className="centered"><section className="card welcome-card"><MessageCircle size={42} /><h1>Gupt Chat</h1><p>Private conversations. No account. No history that lasts.</p><form onSubmit={submit}><label htmlFor="displayName">Choose a temporary display name</label><input id="displayName" name="displayName" maxLength="30" autoFocus required placeholder="For this room only" /><button type="submit">Continue anonymously</button></form></section></main>;
}
