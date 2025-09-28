# WebSocket Server for Post-It Notes

This is a standalone WebSocket server that provides real-time collaboration features for the Post-It Notes application.

## Features

- Real-time note synchronization across all connected users
- Live cursor tracking and display
- User presence indicators
- Automatic cleanup of stale connections
- Health check endpoint
- CORS support for cross-origin requests

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on port 8080 by default.

## Deployment Options

### Option 1: Railway (Recommended)

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the `websocket-server` folder
4. Railway will automatically detect the Node.js app and deploy it
5. Get your deployment URL (e.g., `wss://your-app.railway.app`)

### Option 2: Render

1. Create account at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Deploy and get your WebSocket URL

### Option 3: Heroku

1. Install Heroku CLI
2. Create new Heroku app:
```bash
heroku create your-websocket-server
```
3. Deploy:
```bash
git subtree push --prefix websocket-server heroku main
```

## Environment Variables

- `PORT`: Server port (default: 8080)

## API Endpoints

### WebSocket Connection
- `ws://your-server-url/` - Main WebSocket endpoint

### HTTP Endpoints
- `GET /health` - Health check endpoint

## Message Types

The server handles these message types:

- `NOTE_CREATED` - New note created
- `NOTE_UPDATED` - Note content or position updated  
- `NOTE_DELETED` - Note deleted
- `NOTES_CLEARED` - All notes cleared
- `CURSOR_MOVE` - User cursor position update
- `PING` - Keep-alive ping (responds with PONG)

## Integration with Frontend

After deploying, update your frontend WebSocket connection URL in:
- `hooks/use-realtime-notes.ts`
- `hooks/use-cursor-tracking.ts`

Replace `ws://localhost:8080` with your deployed WebSocket server URL.

## Monitoring

- Check `/health` endpoint for server status
- Monitor server logs for connection/disconnection events
- Track user count and cursor activity