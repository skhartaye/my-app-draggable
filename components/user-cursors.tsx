"use client"

import { useState, useEffect } from 'react'
import { getRealtimeClient } from '@/lib/realtime/websocket'

interface UserCursor {
  x: number
  y: number
  user: string
  color: string
  lastSeen: number
}

interface UserCursorsProps {
  viewport?: { scale: number; translateX: number; translateY: number }
}

export function UserCursors({ viewport = { scale: 1, translateX: 0, translateY: 0 } }: UserCursorsProps) {
  const [cursors, setCursors] = useState<Map<string, UserCursor>>(new Map())

  useEffect(() => {
    // Subscribe to cursor events
    const realtimeClient = getRealtimeClient()
    const subscriptionId = realtimeClient.subscribe('cursors', (event) => {
      if (event.type === 'CURSOR' && event.cursor) {
        setCursors(prev => {
          const newCursors = new Map(prev)
          newCursors.set(event.cursor!.user, {
            ...event.cursor!,
            lastSeen: Date.now()
          })
          return newCursors
        })
      }
    })

    // Clean up old cursors every 5 seconds
    const cleanup = setInterval(() => {
      setCursors(prev => {
        const newCursors = new Map(prev)
        const now = Date.now()
        for (const [userId, cursor] of newCursors) {
          if (now - cursor.lastSeen > 5000) {
            newCursors.delete(userId)
          }
        }
        return newCursors
      })
    }, 5000)

    return () => {
      realtimeClient.unsubscribe(subscriptionId)
      clearInterval(cleanup)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.user}
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: cursor.x * viewport.scale + viewport.translateX,
            top: cursor.y * viewport.scale + viewport.translateY,
            transform: 'translate(-2px, -2px)'
          }}
        >
          {/* Cursor pointer */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="drop-shadow-lg"
          >
            <path
              d="M0 0L0 16L5 12L8 18L10 17L7 11L12 11L0 0Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          
          {/* User name label */}
          <div
            className="absolute top-5 left-2 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.user}
          </div>
        </div>
      ))}
    </div>
  )
}