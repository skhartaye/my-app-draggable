"use client"

import { useEffect, useRef } from 'react'
import { getRealtimeClient } from '@/lib/realtime/websocket'

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

function getUserColor(userId: string): string {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function useCursorTracking(containerRef: React.RefObject<HTMLElement>) {
  const userIdRef = useRef<string>(generateUserId())
  const userColorRef = useRef<string>(getUserColor(userIdRef.current))
  const throttleRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle cursor updates to avoid spam
      if (throttleRef.current) return
      
      throttleRef.current = setTimeout(() => {
        throttleRef.current = undefined
      }, 50) // Update every 50ms max

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Send cursor position to other users
      const realtimeClient = getRealtimeClient()
      realtimeClient.sendEvent({
        type: 'CURSOR',
        table: 'cursors',
        cursor: {
          x,
          y,
          user: userIdRef.current,
          color: userColorRef.current
        },
        userId: userIdRef.current
      })
    }

    const handleMouseLeave = () => {
      // Could send a "cursor leave" event here if needed
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    // Send user join event
    const realtimeClient = getRealtimeClient()
    realtimeClient.sendEvent({
      type: 'USER_JOIN',
      table: 'users',
      user: {
        id: userIdRef.current,
        name: `User ${userIdRef.current.slice(-4)}`,
        color: userColorRef.current
      },
      userId: userIdRef.current
    })

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
      }

      // Send user leave event
      const realtimeClient = getRealtimeClient()
      realtimeClient.sendEvent({
        type: 'USER_LEAVE',
        table: 'users',
        user: {
          id: userIdRef.current,
          name: `User ${userIdRef.current.slice(-4)}`,
          color: userColorRef.current
        },
        userId: userIdRef.current
      })
    }
  }, [containerRef])

  return {
    userId: userIdRef.current,
    userColor: userColorRef.current
  }
}