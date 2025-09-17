"use client"

import type React from "react"

import { useState, useRef, useEffect, memo } from "react"
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
  viewport?: { scale: number; translateX: number; translateY: number }
}

const colorClasses = {
  yellow: "bg-yellow-200 border-yellow-300",
  pink: "bg-pink-200 border-pink-300",
  blue: "bg-blue-200 border-blue-300",
  green: "bg-green-200 border-green-300",
  orange: "bg-orange-200 border-orange-300",
  purple: "bg-purple-200 border-purple-300",
}

const PostItNote = memo(function PostItNote({ id, x, y, content, color, onPositionUpdate, onContentUpdate, onDelete, viewport = { scale: 1, translateX: 0, translateY: 0 } }: PostItNoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [currentPosition, setCurrentPosition] = useState({ x, y })
  const noteRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)


  const pointerIdRef = useRef<number | null>(null)

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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return

    // Prevent canvas panning
    e.preventDefault()
    e.stopPropagation()

    const rect = noteRef.current?.getBoundingClientRect()
    if (!rect) return

    // Store initial mouse position and note position
    const startMouseX = e.clientX
    const startMouseY = e.clientY
    const startNoteX = currentPosition.x
    const startNoteY = currentPosition.y
    
    setIsDragging(true)
    pointerIdRef.current = e.pointerId
    
    // Add visual feedback
    if (noteRef.current) {
      noteRef.current.style.zIndex = '1000'
    }

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Calculate how much the mouse has moved
      const deltaMouseX = e.clientX - startMouseX
      const deltaMouseY = e.clientY - startMouseY
      
      // Convert mouse movement to world movement (account for zoom)
      const deltaWorldX = deltaMouseX / viewport.scale
      const deltaWorldY = deltaMouseY / viewport.scale
      
      // Calculate new position
      const newX = Math.max(0, startNoteX + deltaWorldX)
      const newY = Math.max(0, startNoteY + deltaWorldY)
      
      // Update position immediately for smooth dragging
      setCurrentPosition({ x: newX, y: newY })
    }

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      setIsDragging(false)
      
      // Reset z-index
      if (noteRef.current) {
        noteRef.current.style.zIndex = ''
      }
      
      // Commit the final position
      onPositionUpdate(id, currentPosition.x, currentPosition.y)
      
      // Remove event listeners
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
      
      if (noteRef.current && pointerIdRef.current != null) {
        try {
          noteRef.current.releasePointerCapture(pointerIdRef.current)
        } catch {
          // ignore
        }
      }
    }

    // Add event listeners to document for better tracking
    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("pointerup", handlePointerUp)
    
    if (noteRef.current) {
      try {
        noteRef.current.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
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
        "postit-note absolute w-40 h-40 md:w-48 md:h-48 p-3 md:p-4 border-2 rounded-lg select-none touch-none",
        colorClasses[color as keyof typeof colorClasses],
        isDragging ? "dragging cursor-grabbing z-50 shadow-2xl" : "cursor-grab hover:shadow-lg transition-all duration-200",
        !isEditing && !isDragging && "hover:scale-105",
      )}
      style={{ 
        left: currentPosition.x, 
        top: currentPosition.y,
        transform: isDragging ? 'rotate(3deg) scale(1.05)' : undefined,
        transition: isDragging ? 'none' : 'all 0.2s ease'
      }}
      onPointerDown={handlePointerDown}
      role="article"
      aria-label={`Sticky note: ${content || 'Empty note'}`}
      tabIndex={0}
    >
      <div className="flex justify-between items-start mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 md:h-6 md:w-6 p-0 hover:bg-black/10 touch-manipulation"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleEdit}
          aria-label="Edit note"
          title="Edit note"
        >
          <Edit3 className="h-3 w-3 md:h-3 md:w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 md:h-6 md:w-6 p-0 hover:bg-destructive hover:text-destructive-foreground touch-manipulation"
          onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => e.stopPropagation()}
          onClick={() => onDelete(id)}
          aria-label="Delete note"
          title="Delete note"
        >
          <X className="h-3 w-3 md:h-3 md:w-3" />
        </Button>
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleContentChange(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onPointerDown={(e: React.PointerEvent<HTMLTextAreaElement>) => e.stopPropagation()}
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
})

export { PostItNote }
