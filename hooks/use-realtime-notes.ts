"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { notesApi, type Note } from "@/lib/api/notes"

export type { Note }
import { SSERealtimeClient } from "@/lib/realtime/sse-client"

interface DbNote {
  id: string
  content: string
  x_position: number
  y_position: number
  color: string
  created_at: string
  updated_at: string
}

export function useRealtimeNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [userCount, setUserCount] = useState(1)
  const [realtimeClient] = useState(() => new SSERealtimeClient({
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
    onUserCountUpdate: (count) => setUserCount(count),
    onEvent: (event) => {
      console.log("Real-time event received:", event.type, event.data)
      
      if (event.type === "NOTE_CREATED") {
        const newNote = event.data as Note
        console.log("Adding new note from other user:", newNote)
        setNotes((prev) => {
          const exists = prev.some((note) => note.id === newNote.id)
          if (exists) return prev
          return [...prev, newNote]
        })
      } else if (event.type === "NOTE_UPDATED") {
        const updatedNote = event.data as Note
        console.log("Updating note from other user:", updatedNote.id)
        
        if (!pendingChanges.current.has(updatedNote.id)) {
          setNotes((prev) => prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)))
        }
      } else if (event.type === "NOTE_DELETED") {
        const deletedId = (event.data as { id: string })?.id
        console.log("Deleting note from other user:", deletedId)
        if (!pendingChanges.current.has(deletedId)) {
          setNotes((prev) => prev.filter((note) => note.id !== deletedId))
        }
      } else if (event.type === "NOTES_CLEARED") {
        console.log("Clearing all notes from other user")
        setNotes([])
      }
    }
  }))

  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({})
  const [bulkOperationTimer, setBulkOperationTimer] = useState<NodeJS.Timeout | null>(null)
  const pendingChanges = useRef<Set<string>>(new Set())



  // Load initial notes
  useEffect(() => {
    async function loadNotes() {
      try {
        console.log("Loading notes from Neon database...")
        const { data, error } = await notesApi.getAll()
        if (error) throw error
        
        setNotes(data)
        setConnected(true)
        console.log(`Loaded ${data.length} notes from database`)
      } catch (error) {
        console.error("Error loading notes:", error)
        setConnected(false)
      } finally {
        setLoading(false)
      }
    }
    loadNotes()
  }, [])

  // Set up real-time SSE connection
  useEffect(() => {
    console.log("Setting up real-time SSE subscriptions...")
    setConnected(realtimeClient.isConnectedToServer())
    
    return () => {
      realtimeClient.disconnect()
    }
  }, [realtimeClient])

  const createNote = useCallback(
    (noteData: Omit<Note, "id">) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const tempNote: Note = { id: tempId, ...noteData, created_at: new Date().toISOString() }
      setNotes((prev) => [...prev, tempNote])
      pendingChanges.current.add(tempId)

      if (debounceTimers[tempId]) clearTimeout(debounceTimers[tempId])
      const timer = setTimeout(async () => {
        try {
          const { data, error } = await notesApi.create(noteData)
          if (error) throw error
          if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error("No data returned from insert")
          }
          
          const realNote = data[0]
          setNotes((prev) => prev.map((note) => (note.id === tempId ? realNote : note)))
          pendingChanges.current.delete(tempId)
          
          // Send real-time event to other users
          realtimeClient.sendEvent({
            type: "NOTE_CREATED",
            data: realNote
          })
          
          console.log("Note created successfully:", realNote.id)
        } catch (error) {
          console.error("Error creating note:", error)
          setNotes((prev) => prev.filter((note) => note.id !== tempId))
          pendingChanges.current.delete(tempId)
        }
      }, 400)
      setDebounceTimers((prev) => ({ ...prev, [tempId]: timer }))
    },
    [debounceTimers, realtimeClient],
  )

  const updateNote = useCallback(
    (id: string, updates: Partial<Note>) => {
      if (debounceTimers[id]) clearTimeout(debounceTimers[id])
      pendingChanges.current.add(id)
      setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, ...updates } : note)))
      
      if (id.startsWith("temp-")) return
      
      const timer = setTimeout(async () => {
        try {
          const { data, error } = await notesApi.update(id, updates)
          if (error) throw error
          
          pendingChanges.current.delete(id)
          
          // Send real-time event to other users
          if (data && Array.isArray(data) && data.length > 0) {
            realtimeClient.sendEvent({
              type: "NOTE_UPDATED",
              data: data[0]
            })
          }
          
          console.log("Note updated successfully:", id)
        } catch (error) {
          console.error("Error updating note:", error)
          pendingChanges.current.delete(id)
        }
      }, 300)
      setDebounceTimers((prev) => ({ ...prev, [id]: timer }))
    },
    [debounceTimers, realtimeClient],
  )

  const deleteNote = async (id: string) => {
    try {
      if (debounceTimers[id]) {
        clearTimeout(debounceTimers[id])
        setDebounceTimers((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
      pendingChanges.current.delete(id)
      
      const { data, error } = await notesApi.delete(id)
      if (error) throw error
      
      // Send real-time event to other users
      realtimeClient.sendEvent({
        type: "NOTE_DELETED",
        data: { id }
      })
      
      console.log("Note deleted successfully:", id)
    } catch (error) {
      console.error("Error deleting note:", error)
      throw error
    }
  }

  const clearAllNotes = useCallback(async () => {
    Object.values(debounceTimers).forEach((t) => clearTimeout(t))
    setDebounceTimers({})
    if (bulkOperationTimer) clearTimeout(bulkOperationTimer)
    setNotes([])
    
    const timer = setTimeout(async () => {
      try {
        const { error } = await notesApi.clearAll()
        if (error) throw error
        
        // Send real-time event to other users
        realtimeClient.sendEvent({
          type: "NOTES_CLEARED",
          data: { cleared: true }
        })
        
        console.log("All notes cleared successfully")
      } catch (error) {
        console.error("Error clearing notes:", error)
        // Reload notes on error
        const { data } = await notesApi.getAll()
        if (data) setNotes(data)
      }
    }, 400)
    setBulkOperationTimer(timer)
  }, [debounceTimers, bulkOperationTimer, realtimeClient])

  return { notes, loading, connected, userCount, createNote, updateNote, deleteNote, clearAllNotes }
}
