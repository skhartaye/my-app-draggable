"use client"

interface RealtimeEvent {
  type: string
  data?: Record<string, unknown> | unknown
  timestamp?: number
  userId?: string
}

interface SSEClientOptions {
  onConnect?: () => void
  onDisconnect?: () => void
  onEvent?: (event: RealtimeEvent) => void
  onUserCountUpdate?: (count: number) => void
}

export class SSERealtimeClient {
  private eventSource: EventSource | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private options: SSEClientOptions
  private userId: string

  constructor(options: SSEClientOptions = {}) {
    this.options = options
    this.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.connect()
  }

  private connect() {
    // Only connect in browser environment
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      console.log('⚠️ SSE not available in this environment')
      return
    }

    try {
      console.log('🔌 Connecting to SSE realtime server...')
      
      // Close existing connection
      if (this.eventSource) {
        this.eventSource.close()
      }

      // Create new EventSource connection
      this.eventSource = new EventSource('/api/realtime')

      this.eventSource.onopen = () => {
        console.log('✅ SSE connected!')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.options.onConnect?.()
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleEvent(data)
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('🚨 SSE error:', error)
        this.isConnected = false
        this.options.onDisconnect?.()
        
        // Attempt to reconnect
        this.scheduleReconnect()
      }

    } catch (error) {
      console.error('💥 Failed to create SSE connection:', error)
      this.scheduleReconnect()
    }
  }

  private handleEvent(event: RealtimeEvent) {
    switch (event.type) {
      case 'WELCOME':
        console.log('👋 Welcome message received')
        break
        
      case 'USER_COUNT_UPDATE':
        const count = (event.data as { count: number })?.count || 0
        console.log(`👥 User count: ${count}`)
        this.options.onUserCountUpdate?.(count)
        break
        
      case 'PING':
        // Server keep-alive ping, no action needed
        break
        
      default:
        // Forward other events to the callback
        this.options.onEvent?.(event)
        break
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      return
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++

    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  // Send event to server (broadcasts to all clients)
  async sendEvent(event: RealtimeEvent) {
    try {
      const response = await fetch('/api/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...event,
          userId: this.userId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('📤 Event sent successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Failed to send event:', error)
      throw error
    }
  }

  // Get connection status
  isConnectedToServer(): boolean {
    return this.isConnected
  }

  // Get user ID
  getUserId(): string {
    return this.userId
  }

  // Close connection
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.isConnected = false
    this.options.onDisconnect?.()
  }
}