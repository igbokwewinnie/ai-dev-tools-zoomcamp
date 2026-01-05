import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://orange-adventure-76564ppwpgqcpv4g-3000.app.github.dev';

function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const createSession = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to create session');
      
      const data = await response.json();
      navigate(`/session/${data.sessionId}`);
    } catch (err) {
      setError('Failed to create session. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Collaborative Coding Interview</h1>
        <p style={styles.subtitle}>
          Create a session and share the link with others to code together in real-time
        </p>
        
        <button 
          onClick={createSession} 
          disabled={loading}
          style={styles.button}
        >
          {loading ? 'Creating...' : 'Create New Session'}
        </button>
        
        {error && <p style={styles.error}>{error}</p>}
        
        <div style={styles.features}>
          <h3>Features:</h3>
          <ul style={styles.featureList}>
            <li>✅ Real-time collaborative editing</li>
            <li>✅ Share link with anyone</li>
            <li>✅ Multiple users per session</li>
            <li>✅ Instant code synchronization</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #142a8dff 0%, #7068e7ff 100%)',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333'
  },
  subtitle: {
    color: '#666',
    marginBottom: '30px',
    lineHeight: '1.5'
  },
  button: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #122bb8ff 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginBottom: '20px'
  },
  error: {
    color: '#e74c3c',
    marginTop: '10px',
    fontSize: '14px'
  },
  features: {
    marginTop: '30px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '10px 0 0 0'
  }
};

export default Home;