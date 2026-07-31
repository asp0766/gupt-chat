import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <main className="centered"><section className="card"><h1>Something went wrong</h1><p>The chat screen could not load. Refresh the page and try again.</p><p className="error">{this.state.error.message}</p><button onClick={() => window.location.reload()}>Refresh Gupt Chat</button></section></main>;
    }
    return this.props.children;
  }
}
