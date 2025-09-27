// Simplified WebSocket client for testing
export class SimpleWebSocketClient {
  private ws: WebSocket | null = null
  private isConnected = false
  
  constructor() {
    this.connect()
  }
  
  private connect() {
    try {
      console.log('🔌 Connecting to WebSocket...')
      this.ws = new WebSocket('ws://localhost:8080')
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected!')
        this.isConnected = true
      }
      
      this.ws.onmessage = (event) => {
        console.log('📨 Received:', event.data)
      }
      
      this.ws.onclose = () => {
        console.log('❌ WebSocket closed')
        this.isConnected = false
      }
      
      this.ws.onerror = (error) => {
        console.error('🚨 WebSocket error:', error)
        this.isConnected = false
      }
      
    } catch (error) {
      console.error('💥 Failed to create WebSocket:', error)
    }
  }
  
  sendMessage(message: any) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message))
      console.log('📤 Sent:', message)
    } else {
      console.log('⚠️ WebSocket not connected, cannot send:', message)
    }
  }
}

// Test the simple client
if (typeof window !== 'undefined') {
  (window as any).testWebSocket = () => {
    const client = new SimpleWebSocketClient()
    setTimeout(() => {
      client.sendMessage({ type: 'TEST', message: 'Hello from simple client!' })
    }, 2000)
  }
}