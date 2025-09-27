// Client-side API helper for notes operations
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
  x_position: number | string
  y_position: number | string
  color: string
  created_at: string
  updated_at: string
}

const dbToClient = (dbNote: DbNote): Note => ({
  id: dbNote.id,
  content: dbNote.content,
  x: Number(dbNote.x_position) || 0,
  y: Number(dbNote.y_position) || 0,
  color: dbNote.color,
  created_at: dbNote.created_at,
  updated_at: dbNote.updated_at,
})

const clientToDb = (note: Partial<Note>): Record<string, unknown> => {
  const dbNote: Record<string, unknown> = {}
  if (note.content !== undefined) dbNote.content = note.content
  if (note.color !== undefined) dbNote.color = note.color
  if (note.x !== undefined) dbNote.x_position = note.x
  if (note.y !== undefined) dbNote.y_position = note.y
  return dbNote
}

export const notesApi = {
  async getAll(): Promise<{ data: Note[], error: unknown }> {
    try {
      const response = await fetch('/api/notes')
      const result = await response.json()
      
      if (!response.ok) {
        return { data: [], error: result.error }
      }
      
      const clientNotes = Array.isArray(result.data) 
        ? (result.data as DbNote[]).map(dbToClient) 
        : []
      
      return { data: clientNotes, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  async create(noteData: Omit<Note, 'id'>): Promise<{ data: Note[], error: unknown }> {
    try {
      const dbData = clientToDb(noteData)
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbData)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        return { data: [], error: result.error }
      }
      
      const clientNotes = Array.isArray(result.data) 
        ? (result.data as DbNote[]).map(dbToClient) 
        : []
      
      return { data: clientNotes, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  async update(id: string, updates: Partial<Note>): Promise<{ data: Note[], error: unknown }> {
    try {
      const dbUpdates = clientToDb(updates)
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbUpdates)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        return { data: [], error: result.error }
      }
      
      const clientNotes = Array.isArray(result.data) 
        ? (result.data as DbNote[]).map(dbToClient) 
        : []
      
      return { data: clientNotes, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  async delete(id: string): Promise<{ data: unknown, error: unknown }> {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        return { data: null, error: result.error }
      }
      
      return { data: result.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async clearAll(): Promise<{ error: unknown }> {
    try {
      const response = await fetch('/api/notes', {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        return { error: result.error }
      }
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}