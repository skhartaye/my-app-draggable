import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { data, error } = await db.update(
      'notes',
      {
        ...body,
        updated_at: new Date().toISOString()
      },
      'id = $1',
      [resolvedParams.id]
    )
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { data, error } = await db.delete('notes', 'id = $1', [resolvedParams.id])
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}