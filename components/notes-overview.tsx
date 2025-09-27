"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EyeOff, Grid3X3, Search, MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Note } from "@/hooks/use-realtime-notes"

interface NotesOverviewProps {
  notes: Note[]
  onNoteClick: (note: Note) => void
  onToggleOverview: () => void
  isVisible: boolean
}

const colorClasses = {
  yellow: "bg-yellow-200 border-yellow-300",
  pink: "bg-pink-200 border-pink-300", 
  blue: "bg-blue-200 border-blue-300",
  green: "bg-green-200 border-green-300",
  orange: "bg-orange-200 border-orange-300",
  purple: "bg-purple-200 border-purple-300",
}

export function NotesOverview({ notes, onNoteClick, onToggleOverview, isVisible }: NotesOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleOverview}
        variant="outline"
        size="sm"
        className="hidden md:flex fixed top-2 right-2 md:top-4 md:right-4 z-50 bg-card/95 backdrop-blur-sm items-center"
        title="Show notes overview"
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="ml-2">Overview ({notes.length})</span>
      </Button>
    )
  }

  return (
    <div className="fixed top-2 right-2 md:top-4 md:right-4 z-50 w-full max-w-[calc(100vw-1rem)] md:w-80 bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Notes Overview ({notes.length})
          </h3>
          <Button
            onClick={onToggleOverview}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
        
        {notes.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-background border rounded focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            {notes.length === 0 ? "No notes yet" : "No notes match your search"}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => onNoteClick(note)}
                className={cn(
                  "w-full p-2 rounded border-2 text-left hover:scale-105 transition-transform",
                  colorClasses[note.color as keyof typeof colorClasses]
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {note.content || "Empty note"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>x:{Math.round(note.x)}, y:{Math.round(note.y)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "w-3 h-3 rounded-full border",
                    colorClasses[note.color as keyof typeof colorClasses]
                  )} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}