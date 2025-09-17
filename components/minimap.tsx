"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Map, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Note } from "@/hooks/use-realtime-notes"

interface MinimapProps {
  notes: Note[]
  viewport: { scale: number; translateX: number; translateY: number }
  onViewportChange: (transform: { scale: number; translateX: number; translateY: number }) => void
}

const colorClasses = {
  yellow: "bg-yellow-400",
  pink: "bg-pink-400",
  blue: "bg-blue-400", 
  green: "bg-green-400",
  orange: "bg-orange-400",
  purple: "bg-purple-400",
}

export function Minimap({ notes, viewport, onViewportChange }: MinimapProps) {
  const [isVisible, setIsVisible] = useState(false)
  const minimapRef = useRef<HTMLDivElement>(null)

  const minimapWidth = 200
  const minimapHeight = 150
  const scale = 0.1 // Scale factor for minimap

  // Calculate bounds of all notes
  const getBounds = () => {
    if (notes.length === 0) {
      return { minX: 0, maxX: window.innerWidth, minY: 0, maxY: window.innerHeight }
    }

    const noteWidth = window.innerWidth < 768 ? 160 : 192
    const noteHeight = window.innerWidth < 768 ? 160 : 192
    const padding = 100

    const minX = Math.min(...notes.map(note => note.x)) - padding
    const maxX = Math.max(...notes.map(note => note.x + noteWidth)) + padding
    const minY = Math.min(...notes.map(note => note.y)) - padding
    const maxY = Math.max(...notes.map(note => note.y + noteHeight)) + padding

    return { minX, maxX, minY, maxY }
  }

  const bounds = getBounds()
  const worldWidth = bounds.maxX - bounds.minX
  const worldHeight = bounds.maxY - bounds.minY

  // Calculate viewport rectangle in minimap coordinates
  const viewportRect = {
    x: (-viewport.translateX / viewport.scale - bounds.minX) * scale * minimapWidth / worldWidth,
    y: (-viewport.translateY / viewport.scale - bounds.minY) * scale * minimapHeight / worldHeight,
    width: (window.innerWidth / viewport.scale) * scale * minimapWidth / worldWidth,
    height: (window.innerHeight / viewport.scale) * scale * minimapHeight / worldHeight,
  }

  const handleMinimapClick = (e: React.MouseEvent) => {
    if (!minimapRef.current) return

    const rect = minimapRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert minimap coordinates to world coordinates
    const worldX = (x / minimapWidth) * worldWidth + bounds.minX
    const worldY = (y / minimapHeight) * worldHeight + bounds.minY

    // Center the viewport on the clicked point
    const newTranslateX = -worldX * viewport.scale + window.innerWidth / 2
    const newTranslateY = -worldY * viewport.scale + window.innerHeight / 2

    onViewportChange({
      scale: viewport.scale,
      translateX: newTranslateX,
      translateY: newTranslateY,
    })
  }

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-2 right-2 md:bottom-4 md:right-4 z-40 bg-card/95 backdrop-blur-sm"
        title="Show minimap"
      >
        <Map className="h-4 w-4" />
        <span className="hidden md:inline ml-2">Map</span>
      </Button>
    )
  }

  return (
    <div className="fixed bottom-2 right-2 md:bottom-4 md:right-4 z-40 bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg">
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium flex items-center gap-1">
            <Map className="h-3 w-3" />
            Minimap
          </h4>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div
          ref={minimapRef}
          className="relative bg-muted/50 border rounded cursor-pointer"
          style={{ width: minimapWidth, height: minimapHeight }}
          onClick={handleMinimapClick}
        >
          {/* Notes */}
          {notes.map((note) => {
            const x = ((note.x - bounds.minX) / worldWidth) * minimapWidth
            const y = ((note.y - bounds.minY) / worldHeight) * minimapHeight
            const size = 4

            return (
              <div
                key={note.id}
                className={cn(
                  "absolute rounded-sm border",
                  colorClasses[note.color as keyof typeof colorClasses]
                )}
                style={{
                  left: x - size / 2,
                  top: y - size / 2,
                  width: size,
                  height: size,
                }}
                title={note.content || "Empty note"}
              />
            )
          })}

          {/* Viewport indicator */}
          <div
            className="absolute border-2 border-primary bg-primary/20 rounded"
            style={{
              left: Math.max(0, Math.min(viewportRect.x, minimapWidth)),
              top: Math.max(0, Math.min(viewportRect.y, minimapHeight)),
              width: Math.min(viewportRect.width, minimapWidth - Math.max(0, viewportRect.x)),
              height: Math.min(viewportRect.height, minimapHeight - Math.max(0, viewportRect.y)),
            }}
          />
        </div>

        <div className="text-xs text-muted-foreground mt-2 text-center">
          Click to navigate
        </div>
      </div>
    </div>
  )
}