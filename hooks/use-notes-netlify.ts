"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { notesApi, type Note } from "@/lib/api/notes"

export function useNotesNetlify() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({})
  const [bulkOperationTimer, setBulkOperationTimer] = useState<NodeJS.Timeout | null>(null)
  const pendingChanges = useRef<Set<string>>(new Set())

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      console.log("Loading notes from Neon database...")
      try {
        const { data, error } = await notesApi.getAll()
        if (error) {
          console.error("Error loading notes:", error)
        } else {
          setNotes(data)
          console.log(`Loaded ${data.length} notes from database`)
        }
      } catch (error) {
        console.error("Failed to load notes:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotes()
  }, [])

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
          console.log("Note created successfully:", realNote.id)
        } catch (error) {
          console.error("Error creating note:", error)
          setNotes((prev) => prev.filter((note) => note.id !== tempId))
          pendingChanges.current.delete(tempId)
        }
      }, 300)
      setDebounceTimers((prev) => ({ ...prev, [tempId]: timer }))
    },
    [debounceTimers],
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
          console.log("Note updated successfully:", id)
        } catch (error) {
          console.error("Error updating note:", error)
          pendingChanges.current.delete(id)
        }
      }, 300)
      setDebounceTimers((prev) => ({ ...prev, [id]: timer }))
    },
    [debounceTimers],
  )

  const deleteNote = async (id: string) => {
    try {
      if (debounceTimers[id]) {
        clearTimeout(debounceTimers[id])
        setDebounceTimers((prev) => {
          const newTimers = { ...prev }
          delete newTimers[id]
          return newTimers
        })
      }

      setNotes((prev) => prev.filter((note) => note.id !== id))
      
      if (!id.startsWith("temp-")) {
        const { error } = await notesApi.delete(id)
        if (error) throw error
      }
      
      console.log("Note deleted successfully:", id)
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const clearAllNotes = useCallback(async () => {
    if (bulkOperationTimer) clearTimeout(bulkOperationTimer)
    
    // Clear all debounce timers
    Object.values(debounceTimers).forEach(clearTimeout)
    setDebounceTimers({})
    
    // Optimistically clear notes
    setNotes([])
    
    const timer = setTimeout(async () => {
      try {
        const { error } = await notesApi.clearAll()
        if (error) throw error
        console.log("All notes cleared successfully")
      } catch (error) {
        console.error("Error clearing notes:", error)
      }
    }, 400)
    setBulkOperationTimer(timer)
  }, [debounceTimers, bulkOperationTimer])

  return { 
    notes, 
    loading, 
    connected: true, // Always show as connected for Netlify version
    userCount: 1, // Single user for Netlify version
    createNote, 
    updateNote, 
    deleteNote, 
    clearAllNotes 
  }
}