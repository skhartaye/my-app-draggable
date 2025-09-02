"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PostItNoteProps {
  id: string
  x: number
  y: number
  content: string
  color: string
  onPositionUpdate: (id: string, x: number, y: number) => void
  onContentUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
}

const colorClasses = {
  yellow: "bg-yellow-200 border-yellow-300",
  pink: "bg-pink-200 border-pink-300",
  blue: "bg-blue-200 border-blue-300",
  green: "bg-green-200 border-green-300",
  orange: "bg-orange-200 border-orange-300",
  purple: "bg-purple-200 border-purple-300",
}

export function PostItNote({ id, x, y, content, color, onPositionUpdate, onContentUpdate, onDelete }: PostItNoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [currentPosition, setCurrentPosition] = useState({ x, y })
  const noteRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const startPositionRef = useRef({ x: 0, y: 0 })
  const pendingDeltaRef = useRef({ dx: 0, dy: 0 })
  const rafIdRef = useRef<number | null>(null)

  // Update local position when props change (from real-time updates)
  useEffect(() => {
    setCurrentPosition({ x, y })
  }, [x, y])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return

    // Prevent default to avoid scrolling on touch devices
    e.preventDefault()

    const rect = noteRef.current?.getBoundingClientRect()
    if (rect) {
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      // capture the starting absolute position from style (left/top)
      startPositionRef.current = { x: currentPosition.x, y: currentPosition.y }
    }
    setIsDragging(true)

    const handlePointerMove = (e: PointerEvent) => {
      // compute raw target position from pointer and offset relative to viewport
      const targetX = e.clientX - dragOffsetRef.current.x
      const targetY = e.clientY - dragOffsetRef.current.y
      // delta from start position
      const dx = targetX - startPositionRef.current.x
      const dy = targetY - startPositionRef.current.y

      pendingDeltaRef.current = { dx, dy }

      if (rafIdRef.current == null) {
        rafIdRef.current = window.requestAnimationFrame(() => {
          rafIdRef.current = null
          const { dx, dy } = pendingDeltaRef.current
          if (noteRef.current) {
            // use transform for smooth, GPU-accelerated movement
            noteRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
            noteRef.current.style.willChange = "transform"
          }
        })
      }
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      // finalize position: apply delta to start, clamp to viewport, commit to state, reset transform
      const { dx, dy } = pendingDeltaRef.current
      const rawX = startPositionRef.current.x + dx
      const rawY = startPositionRef.current.y + dy

      const width = noteRef.current?.offsetWidth || 192
      const height = noteRef.current?.offsetHeight || 192
      const maxX = Math.max(0, window.innerWidth - width)
      const maxY = Math.max(0, window.innerHeight - height)
      const finalX = Math.max(0, Math.min(rawX, maxX))
      const finalY = Math.max(0, Math.min(rawY, maxY))

      // commit final
      setCurrentPosition({ x: finalX, y: finalY })
      onPositionUpdate(id, finalX, finalY)

      // reset transform
      if (noteRef.current) {
        noteRef.current.style.transform = ""
        noteRef.current.style.willChange = "auto"
      }

      // cleanup rAF
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      if (noteRef.current) {
        noteRef.current.removeEventListener("pointermove", handlePointerMove as any)
        noteRef.current.removeEventListener("pointerup", handlePointerUp as any)
        try {
          ;(noteRef.current as any).releasePointerCapture?.((e as any).pointerId)
        } catch {}
      }
    }

    if (noteRef.current) {
      // Enable per-element pointer capture so multiple notes can drag concurrently
      try {
        ;(noteRef.current as any).setPointerCapture?.((e as any).pointerId)
      } catch {}
      noteRef.current.addEventListener("pointermove", handlePointerMove as any)
      noteRef.current.addEventListener("pointerup", handlePointerUp as any)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    onContentUpdate(id, editContent)
    setIsEditing(false)
  }

  const handleContentChange = (newContent: string) => {
    setEditContent(newContent)
    onContentUpdate(id, newContent)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave()
    } else if (e.key === "Escape") {
      setEditContent(content)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={noteRef}
      className={cn(
        "postit-note absolute w-40 h-40 md:w-48 md:h-48 p-3 md:p-4 border-2 rounded-lg cursor-move select-none touch-none",
        colorClasses[color as keyof typeof colorClasses],
        isDragging && "dragging",
      )}
      style={{ left: currentPosition.x, top: currentPosition.y }}
      onPointerDown={handlePointerDown}
    >
      <div className="flex justify-between items-start mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 md:h-6 md:w-6 p-0 hover:bg-black/10 touch-manipulation"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleEdit}
        >
          <Edit3 className="h-3 w-3 md:h-3 md:w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 md:h-6 md:w-6 p-0 hover:bg-destructive hover:text-destructive-foreground touch-manipulation"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(id)}
        >
          <X className="h-3 w-3 md:h-3 md:w-3" />
        </Button>
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => handleContentChange(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full h-24 md:h-32 bg-transparent border-none outline-none resize-none text-xs md:text-sm font-medium placeholder:text-muted-foreground"
          placeholder="Type your note..."
        />
      ) : (
        <div className="w-full h-24 md:h-32 text-xs md:text-sm font-medium whitespace-pre-wrap overflow-hidden">
          {content || "Click edit to add text..."}
        </div>
      )}
    </div>
  )
}
