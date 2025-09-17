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
  
  // Touch gesture state
  const [isGesturing, setIsGesturing] = useState(false)
  const [lastTouchDistance, setLastTouchDistance] = useState(0)
  const [isTouchPanning, setIsTouchPanning] = useState(false)
  const [lastTouchPanPoint, setLastTouchPanPoint] = useState({ x: 0, y: 0 })
  const [touchStartTime, setTouchStartTime] = useState(0)

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

  // Helper function to calculate distance between two touches
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }



  // Handle touch start for gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two finger touch - could be pinch or pan
      e.preventDefault()
      setIsGesturing(true)
      setTouchStartTime(Date.now())
      
      const distance = getTouchDistance(e.touches)
      setLastTouchDistance(distance)
      
      // Set initial pan point (center between two fingers)
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      setLastTouchPanPoint({ x: centerX, y: centerY })
    } else if (e.touches.length === 1) {
      // Single finger - check if it's on empty canvas for potential pan
      const target = e.target as HTMLElement
      const isNote = target.closest('.postit-note')
      const isButton = target.closest('button')
      const isTextarea = target.tagName === 'TEXTAREA'
      const isInput = target.tagName === 'INPUT'
      
      // Only start single-finger pan on empty canvas
      if (!isNote && !isButton && !isTextarea && !isInput) {
        setIsTouchPanning(true)
        setLastTouchPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      }
    }
  }, [])

  // Handle touch move for gestures
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isGesturing) {
      e.preventDefault()
      
      const distance = getTouchDistance(e.touches)
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      
      // Calculate how much the distance changed (for zoom)
      const distanceChange = Math.abs(distance - lastTouchDistance)
      
      // Calculate how much the center moved (for pan)
      const panDeltaX = centerX - lastTouchPanPoint.x
      const panDeltaY = centerY - lastTouchPanPoint.y
      const panDistance = Math.sqrt(panDeltaX * panDeltaX + panDeltaY * panDeltaY)
      
      // Determine if this is primarily a zoom or pan gesture
      const timeSinceStart = Date.now() - touchStartTime
      const isZoomGesture = distanceChange > panDistance * 0.3 || timeSinceStart < 100
      
      if (isZoomGesture && lastTouchDistance > 0) {
        // Handle pinch zoom
        const scaleChange = distance / lastTouchDistance
        const newScale = Math.max(0.3, Math.min(3, transform.scale * scaleChange))
        
        // Calculate center point relative to canvas
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        
        const canvasCenterX = centerX - rect.left
        const canvasCenterY = centerY - rect.top
        
        // Calculate world coordinates of the pinch center
        const worldX = (canvasCenterX - transform.translateX) / transform.scale
        const worldY = (canvasCenterY - transform.translateY) / transform.scale
        
        // Calculate new translation to keep the pinch center in place
        const newTranslateX = canvasCenterX - worldX * newScale
        const newTranslateY = canvasCenterY - worldY * newScale
        
        onTransformChange({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        })
        
        setLastTouchDistance(distance)
      } else if (panDistance > 5) {
        // Handle two-finger pan
        onTransformChange({
          scale: transform.scale,
          translateX: transform.translateX + panDeltaX,
          translateY: transform.translateY + panDeltaY,
        })
        
        setLastTouchPanPoint({ x: centerX, y: centerY })
      }
    } else if (e.touches.length === 1 && isTouchPanning) {
      // Handle single-finger pan on empty canvas
      e.preventDefault()
      
      const touch = e.touches[0]
      const deltaX = touch.clientX - lastTouchPanPoint.x
      const deltaY = touch.clientY - lastTouchPanPoint.y
      
      onTransformChange({
        scale: transform.scale,
        translateX: transform.translateX + deltaX,
        translateY: transform.translateY + deltaY,
      })
      
      setLastTouchPanPoint({ x: touch.clientX, y: touch.clientY })
    }
  }, [isGesturing, isTouchPanning, lastTouchDistance, lastTouchPanPoint, touchStartTime, transform, onTransformChange])

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsGesturing(false)
      setLastTouchDistance(0)
    }
    
    if (e.touches.length === 0) {
      setIsTouchPanning(false)
    }
  }, [])

  // Handle pan start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't handle pointer events if we're in a touch gesture
    if (isGesturing) return
    
    // Check if we're on mobile
    const isMobile = window.innerWidth < 768
    
    // Check if the target is a note or its child elements
    const target = e.target as HTMLElement
    const isNote = target.closest('.postit-note')
    const isButton = target.closest('button')
    const isTextarea = target.tagName === 'TEXTAREA'
    const isInput = target.tagName === 'INPUT'
    
    // On mobile, be much more restrictive about panning
    // Only pan if explicitly holding Ctrl/Cmd or middle mouse
    // Don't pan on empty canvas clicks on mobile (interferes with touch)
    const shouldPan = isMobile 
      ? (e.button === 1 || e.ctrlKey || e.metaKey)
      : (e.button === 1 || 
         e.ctrlKey || 
         e.metaKey || 
         (!isNote && !isButton && !isTextarea && !isInput))
    
    if (shouldPan) {
      e.preventDefault()
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      canvasRef.current?.setPointerCapture(e.pointerId)
    }
  }, [isGesturing])

  // Handle pan move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning || isGesturing) return
    
    e.preventDefault()

    const deltaX = e.clientX - lastPanPoint.x
    const deltaY = e.clientY - lastPanPoint.y

    onTransformChange({
      scale: transform.scale,
      translateX: transform.translateX + deltaX,
      translateY: transform.translateY + deltaY,
    })

    setLastPanPoint({ x: e.clientX, y: e.clientY })
  }, [isPanning, isGesturing, lastPanPoint, transform, onTransformChange])

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
      // Check if user is currently typing in an input field
      const activeElement = document.activeElement as HTMLElement
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true' ||
        activeElement.isContentEditable
      )

      // Don't process any keyboard shortcuts while user is typing
      if (isTyping) {
        return
      }

      // Skip on mobile devices
      const isMobile = window.innerWidth < 768
      if (isMobile) return

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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: isPanning ? 'grabbing' : 'default',
        touchAction: 'none', // Prevent default touch behaviors
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