import { NextRequest } from 'next/server'

// Store active connections and recent events
const connections = new Set<ReadableStreamDefaultController>()
const recentEvents: Record<string, unknown>[] = []
const MAX_EVENTS = 100

// Clean up old events periodically
setInterval(() => {
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.splice(0, recentEvents.length - MAX_EVENTS)
  }
}, 60000) // Clean up every minute

export async function GET(request: NextRequest) {
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to our set
      connections.add(controller)
      
      // Send initial connection message
      const welcomeMessage = `data: ${JSON.stringify({
        type: 'WELCOME',
        timestamp: Date.now(),
        userCount: connections.size
      })}\n\n`
      
      controller.enqueue(new TextEncoder().encode(welcomeMessage))
      
      // Send recent events to new connection
      recentEvents.forEach(event => {
        const eventMessage = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(new TextEncoder().encode(eventMessage))
      })
      
      // Broadcast user count update to all connections
      broadcastToAll({
        type: 'USER_COUNT_UPDATE',
        count: connections.size,
        timestamp: Date.now()
      })
      
      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        try {
          const pingMessage = `data: ${JSON.stringify({
            type: 'PING',
            timestamp: Date.now()
          })}\n\n`
          controller.enqueue(new TextEncoder().encode(pingMessage))
        } catch {
          clearInterval(pingInterval)
          connections.delete(controller)
        }
      }, 30000) // Ping every 30 seconds
      
      // Clean up when connection closes
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval)
        connections.delete(controller)
        
        // Broadcast updated user count
        broadcastToAll({
          type: 'USER_COUNT_UPDATE',
          count: connections.size,
          timestamp: Date.now()
        })
      })
    },
    
    cancel() {
      // Connection was cancelled - controller cleanup handled in abort listener
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const event = await request.json()
    
    // Add timestamp to event
    event.timestamp = Date.now()
    
    // Store event for new connections
    recentEvents.push(event)
    
    // Broadcast to all connected clients
    broadcastToAll(event)
    
    return Response.json({ success: true, connections: connections.size })
  } catch (err) {
    console.error('Error broadcasting event:', err)
    return Response.json({ error: 'Failed to broadcast event' }, { status: 500 })
  }
}

function broadcastToAll(event: Record<string, unknown>) {
  const message = `data: ${JSON.stringify(event)}\n\n`
  const encodedMessage = new TextEncoder().encode(message)
  
  // Send to all active connections
  const deadConnections: ReadableStreamDefaultController[] = []
  
  connections.forEach(controller => {
    try {
      controller.enqueue(encodedMessage)
    } catch {
      // Connection is dead, mark for removal
      deadConnections.push(controller)
    }
  })
  
  // Remove dead connections
  deadConnections.forEach(controller => {
    connections.delete(controller)
  })
}