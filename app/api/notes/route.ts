import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database/client'

export async function GET() {
  try {
    const { data, error } = await db.select('notes')
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = await db.insert('notes', {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { error } = await db.query('DELETE FROM notes')
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to clear notes' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}