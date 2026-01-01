const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory session storage
// Structure: { sessionId: { code: string, users: Set<socketId> } }
const sessions = new Map();

// =============================================================================
// REST API ENDPOINTS
// =============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sessions: sessions.size });
});

// Create a new session
app.post('/api/sessions', (req, res) => {
  const sessionId = uuidv4();
  
  // Initialize session with default code
  sessions.set(sessionId, {
    code: '// Start coding here...\n\nfunction hello() {\n  console.log("Hello, World!");\n}\n',
    users: new Set()
  });
  
  console.log(`[SESSION CREATED] ${sessionId}`);
  
  res.json({ 
    sessionId,
    url: `http://localhost:5173/session/${sessionId}`
  });
});

// Get session data
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId,
    code: session.code,
    userCount: session.users.size
  });
});

// =============================================================================
// WEBSOCKET HANDLERS
// =============================================================================

io.on('connection', (socket) => {
  console.log(`[USER CONNECTED] ${socket.id}`);
  
  // Join a coding session
  socket.on('join-session', (sessionId) => {
    const session = sessions.get(sessionId);
    
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }
    
    // Join the Socket.IO room for this session
    socket.join(sessionId);
    session.users.add(socket.id);
    
    console.log(`[USER JOINED] ${socket.id} joined session ${sessionId}`);
    
    // Send current code to the newly joined user
    socket.emit('code-update', { code: session.code });
    
    // Notify all users in session about user count
    io.to(sessionId).emit('user-count', { count: session.users.size });
  });
  
  // Handle code changes
  socket.on('code-change', ({ sessionId, code }) => {
    const session = sessions.get(sessionId);
    
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }
    
    // Update code in session
    session.code = code;
    
    // Broadcast to all OTHER users in the session (not the sender)
    socket.to(sessionId).emit('code-update', { code });
  });
  
  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`[USER DISCONNECTED] ${socket.id}`);
    
    // Remove user from all sessions
    sessions.forEach((session, sessionId) => {
      if (session.users.has(socket.id)) {
        session.users.delete(socket.id);
        
        // Notify remaining users about updated count
        io.to(sessionId).emit('user-count', { count: session.users.size });
        
        // Clean up empty sessions after 1 hour of inactivity
        if (session.users.size === 0) {
          setTimeout(() => {
            if (sessions.get(sessionId)?.users.size === 0) {
              sessions.delete(sessionId);
              console.log(`[SESSION CLEANED] ${sessionId}`);
            }
          }, 3600000); // 1 hour
        }
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` WebSocket server ready`);
});