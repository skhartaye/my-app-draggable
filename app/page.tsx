"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PostItNote } from "@/components/postit-note"
import { ColorPicker } from "@/components/color-picker"
import { Plus, Trash2, Wifi, WifiOff, Grid3X3 } from "lucide-react"
import { useRealtimeNotes, type Note } from "@/hooks/use-realtime-notes"
import { NotesLoadingSkeleton } from "@/components/loading-skeleton"
import { ToastContainer, useToast } from "@/components/toast"
import { NotesOverview } from "@/components/notes-overview"
import { ViewportNavigator } from "@/components/viewport-navigator"
import { Minimap } from "@/components/minimap"
import { ZoomableCanvas } from "@/components/zoomable-canvas"
import { CursorDisplay } from "@/components/cursor-display"
import { useCursorTracking } from "@/hooks/use-cursor-tracking-sse"

export default function PostItApp() {
  const [selectedColor, setSelectedColor] = useState("yellow")
  const [showOverview, setShowOverview] = useState(false)
  const [viewport, setViewport] = useState({ scale: 1, translateX: 0, translateY: 0 })
  const { notes, loading, connected, userCount, createNote, updateNote, deleteNote, clearAllNotes } = useRealtimeNotes()
  const toast = useToast()
  
  // Cursor tracking for collaborative features
  const canvasRef = useRef<HTMLDivElement>(null)
  const otherCursors = useCursorTracking(canvasRef as React.RefObject<HTMLElement>)

  const handleCreateNote = useCallback(async () => {
    const isMobile = window.innerWidth < 768
    const noteWidth = isMobile ? 160 : 192
    const noteHeight = isMobile ? 160 : 192
    
    // Calculate position in world coordinates (accounting for current viewport)
    const viewportCenterX = (window.innerWidth / 2 - viewport.translateX) / viewport.scale
    const viewportCenterY = (window.innerHeight / 2 - viewport.translateY) / viewport.scale
    
    // Add some randomness around the viewport center
    const randomOffsetX = (Math.random() - 0.5) * 200
    const randomOffsetY = (Math.random() - 0.5) * 200

    const newNoteData = {
      x: Math.max(0, viewportCenterX + randomOffsetX - noteWidth / 2),
      y: Math.max(0, viewportCenterY + randomOffsetY - noteHeight / 2),
      content: "",
      color: selectedColor,
    }

    try {
      await createNote(newNoteData)
      toast.success("Note created!")
    } catch (error) {
      console.error("Failed to create note:", error)
      toast.error("Failed to create note. Please try again.")
    }
  }, [selectedColor, createNote, toast, viewport])

  const handleUpdateNotePosition = (id: string, x: number, y: number) => {
    updateNote(id, { x, y })
  }

  const handleUpdateNoteContent = (id: string, content: string) => {
    updateNote(id, { content })
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id)
      toast.success("Note deleted!")
    } catch (error) {
      console.error("Failed to delete note:", error)
      toast.error("Failed to delete note. Please try again.")
    }
  }

  const handleClearAllNotes = useCallback(async () => {
    if (!confirm("Are you sure you want to delete all notes? This action cannot be undone.")) {
      return
    }
    
    try {
      await clearAllNotes()
      toast.success("All notes cleared!")
    } catch (error) {
      console.error("Failed to clear notes:", error)
      toast.error("Failed to clear notes. Please try again.")
    }
  }, [clearAllNotes, toast])

  const handleNoteClick = useCallback((note: Note) => {
    // Navigate to the clicked note
    const noteWidth = window.innerWidth < 768 ? 160 : 192
    const noteHeight = window.innerWidth < 768 ? 160 : 192
    
    const targetX = note.x + noteWidth / 2
    const targetY = note.y + noteHeight / 2
    
    const newTranslateX = window.innerWidth / 2 - targetX * viewport.scale
    const newTranslateY = window.innerHeight / 2 - targetY * viewport.scale
    
    setViewport({
      scale: Math.max(viewport.scale, 1), // Ensure at least 100% zoom
      translateX: newTranslateX,
      translateY: newTranslateY,
    })
    
    setShowOverview(false)
    toast.info(`Navigated to note: ${note.content || 'Empty note'}`)
  }, [viewport.scale, toast])

  const handleViewportChange = useCallback((newViewport: typeof viewport) => {
    setViewport(newViewport)
  }, [])

  // Keyboard shortcuts - only on desktop
  useEffect(() => {
    // Skip keyboard shortcuts on mobile devices
    const isMobile = window.innerWidth < 768
    if (isMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is currently typing in an input field
      const activeElement = document.activeElement as HTMLElement
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true' ||
        activeElement.isContentEditable
      )

      // If user is typing, only allow Ctrl/Cmd shortcuts, not single key shortcuts
      if (isTyping) {
        // Only allow Ctrl/Cmd + N to create new note while typing
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
          e.preventDefault()
          handleCreateNote()
        }
        // Only allow Ctrl/Cmd + Shift + Delete to clear all notes while typing
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Delete') {
          e.preventDefault()
          if (notes.length > 0) {
            handleClearAllNotes()
          }
        }
        // Don't process single-key shortcuts while typing
        return
      }

      // Single-key shortcuts only work when NOT typing
      // Ctrl/Cmd + N to create new note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleCreateNote()
      }
      // Ctrl/Cmd + Shift + Delete to clear all notes
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Delete') {
        e.preventDefault()
        if (notes.length > 0) {
          handleClearAllNotes()
        }
      }
      // O to toggle overview (only when not typing)
      if (e.key === 'o' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowOverview(!showOverview)
      }
      // F to fit all notes (only when not typing)
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        if (notes.length > 0) {
          // Trigger fit all from viewport navigator
          const event = new CustomEvent('fitAllNotes')
          window.dispatchEvent(event)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [notes.length, handleCreateNote, handleClearAllNotes, showOverview])

  if (loading) {
    return <NotesLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-background canvas-grid relative overflow-hidden">
      {/* Main Controls */}
      <div className="fixed top-2 left-2 md:top-4 md:left-4 z-50 flex flex-col gap-2 md:gap-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg border p-3 md:p-4 shadow-lg max-w-[calc(100vw-1rem)] md:max-w-none">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h1 className="text-lg md:text-xl font-bold text-foreground">Post-It Notes</h1>
            <div className="flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-500">Offline</span>
                </>
              )}
              <div className="h-4 w-px bg-border"></div>
              <span className="text-xs text-muted-foreground">
                {userCount} {userCount === 1 ? 'user' : 'users'} online
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <ColorPicker selectedColor={selectedColor} onColorSelect={setSelectedColor} />

            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleCreateNote} className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                Add Note
              </Button>

              {notes.length > 0 && (
                <Button variant="destructive" onClick={handleClearAllNotes} className="flex items-center gap-2 text-sm">
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {notes.length === 0 && (
          <div className="bg-muted/80 backdrop-blur-sm rounded-lg border p-3 md:p-4 max-w-[calc(100vw-1rem)] md:max-w-xs">
            <p className="text-xs md:text-sm text-muted-foreground">
              Click &quot;Add Note&quot; to create your first sticky note! You can drag them around and edit by clicking the
              pencil icon. Notes are shared with other users in real-time.
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              <div className="md:hidden">
                <div>✋ <strong>Drag notes:</strong> Move them around</div>
                <div>🤏 <strong>Pinch:</strong> Zoom in/out</div>
                <div>👆 <strong>Slide:</strong> Pan around canvas</div>
                <div>📋 <strong>Tap overview:</strong> See all notes</div>
              </div>
              <div className="hidden md:block">
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Drag</kbd> - Move notes</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">O</kbd> - Toggle overview</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">F</kbd> - Fit all notes</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Scroll</kbd> - Zoom in/out</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Drag</kbd> - Pan canvas</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zoomable Canvas */}
      <ZoomableCanvas
        ref={canvasRef}
        transform={viewport}
        onTransformChange={handleViewportChange}
        className="canvas-grid"
      >
        {notes.map((note) => (
          <PostItNote
            key={note.id}
            id={note.id}
            x={note.x}
            y={note.y}
            content={note.content}
            color={note.color}
            viewport={viewport}
            onPositionUpdate={handleUpdateNotePosition}
            onContentUpdate={handleUpdateNoteContent}
            onDelete={handleDeleteNote}
          />
        ))}
      </ZoomableCanvas>

      {/* User Cursors for Collaboration */}
      <CursorDisplay cursors={otherCursors} viewport={viewport} />

      {/* Mobile zoom indicator */}
      {viewport.scale !== 1 && (
        <div className="md:hidden fixed top-1/2 left-4 transform -translate-y-1/2 bg-black/80 text-white px-3 py-2 rounded-full text-sm font-medium z-40">
          {Math.round(viewport.scale * 100)}%
        </div>
      )}

      {/* Mobile Floating Action Button for Overview */}
      {notes.length > 0 && (
        <div className="md:hidden fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => setShowOverview(!showOverview)}
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            title="Toggle notes overview"
          >
            <Grid3X3 className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Navigation Components */}
      <NotesOverview
        notes={notes}
        onNoteClick={handleNoteClick}
        onToggleOverview={() => setShowOverview(!showOverview)}
        isVisible={showOverview}
      />

      {/* Hide viewport navigator on mobile - touch devices don't need zoom buttons */}
      <div className="hidden md:block">
        <ViewportNavigator
          notes={notes}
          onViewportChange={handleViewportChange}
        />
      </div>

      {/* Hide minimap on mobile - takes up too much space */}
      <div className="hidden md:block">
        <Minimap
          notes={notes}
          viewport={viewport}
          onViewportChange={handleViewportChange}
        />
      </div>

      {/* Help Tips - Only show on desktop */}
      {notes.length > 0 && (
        <div className="hidden lg:block fixed top-1/2 right-2 transform -translate-y-1/2 bg-card/95 backdrop-blur-sm rounded-lg border p-2 md:p-3 max-w-xs z-30">
          <p className="text-xs text-muted-foreground">
            <strong>Navigation:</strong>
          </p>
          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
            <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Drag Note</kbd> Move</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">O</kbd> Overview</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">F</kbd> Fit all</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Scroll</kbd> Zoom</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Drag</kbd> Pan</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">±/0</kbd> Zoom/Reset</div>
          </div>
        </div>
      )}

      {/* Mobile gesture hint */}
      {notes.length > 0 && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg border p-3 text-center z-30">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Gestures:</strong> 🤏 Pinch to zoom • 👆 Slide to pan • ✋ Drag notes • 📋 Tap overview
          </p>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  )
}
