
import { WebSocketServer } from 'ws'

let wss: WebSocketServer | null = null

export async function GET() {
  if (!wss) {
    // Create WebSocket server
    wss = new WebSocketServer({ port: 8080 })
    
    wss.on('connection', (ws) => {
      console.log('New WebSocket connection')
      
      ws.on('message', (message) => {
        try {
          const event = JSON.parse(message.toString())
          console.log('Broadcasting event:', event)
          
          // Broadcast to all other connected clients
          wss?.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) { // OPEN
              client.send(JSON.stringify(event))
            }
          })
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
        }
      })
      
      ws.on('close', () => {
        console.log('WebSocket connection closed')
      })
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
      })
    })
    
    console.log('WebSocket server started on port 8080')
  }
  
  return new Response('WebSocket server running', { status: 200 })
}