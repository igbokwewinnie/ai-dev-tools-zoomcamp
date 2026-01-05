import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import CodeExecutor from './CodeExecutor';

const API_URL = 'https://orange-adventure-76564ppwpgqcpv4g-3000.app.github.dev';

function CodeSession() {
  const { sessionId } = useParams();
  const [code, setCode] = useState('// Loading...');
  const [userCount, setUserCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('javascript');
  
  // Socket reference (persists across re-renders)
  const socketRef = useRef(null);
  
  // Flag to prevent echo when receiving updates
  const isRemoteChange = useRef(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection established
    socket.on('connect', () => {
      console.log('[CONNECTED] Socket connected:', socket.id);
      setConnected(true);
      
      // Join the session
      socket.emit('join-session', sessionId);
    });

    // Receive initial code or updates from other users
    socket.on('code-update', ({ code: newCode }) => {
      console.log('[CODE UPDATE] Received from server');
      isRemoteChange.current = true; // Mark as remote change
      setCode(newCode);
    });

    // Receive user count updates
    socket.on('user-count', ({ count }) => {
      console.log(`[USER COUNT] ${count} users in session`);
      setUserCount(count);
    });

    // Handle errors
    socket.on('error', ({ message }) => {
      console.error('[ERROR]', message);
      setError(message);
    });

    // Connection lost
    socket.on('disconnect', () => {
      console.log('[DISCONNECTED] Socket disconnected');
      setConnected(false);
    });

    // Cleanup on unmount
    return () => {
      console.log('[CLEANUP] Disconnecting socket');
      socket.disconnect();
    };
  }, [sessionId]);

  // Handle code changes in editor
  const handleEditorChange = (value) => {
    // Ignore if this change came from the server
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }

    setCode(value);
    
    // Emit code change to server
    if (socketRef.current && connected) {
      socketRef.current.emit('code-change', {
        sessionId,
        code: value
      });
    }
  };

  // Copy session link to clipboard
  const copyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Session link copied to clipboard!');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
  <div style={styles.headerLeft}>
    <h2 style={styles.title}>Collaborative Coding Session</h2>
    <div style={styles.statusBar}>
      <span style={{
        ...styles.statusDot,
        background: connected ? '#2ecc71' : '#e74c3c'
      }} />
      <span style={styles.statusText}>
        {connected ? 'Connected' : 'Disconnected'}
      </span>
      <span style={styles.divider}>|</span>
      <span style={styles.userCount}>
        👥 {userCount} {userCount === 1 ? 'user' : 'users'}
      </span>
      <span style={styles.divider}>|</span>
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
        style={styles.languageSelect}
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
      </select>
    </div>
  </div>
  <button onClick={copyLink} style={styles.copyButton}>
    📋 Copy Link
  </button>
</div>

      {/* Error message */}
      {error && (
        <div style={styles.errorBanner}>
          ⚠️ {error}
        </div>
      )}

      {/* Code Editor */}
      {/* Split view: Editor + Output */}
<div style={styles.mainContent}>
  <div style={styles.editorContainer}>
    <Editor
      height="100%"
      language={language}
      value={code}
      onChange={handleEditorChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  </div>
  <div style={styles.outputContainer}>
    <CodeExecutor code={code} language={language} />
  </div>
</div>

      {/* Footer info */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Session ID: <code>{sessionId}</code>
        </p>
        <p style={styles.footerText}>
          Share the URL with others to collaborate in real-time
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#1e1e1e'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    background: '#2d2d30',
    borderBottom: '1px solid #3e3e42',
    color: 'white'
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600'
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  statusText: {
    color: '#ccc'
  },
  divider: {
    color: '#666'
  },
  userCount: {
    color: '#ccc'
  },
  copyButton: {
    padding: '8px 16px',
    background: '#0e639c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  errorBanner: {
    padding: '12px 20px',
    background: '#f8d7da',
    color: '#721c24',
    borderBottom: '1px solid #f5c6cb'
  },
  mainContent: {
  flex: 1,
  display: 'flex',
  overflow: 'hidden'
},
editorContainer: {
  flex: 1,
  overflow: 'hidden'
},
outputContainer: {
  width: '40%',
  minWidth: '300px',
  overflow: 'hidden'
},
  footer: {
    padding: '12px 20px',
    background: '#252526',
    borderTop: '1px solid #3e3e42',
    color: '#ccc',
    fontSize: '12px'
  },
  footerText: {
    margin: '4px 0'
  },
  languageSelect: {
  padding: '4px 8px',
  background: '#3e3e42',
  color: '#ccc',
  border: '1px solid #555',
  borderRadius: '4px',
  fontSize: '13px',
  cursor: 'pointer'
}
};

export default CodeSession;