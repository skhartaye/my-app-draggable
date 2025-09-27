"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PostItNote } from "@/components/postit-note"
import { ColorPicker } from "@/components/color-picker"
import { Plus, Trash2, Wifi, Grid3X3 } from "lucide-react"
import { useNotesNetlify } from "@/hooks/use-notes-netlify"
import { NotesLoadingSkeleton } from "@/components/loading-skeleton"
import { ToastContainer, useToast } from "@/components/toast"
import { NotesOverview } from "@/components/notes-overview"
import { ViewportNavigator } from "@/components/viewport-navigator"
import { Minimap } from "@/components/minimap"
import { ZoomableCanvas } from "@/components/zoomable-canvas"

export default function PostItApp() {
  const [selectedColor, setSelectedColor] = useState("yellow")
  const [showOverview, setShowOverview] = useState(false)
  const [viewport, setViewport] = useState({ scale: 1, translateX: 0, translateY: 0 })
  const { notes, loading, connected, userCount, createNote, updateNote, deleteNote, clearAllNotes } = useNotesNetlify()
  const toast = useToast()

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
    
    const x = Math.max(0, viewportCenterX - noteWidth / 2 + randomOffsetX)
    const y = Math.max(0, viewportCenterY - noteHeight / 2 + randomOffsetY)

    await createNote({
      content: "",
      x,
      y,
      color: selectedColor,
    })
    
    toast.success("Note created!")
  }, [selectedColor, viewport, createNote, toast])

  const handleUpdateNoteContent = useCallback(
    (id: string, content: string) => {
      updateNote(id, { content })
    },
    [updateNote],
  )

  const handleUpdateNotePosition = useCallback(
    (id: string, x: number, y: number) => {
      updateNote(id, { x, y })
    },
    [updateNote],
  )

  const handleDeleteNote = useCallback(
    async (id: string) => {
      await deleteNote(id)
      toast.success("Note deleted!")
    },
    [deleteNote, toast],
  )

  const handleClearAll = useCallback(async () => {
    if (notes.length === 0) return
    
    const confirmed = window.confirm(`Are you sure you want to delete all ${notes.length} notes? This cannot be undone.`)
    if (confirmed) {
      await clearAllNotes()
      toast.success("All notes cleared!")
    }
  }, [notes.length, clearAllNotes, toast])

  const handleViewportChange = useCallback((newViewport: { scale: number; translateX: number; translateY: number }) => {
    setViewport(newViewport)
  }, [])



  if (loading) {
    return <NotesLoadingSkeleton />
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border">
            <Wifi className={`h-4 w-4 ${connected ? "text-green-500" : "text-red-500"}`} />
            <span className="text-sm font-medium">
              {connected ? "Connected" : "Offline"}
            </span>
            <span className="text-xs text-muted-foreground">
              • {userCount} user{userCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border">
            <span className="text-sm font-medium">{notes.length} notes</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            onClick={() => setShowOverview(!showOverview)}
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm hover:bg-white/95 border shadow-lg"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          
          <Button
            onClick={handleClearAll}
            variant="outline"
            size="sm"
            disabled={notes.length === 0}
            className="bg-white/90 backdrop-blur-sm hover:bg-white/95 border shadow-lg hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-4">
        <ColorPicker selectedColor={selectedColor} onColorSelect={setSelectedColor} />
        
        <Button
          onClick={handleCreateNote}
          size="lg"
          className="rounded-full h-14 w-14 shadow-2xl hover:scale-110 transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Viewport Navigator */}
      <ViewportNavigator
        notes={notes}
        onViewportChange={handleViewportChange}
      />

      {/* Notes Overview */}
      <NotesOverview
        notes={notes}
        onToggleOverview={() => setShowOverview(!showOverview)}
        onNoteClick={(note) => {
          setViewport({
            scale: 1,
            translateX: window.innerWidth / 2 - note.x - 96,
            translateY: window.innerHeight / 2 - note.y - 96,
          })
          setShowOverview(false)
        }}
        isVisible={showOverview}
      />

      {/* Minimap */}
      <Minimap
        notes={notes}
        viewport={viewport}
        onViewportChange={handleViewportChange}
      />

      {/* Zoomable Canvas */}
      <ZoomableCanvas
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

      {/* Mobile zoom indicator */}
      {viewport.scale !== 1 && (
        <div className="md:hidden fixed top-1/2 left-4 transform -translate-y-1/2 bg-black/80 text-white px-3 py-2 rounded-full text-sm font-medium z-40">
          {Math.round(viewport.scale * 100)}%
        </div>
      )}

      {/* Instructions for first-time users */}
      {notes.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Sticky Notes!</h2>
            <p className="text-gray-600 mb-6">
              Click the + button to create your first note. You can drag notes around, edit them by clicking the edit icon, and change colors using the color picker.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">• Drag to move</span>
              <span className="bg-gray-100 px-2 py-1 rounded">• Click edit to type</span>
              <span className="bg-gray-100 px-2 py-1 rounded">• Pinch to zoom</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}