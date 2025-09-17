"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface ZoomableCanvasProps {
  children: React.ReactNode
  className?: string
  transform: { scale: number; translateX: number; translateY: number }
  onTransformChange: (transform: { scale: number; translateX: number; translateY: number }) => void
}

export function ZoomableCanvas({ children, className, transform, onTransformChange }: ZoomableCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.3, Math.min(3, transform.scale * delta))
    
    if (newScale === transform.scale) return

    // Zoom towards mouse position
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Calculate the point in world coordinates before zoom
    const worldX = (mouseX - transform.translateX) / transform.scale
    const worldY = (mouseY - transform.translateY) / transform.scale

    // Calculate new translation to keep the world point under the mouse
    const newTranslateX = mouseX - worldX * newScale
    const newTranslateY = mouseY - worldY * newScale

    onTransformChange({
      scale: newScale,
      translateX: newTranslateX,
      translateY: newTranslateY,
    })
  }, [transform, onTransformChange])

  // Handle pan start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Check if the target is a note or its child elements
    const target = e.target as HTMLElement
    const isNote = target.closest('.postit-note')
    const isButton = target.closest('button')
    const isTextarea = target.tagName === 'TEXTAREA'
    const isInput = target.tagName === 'INPUT'
    
    // Only pan if:
    // 1. Middle mouse button, OR
    // 2. Ctrl/Cmd key held, OR  
    // 3. Clicking on empty canvas (not on interactive elements)
    const shouldPan = e.button === 1 || 
                     e.ctrlKey || 
                     e.metaKey || 
                     (!isNote && !isButton && !isTextarea && !isInput)
    
    if (shouldPan) {
      e.preventDefault()
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      canvasRef.current?.setPointerCapture(e.pointerId)
    }
  }, [])

  // Handle pan move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return
    
    e.preventDefault()

    const deltaX = e.clientX - lastPanPoint.x
    const deltaY = e.clientY - lastPanPoint.y

    onTransformChange({
      scale: transform.scale,
      translateX: transform.translateX + deltaX,
      translateY: transform.translateY + deltaY,
    })

    setLastPanPoint({ x: e.clientX, y: e.clientY })
  }, [isPanning, lastPanPoint, transform, onTransformChange])

  // Handle pan end
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false)
      canvasRef.current?.releasePointerCapture(e.pointerId)
    }
  }, [isPanning])

  // Keyboard shortcuts for zoom and pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom with + and -
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        const newScale = Math.min(3, transform.scale * 1.2)
        onTransformChange({ ...transform, scale: newScale })
      } else if (e.key === '-') {
        e.preventDefault()
        const newScale = Math.max(0.3, transform.scale / 1.2)
        onTransformChange({ ...transform, scale: newScale })
      }
      // Reset with 0
      else if (e.key === '0') {
        e.preventDefault()
        onTransformChange({ scale: 1, translateX: 0, translateY: 0 })
      }
      // Pan with arrow keys
      else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onTransformChange({ ...transform, translateX: transform.translateX + 50 })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onTransformChange({ ...transform, translateX: transform.translateX - 50 })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        onTransformChange({ ...transform, translateY: transform.translateY + 50 })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        onTransformChange({ ...transform, translateY: transform.translateY - 50 })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [transform, onTransformChange])

  // Add wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  return (
    <div
      ref={canvasRef}
      className={cn(
        "absolute inset-0 overflow-hidden",
        isPanning && "cursor-grabbing",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        cursor: isPanning ? 'grabbing' : 'default',
      }}
    >
      <div
        className="absolute inset-0 origin-top-left transition-transform duration-100"
        style={{
          transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {children}
      </div>
    </div>
  )
}