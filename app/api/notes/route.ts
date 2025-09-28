import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database/client'

export async function GET() {
  try {
    console.log('📖 Fetching notes from database...')
    const { data, error } = await db.select('notes')
    
    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch notes', details: error }, { status: 500 })
    }

    console.log(`✅ Successfully fetched ${data.length} notes`)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating new note...')
    const body = await request.json()
    console.log('📝 Note data:', body)
    
    const noteData = {
      content: body.content || '',
      x_position: body.x || 0,
      y_position: body.y || 0,
      color: body.color || 'yellow',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Inserting note data:', noteData)
    const { data, error } = await db.insert('notes', noteData)
    
    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: 'Failed to create note', details: error }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error('❌ No data returned from insert')
      return NextResponse.json({ error: 'No data returned from insert' }, { status: 500 })
    }

    console.log('✅ Successfully created note:', data[0])
    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
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