const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log('🚀 WebSocket server started on port 8080');

wss.on('connection', function connection(ws) {
  console.log('👤 New client connected');
  
  ws.on('message', function incoming(message) {
    try {
      const event = JSON.parse(message.toString());
      console.log('📨 Broadcasting event:', event.type, 'for table:', event.table);
      
      // Broadcast to all other connected clients
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(event));
        }
      });
      
      console.log(`📡 Event broadcasted to ${wss.clients.size - 1} other clients`);
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });
  
  ws.on('close', function close() {
    console.log('👋 Client disconnected');
  });
  
  ws.on('error', function error(err) {
    console.error('🚨 WebSocket error:', err);
  });
});

console.log('✅ Real-time server ready for connections');