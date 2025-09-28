# WebSocket Server Deployment Guide

This guide will help you deploy the WebSocket server for real-time collaboration features.

## Quick Start

1. **Choose a deployment platform** (Railway recommended)
2. **Deploy the WebSocket server**
3. **Update your Vercel environment variables**
4. **Test the real-time features**

## Step 1: Deploy WebSocket Server

### Option A: Railway (Recommended - Free tier available)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Choose "Deploy from a folder" and select `websocket-server`
5. Railway will automatically detect and deploy the Node.js app
6. Once deployed, copy your app URL (e.g., `https://your-app.railway.app`)

### Option B: Render (Free tier available)

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `websocket-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Deploy and copy your service URL

### Option C: Heroku (Paid)

1. Install Heroku CLI
2. Navigate to your project root
3. Create a new Heroku app:
   ```bash
   heroku create your-websocket-server-name
   ```
4. Deploy the websocket-server folder:
   ```bash
   git subtree push --prefix websocket-server heroku main
   ```

## Step 2: Update Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your Post-It Notes project
3. Go to Settings → Environment Variables
4. Add a new environment variable:
   - **Name**: `NEXT_PUBLIC_WEBSOCKET_URL`
   - **Value**: `wss://your-deployed-websocket-server.com` (replace with your actual URL)
   - **Environments**: Production, Preview, Development

**Important**: Use `wss://` (secure WebSocket) for HTTPS deployments, not `ws://`

## Step 3: Redeploy Your Vercel App

After adding the environment variable, trigger a new deployment:
1. Go to your Vercel project dashboard
2. Click "Deployments" tab
3. Click "Redeploy" on the latest deployment
4. Or push a new commit to trigger automatic deployment

## Step 4: Test Real-Time Features

1. Open your Vercel app in two different browser windows/tabs
2. Create a note in one window
3. You should see it appear in the other window immediately
4. Try moving notes around - they should sync in real-time
5. Check the browser console for WebSocket connection status

## Troubleshooting

### WebSocket Connection Issues

1. **Check the URL format**:
   - Local: `ws://localhost:8080`
   - Production: `wss://your-server.com` (note the 's' in wss)

2. **Verify environment variable**:
   - Make sure `NEXT_PUBLIC_WEBSOCKET_URL` is set in Vercel
   - Redeploy after adding environment variables

3. **Check server logs**:
   - Railway: Go to your project → View Logs
   - Render: Go to your service → Logs tab
   - Heroku: `heroku logs --tail -a your-app-name`

### CORS Issues

The WebSocket server is configured to accept connections from any origin. If you encounter CORS issues, check that your deployment platform isn't blocking WebSocket connections.

### Health Check

Visit `https://your-websocket-server.com/health` to verify the server is running. You should see:
```json
{
  "status": "healthy",
  "connectedUsers": 0,
  "uptime": 123.45,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Local Development

To test locally with the WebSocket server:

1. Start the WebSocket server:
   ```bash
   cd websocket-server
   npm install
   npm start
   ```

2. In another terminal, start your Next.js app:
   ```bash
   npm run dev
   ```

3. The app will connect to `ws://localhost:8080` automatically

## Features Enabled

Once deployed, you'll have:
- ✅ Real-time note creation/updates/deletion
- ✅ Live cursor tracking (see other users' mouse positions)
- ✅ User presence indicators
- ✅ Automatic reconnection on connection loss
- ✅ Multi-user collaboration

## Cost Considerations

- **Railway**: Free tier with 500 hours/month
- **Render**: Free tier with 750 hours/month  
- **Heroku**: Paid plans starting at $7/month

Railway and Render free tiers should be sufficient for testing and light usage.

## Security Notes

- The WebSocket server accepts connections from any origin (CORS: "*")
- Consider implementing authentication for production use
- Monitor usage to prevent abuse
- Set up proper logging and monitoring

## Next Steps

After successful deployment:
1. Test all real-time features thoroughly
2. Consider implementing user authentication
3. Add monitoring and analytics
4. Optimize for your expected user load