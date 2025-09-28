"use client"

interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR' | 'CURSOR' | 'USER_JOIN' | 'USER_LEAVE' | 'TYPING'
  table: string
  data?: Record<string, unknown>
  old?: Record<string, unknown>
  userId?: string
  cursor?: { x: number; y: number; user: string; color: string }
  user?: { id: string; name: string; color: string }
  noteId?: string
}

interface RealtimeSubscription {
  id: string
  table: string
  callback: (event: RealtimeEvent) => void
}

class RealtimeClient {
  private ws: WebSocket | null = null
  private subscriptions: Map<string, RealtimeSubscription> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private isConnected = false
  private connectionCallbacks: ((connected: boolean) => void)[] = []
  private userId: string
  private messageQueue: RealtimeEvent[] = []

  constructor() {
    this.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.connect()
  }

  private connect() {
    try {
      console.log("Connecting to WebSocket server...")
      
      // Clear any existing connection
      if (this.ws) {
        this.ws.close()
        this.ws = null
      }
      
      // Connect to WebSocket server
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080'
      this.ws = new WebSocket(wsUrl)
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.log("WebSocket connection timeout")
          this.ws.close()
          this.scheduleReconnect()
        }
      }, 5000)
      
      this.ws.onopen = () => {
        clearTimeout(connectionTimeout)
        console.log("WebSocket connected successfully")
        this.isConnected = true
        this.reconnectAttempts = 0
        this.notifyConnectionChange(true)
        
        // Send queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift()
          if (message) {
            this.sendEvent(message)
          }
        }
      }
      
      this.ws.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data)
          console.log("Received real-time event:", realtimeEvent)
          
          // Don't process our own events
          if (realtimeEvent.userId === this.userId) {
            return
          }
          
          // Notify all subscribers for this table
          this.subscriptions.forEach(sub => {
            if (sub.table === realtimeEvent.table) {
              sub.callback(realtimeEvent)
            }
          })
        } catch (error) {
          console.error("Error processing WebSocket message:", error)
        }
      }
      
      this.ws.onclose = () => {
        console.log("WebSocket connection closed")
        this.isConnected = false
        this.notifyConnectionChange(false)
        this.scheduleReconnect()
      }
      
      this.ws.onerror = (error) => {
        console.error("WebSocket error details:", {
          error,
          readyState: this.ws?.readyState,
          url: this.ws?.url,
          type: error.type,
          target: error.target
        })
        this.isConnected = false
        this.notifyConnectionChange(false)
        this.scheduleReconnect()
      }
      
    } catch (error) {
      console.error("Failed to connect to WebSocket server:", error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
      console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
      
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    } else {
      console.error("Max reconnection attempts reached")
    }
  }

  private notifyConnectionChange(connected: boolean) {
    this.isConnected = connected
    this.connectionCallbacks.forEach(callback => callback(connected))
  }

  subscribe(table: string, callback: (event: RealtimeEvent) => void): string {
    const id = `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.subscriptions.set(id, { id, table, callback })
    console.log(`Subscribed to ${table} changes with ID: ${id}`)
    return id
  }

  unsubscribe(id: string) {
    this.subscriptions.delete(id)
    console.log(`Unsubscribed from real-time updates: ${id}`)
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback)
    // Immediately call with current status
    callback(this.isConnected)
  }

  // Send real-time event to other users
  sendEvent(event: RealtimeEvent) {
    const eventWithUser = { ...event, userId: this.userId }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(eventWithUser))
      console.log("Sent real-time event:", eventWithUser)
    } else {
      console.log("WebSocket not connected, queuing event:", eventWithUser)
      this.messageQueue.push(eventWithUser)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.notifyConnectionChange(false)
  }

  isConnectedToRealtime(): boolean {
    return this.isConnected
  }
}

// Singleton instance
let realtimeClient: RealtimeClient | null = null

export function getRealtimeClient(): RealtimeClient {
  if (!realtimeClient) {
    realtimeClient = new RealtimeClient()
  }
  return realtimeClient
}

export type { RealtimeEvent, RealtimeSubscription }