import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:40, fontFamily:'monospace', background:'#fff0f0', border:'2px solid red', margin:20, borderRadius:8 }}>
          <h2 style={{ color:'red' }}>App crashed — check console:</h2>
          <pre style={{ whiteSpace:'pre-wrap', color:'#900', fontSize:13 }}>
            {this.state.error.toString()}{'\n\n'}{this.state.error.stack || ''}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary><App /></ErrorBoundary>
);