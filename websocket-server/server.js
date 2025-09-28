const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected clients and their info
const clients = new Map();
const cursors = new Map();

// Generate unique user ID
function generateUserId() {
  return Math.random().toString(36).substr(2, 9);
}

// Generate user color
function getUserColor(userId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
}

// Broadcast to all clients except sender
function broadcast(message, excludeClient = null) {
  const messageStr = JSON.stringify(message);
  clients.forEach((clientInfo, client) => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Send user count update to all clients
function broadcastUserCount() {
  broadcast({
    type: 'USER_COUNT_UPDATE',
    count: clients.size
  });
}

// Send cursor positions to all clients
function broadcastCursors() {
  const cursorData = Array.from(cursors.entries()).map(([userId, cursor]) => ({
    userId,
    ...cursor
  }));
  
  broadcast({
    type: 'CURSOR_UPDATE',
    cursors: cursorData
  });
}

wss.on('connection', (ws, req) => {
  const userId = generateUserId();
  const userColor = getUserColor(userId);
  
  // Store client info
  clients.set(ws, {
    userId,
    userColor,
    connectedAt: new Date()
  });

  console.log(`✅ User ${userId} connected (${clients.size} total users)`);

  // Send welcome message with user info
  ws.send(JSON.stringify({
    type: 'WELCOME',
    userId,
    userColor,
    userCount: clients.size
  }));

  // Broadcast user count update
  broadcastUserCount();

  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const clientInfo = clients.get(ws);

      switch (message.type) {
        case 'NOTE_CREATED':
        case 'NOTE_UPDATED':
        case 'NOTE_DELETED':
        case 'NOTES_CLEARED':
          // Broadcast note changes to all other clients
          broadcast({
            ...message,
            userId: clientInfo.userId
          }, ws);
          break;

        case 'CURSOR_MOVE':
          // Update cursor position for this user
          cursors.set(clientInfo.userId, {
            x: message.x,
            y: message.y,
            color: clientInfo.userColor,
            timestamp: Date.now()
          });
          
          // Broadcast cursor update (throttled)
          broadcastCursors();
          break;

        case 'PING':
          // Respond to ping with pong
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;

        default:
          console.log(`📨 Received message from ${clientInfo.userId}:`, message);
          // Broadcast unknown messages to all clients
          broadcast({
            ...message,
            userId: clientInfo.userId
          }, ws);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      console.log(`❌ User ${clientInfo.userId} disconnected`);
      clients.delete(ws);
      cursors.delete(clientInfo.userId);
      
      // Broadcast user count update
      broadcastUserCount();
      
      // Broadcast cursor update to remove disconnected user's cursor
      broadcastCursors();
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('🚨 WebSocket error:', error);
  });
});

// Clean up old cursors (remove cursors older than 30 seconds)
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 30000; // 30 seconds
  
  for (const [userId, cursor] of cursors.entries()) {
    if (now - cursor.timestamp > staleThreshold) {
      cursors.delete(userId);
    }
  }
}, 10000); // Check every 10 seconds

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      connectedUsers: clients.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});