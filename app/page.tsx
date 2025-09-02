"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PostItNote } from "@/components/postit-note"
import { ColorPicker } from "@/components/color-picker"
import { Plus, Trash2, Wifi, WifiOff } from "lucide-react"
import { useRealtimeNotes } from "@/hooks/use-realtime-notes"

export default function PostItApp() {
  const [selectedColor, setSelectedColor] = useState("yellow")
  const { notes, loading, connected, createNote, updateNote, deleteNote, clearAllNotes } = useRealtimeNotes()

  const handleCreateNote = async () => {
    const isMobile = window.innerWidth < 768
    const maxX = window.innerWidth - (isMobile ? 160 : 200)
    const maxY = window.innerHeight - (isMobile ? 200 : 300)
    const minY = isMobile ? 120 : 100

    const newNoteData = {
      x: Math.random() * Math.max(0, maxX),
      y: Math.random() * Math.max(0, maxY) + minY,
      content: "",
      color: selectedColor,
    }

    try {
      await createNote(newNoteData)
    } catch (error) {
      console.error("Failed to create note:", error)
    }
  }

  const handleUpdateNotePosition = (id: string, x: number, y: number) => {
    updateNote(id, { x, y })
  }

  const handleUpdateNoteContent = (id: string, content: string) => {
    updateNote(id, { content })
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id)
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  const handleClearAllNotes = async () => {
    try {
      await clearAllNotes()
    } catch (error) {
      console.error("Failed to clear notes:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background canvas-grid flex items-center justify-center">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg border p-6 shadow-lg">
          <p className="text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background canvas-grid relative overflow-hidden">
      <div className="fixed top-2 left-2 md:top-4 md:left-4 z-50 flex flex-col gap-2 md:gap-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg border p-3 md:p-4 shadow-lg max-w-[calc(100vw-1rem)] md:max-w-none">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h1 className="text-lg md:text-xl font-bold text-foreground">Post-It Notes</h1>
            <div className="flex items-center gap-1">
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
              Click "Add Note" to create your first sticky note! You can drag them around and edit by clicking the
              pencil icon. Notes are shared with other users in real-time.
            </p>
          </div>
        )}
      </div>

      {/* Notes Canvas */}
      <div className="absolute inset-0">
        {notes.map((note) => (
          <PostItNote
            key={note.id}
            id={note.id}
            x={note.x}
            y={note.y}
            content={note.content}
            color={note.color}
            onPositionUpdate={handleUpdateNotePosition}
            onContentUpdate={handleUpdateNoteContent}
            onDelete={handleDeleteNote}
          />
        ))}
      </div>

      {notes.length > 0 && (
        <div className="fixed bottom-2 right-2 md:bottom-4 md:right-4 bg-card/95 backdrop-blur-sm rounded-lg border p-2 md:p-3 max-w-[calc(100vw-1rem)] md:max-w-xs">
          <p className="text-xs text-muted-foreground">
            <strong>Tips:</strong> Drag notes to move them around. Click the pencil to edit. Changes are synced with
            other users in real-time.
          </p>
        </div>
      )}
    </div>
  )
}
