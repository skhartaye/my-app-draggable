"use client"

import { useEffect, useRef, useState } from "react"
import { SSERealtimeClient } from "@/lib/realtime/sse-client"

interface CursorPosition {
  x: number
  y: number
  userId: string
  color: string
  timestamp: number
}

export function useCursorTracking(containerRef: React.RefObject<HTMLElement>) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map())
  const [realtimeClient] = useState(() => new SSERealtimeClient({
    onEvent: (event) => {
      if (event.type === "CURSOR_MOVE") {
        const cursorData = event.data as CursorPosition
        setCursors(prev => {
          const newCursors = new Map(prev)
          newCursors.set(cursorData.userId, cursorData)
          return newCursors
        })
      }
    }
  }))
  
  const lastSentTime = useRef(0)
  const throttleDelay = 50 // Send cursor updates every 50ms max
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastSentTime.current < throttleDelay) return
      
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      realtimeClient.sendEvent({
        type: "CURSOR_MOVE",
        data: {
          x,
          y,
          userId: realtimeClient.getUserId(),
          color: getUserColor(realtimeClient.getUserId()),
          timestamp: now
        }
      })
      
      lastSentTime.current = now
    }

    container.addEventListener('mousemove', handleMouseMove)
    
    // Clean up old cursors periodically
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setCursors(prev => {
        const newCursors = new Map()
        prev.forEach((cursor, userId) => {
          if (now - cursor.timestamp < 30000) { // Keep cursors for 30 seconds
            newCursors.set(userId, cursor)
          }
        })
        return newCursors
      })
    }, 5000)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      clearInterval(cleanupInterval)
    }
  }, [containerRef, realtimeClient, throttleDelay])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      realtimeClient.disconnect()
    }
  }, [realtimeClient])

  return Array.from(cursors.values()).filter(cursor => 
    cursor.userId !== realtimeClient.getUserId()
  )
}

// Generate user color based on user ID
function getUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return colors[Math.abs(hash) % colors.length]
}