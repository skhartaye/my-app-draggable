"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Note {
  id: string
  content: string
  x: number
  y: number
  color: string
  created_at?: string
  updated_at?: string
}

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
  const supabase = createClient()

  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({})
  const [bulkOperationTimer, setBulkOperationTimer] = useState<NodeJS.Timeout | null>(null)
  const pendingChanges = useRef<Set<string>>(new Set())

  const dbToClient = (dbNote: DbNote): Note => ({
    id: dbNote.id,
    content: dbNote.content,
    x: dbNote.x_position,
    y: dbNote.y_position,
    color: dbNote.color,
    created_at: dbNote.created_at,
    updated_at: dbNote.updated_at,
  })

  const clientToDb = (note: Partial<Note>): Partial<DbNote> => {
    const dbNote: Partial<DbNote> = {}
    if (note.id !== undefined) dbNote.id = note.id
    if (note.content !== undefined) dbNote.content = note.content
    if (note.color !== undefined) dbNote.color = note.color
    if (note.created_at !== undefined) dbNote.created_at = note.created_at
    if (note.updated_at !== undefined) dbNote.updated_at = note.updated_at
    if (note.x !== undefined) dbNote.x_position = note.x
    if (note.y !== undefined) dbNote.y_position = note.y
    return dbNote
  }

  useEffect(() => {
    async function loadNotes() {
      try {
        const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: true })
        if (error) throw error
        setNotes((data as DbNote[]).map(dbToClient))
        setConnected(true)
      } catch (error) {
        console.error("Error loading notes:", error)
      } finally {
        setLoading(false)
      }
    }
    loadNotes()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel("notes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNote = dbToClient(payload.new as DbNote)
            setNotes((prev) => {
              const exists = prev.some((note) => note.id === newNote.id)
              return exists ? prev : [...prev, newNote]
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedNote = dbToClient(payload.new as DbNote)
            if (!pendingChanges.current.has(updatedNote.id)) {
              setNotes((prev) => prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)))
            }
          } else if (payload.eventType === "DELETE") {
            if (!pendingChanges.current.has(payload.old.id)) {
              setNotes((prev) => prev.filter((note) => note.id !== payload.old.id))
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const createNote = useCallback(
    (noteData: Omit<Note, "id">) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const tempNote: Note = { id: tempId, ...noteData }
      setNotes((prev) => [...prev, tempNote])
      pendingChanges.current.add(tempId)

      if (debounceTimers[tempId]) clearTimeout(debounceTimers[tempId])
      const timer = setTimeout(async () => {
        try {
          const dbData = clientToDb(noteData)
          const { data, error } = await (supabase.from("notes") as any).insert([dbData]).select().single()
          if (error) throw error
          const realNote = dbToClient(data as DbNote)
          setNotes((prev) => prev.map((note) => (note.id === tempId ? realNote : note)))
          pendingChanges.current.delete(tempId)
        } catch (error) {
          console.error("Error creating note:", error)
          setNotes((prev) => prev.filter((note) => note.id !== tempId))
          pendingChanges.current.delete(tempId)
        }
      }, 400)
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
          const dbUpdates = clientToDb(updates)
          const { error } = await (supabase.from("notes") as any).update(dbUpdates).eq("id", id)
          if (error) throw error
          pendingChanges.current.delete(id)
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
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
      pendingChanges.current.delete(id)
      const { error } = await supabase.from("notes").delete().eq("id", id)
      if (error) throw error
    } catch (error) {
      console.error("Error deleting note:", error)
      throw error
    }
  }

  const clearAllNotes = useCallback(() => {
    Object.values(debounceTimers).forEach((t) => clearTimeout(t))
    setDebounceTimers({})
    if (bulkOperationTimer) clearTimeout(bulkOperationTimer)
    setNotes([])
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase.from("notes").delete().neq("id", "00000000-0000-0000-0000-000000000000")
        if (error) throw error
      } catch (error) {
        console.error("Error clearing notes:", error)
        const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: true })
        if (data) setNotes((data as DbNote[]).map(dbToClient))
      }
    }, 400)
    setBulkOperationTimer(timer)
  }, [debounceTimers, bulkOperationTimer])

  return { notes, loading, connected, createNote, updateNote, deleteNote, clearAllNotes }
}
