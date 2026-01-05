const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

describe('Collaborative Coding Platform - Integration Tests', () => {
  let app, server, io, serverUrl;
  const sessions = new Map();

  // Setup server before tests
  beforeAll((done) => {
    app = express();
    server = http.createServer(app);
    io = new Server(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    app.use(cors());
    app.use(express.json());

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', sessions: sessions.size });
    });

    // Create session endpoint
    app.post('/api/sessions', (req, res) => {
      const sessionId = uuidv4();
      sessions.set(sessionId, {
        code: '// Start coding here...\n',
        users: new Set()
      });
      res.json({ sessionId, url: `http://localhost:5173/session/${sessionId}` });
    });

    // Get session endpoint
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

    // WebSocket handlers
    io.on('connection', (socket) => {
      socket.on('join-session', (sessionId) => {
        const session = sessions.get(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }
        socket.join(sessionId);
        session.users.add(socket.id);
        socket.emit('code-update', { code: session.code });
        io.to(sessionId).emit('user-count', { count: session.users.size });
      });

      socket.on('code-change', ({ sessionId, code }) => {
        const session = sessions.get(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }
        session.code = code;
        socket.to(sessionId).emit('code-update', { code });
      });

      socket.on('disconnect', () => {
        sessions.forEach((session, sessionId) => {
          if (session.users.has(socket.id)) {
            session.users.delete(socket.id);
            io.to(sessionId).emit('user-count', { count: session.users.size });
          }
        });
      });
    });

    server.listen(0, () => {
      const port = server.address().port;
      serverUrl = `http://localhost:${port}`;
      done();
    });
  });

  // Cleanup after tests
  afterAll((done) => {
    io.close();
    server.close(done);
  });

  // Clear sessions between tests
  afterEach(() => {
    sessions.clear();
  });

  // ========================================
  // REST API Tests
  // ========================================

  describe('REST API Endpoints', () => {
    test('GET /api/health - should return server status', async () => {
      const response = await request(serverUrl).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('sessions');
    });

    test('POST /api/sessions - should create a new session', async () => {
      const response = await request(serverUrl).post('/api/sessions');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('url');
      expect(response.body.sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('GET /api/sessions/:sessionId - should return session data', async () => {
      // Create session first
      const createResponse = await request(serverUrl).post('/api/sessions');
      const { sessionId } = createResponse.body;

      // Get session data
      const response = await request(serverUrl).get(`/api/sessions/${sessionId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId', sessionId);
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('userCount', 0);
    });

    test('GET /api/sessions/:sessionId - should return 404 for non-existent session', async () => {
      const fakeSessionId = uuidv4();
      const response = await request(serverUrl).get(`/api/sessions/${fakeSessionId}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Session not found');
    });
  });

  // ========================================
  // WebSocket Tests
  // ========================================

  describe('WebSocket Functionality', () => {
    let clientSocket;

    afterEach(() => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
    });

    test('Client should connect to server', (done) => {
      clientSocket = Client(serverUrl);
      
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    test('Client should join a session and receive initial code', (done) => {
      // Create session via REST API
      request(serverUrl)
        .post('/api/sessions')
        .then((response) => {
          const { sessionId } = response.body;
          
          clientSocket = Client(serverUrl);
          
          clientSocket.on('connect', () => {
            clientSocket.emit('join-session', sessionId);
          });

          clientSocket.on('code-update', ({ code }) => {
            expect(code).toBeTruthy();
            expect(typeof code).toBe('string');
            done();
          });
        });
    });

    test('Multiple clients should receive user count updates', (done) => {
      request(serverUrl)
        .post('/api/sessions')
        .then((response) => {
          const { sessionId } = response.body;
          
          const client1 = Client(serverUrl);
          const client2 = Client(serverUrl);
          
          let userCountUpdates = 0;

          client1.on('connect', () => {
            client1.emit('join-session', sessionId);
          });

          client1.on('user-count', ({ count }) => {
            userCountUpdates++;
            if (userCountUpdates === 1) {
              expect(count).toBe(1); // First user joined
              // Second user joins
              client2.on('connect', () => {
                client2.emit('join-session', sessionId);
              });
            } else if (userCountUpdates === 2) {
              expect(count).toBe(2); // Second user joined
              client1.disconnect();
              client2.disconnect();
              done();
            }
          });
        });
    });

    test('Code changes should sync between multiple clients', (done) => {
      request(serverUrl)
        .post('/api/sessions')
        .then((response) => {
          const { sessionId } = response.body;
          const testCode = 'console.log("Hello, World!");';
          
          const client1 = Client(serverUrl);
          const client2 = Client(serverUrl);
          
          let client2Joined = false;

          // Client 1 joins
          client1.on('connect', () => {
            client1.emit('join-session', sessionId);
          });

          // Client 2 joins after client 1
          client1.on('code-update', () => {
            if (!client2Joined) {
              client2.on('connect', () => {
                client2.emit('join-session', sessionId);
                client2Joined = true;
              });
            }
          });

          // Client 2 receives initial code, then client 1 sends change
          client2.on('code-update', ({ code }) => {
            if (client2Joined && code === testCode) {
              // Client 2 received the code change from client 1
              expect(code).toBe(testCode);
              client1.disconnect();
              client2.disconnect();
              done();
            } else if (client2Joined) {
              // Client 1 sends code change
              client1.emit('code-change', { sessionId, code: testCode });
            }
          });
        });
    });

    test('Should handle client disconnect gracefully', (done) => {
      request(serverUrl)
        .post('/api/sessions')
        .then((response) => {
          const { sessionId } = response.body;
          
          const client1 = Client(serverUrl);
          const client2 = Client(serverUrl);
          
          let bothConnected = false;

          client1.on('connect', () => {
            client1.emit('join-session', sessionId);
          });

          client2.on('connect', () => {
            client2.emit('join-session', sessionId);
          });

          client2.on('user-count', ({ count }) => {
            if (count === 2 && !bothConnected) {
              bothConnected = true;
              // Disconnect client 1
              client1.disconnect();
            } else if (count === 1 && bothConnected) {
              // Client 2 received update about client 1 leaving
              expect(count).toBe(1);
              client2.disconnect();
              done();
            }
          });
        });
    });
  });
});