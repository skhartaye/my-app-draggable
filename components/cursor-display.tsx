"use client"

interface CursorPosition {
  x: number
  y: number
  userId: string
  color: string
  timestamp: number
}

interface CursorDisplayProps {
  cursors: CursorPosition[]
  viewport: { scale: number; translateX: number; translateY: number }
}

export function CursorDisplay({ cursors, viewport }: CursorDisplayProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {cursors.map((cursor) => {
        // Transform cursor position based on viewport
        const x = cursor.x * viewport.scale + viewport.translateX
        const y = cursor.y * viewport.scale + viewport.translateY
        
        // Only show cursors that are within the visible area
        if (x < -20 || x > window.innerWidth + 20 || y < -20 || y > window.innerHeight + 20) {
          return null
        }
        
        return (
          <div
            key={cursor.userId}
            className="absolute transition-all duration-100 ease-out"
            style={{
              left: x,
              top: y,
              transform: 'translate(-2px, -2px)'
            }}
          >
            {/* Cursor pointer */}
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: cursor.color }}
            />
            
            {/* User label */}
            <div
              className="absolute top-5 left-0 px-2 py-1 rounded text-xs text-white shadow-lg whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              User {cursor.userId.slice(-4)}
            </div>
          </div>
        )
      })}
    </div>
  )
}