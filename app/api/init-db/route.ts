import { NextResponse } from 'next/server'
import { db } from '@/lib/database/client'

export async function POST() {
  try {
    console.log('🔧 Initializing database...')
    
    // Create notes table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT DEFAULT '',
        x_position INTEGER DEFAULT 0,
        y_position INTEGER DEFAULT 0,
        color VARCHAR(50) DEFAULT 'yellow',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    const { error: createError } = await db.query(createTableSQL)
    if (createError) {
      console.error('❌ Error creating table:', createError)
      return NextResponse.json({ error: 'Failed to create table', details: createError }, { status: 500 })
    }
    
    // Create index
    const createIndexSQL = `CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)`
    const { error: indexError } = await db.query(createIndexSQL)
    if (indexError) {
      console.error('⚠️ Warning: Could not create index:', indexError)
    }
    
    // Check if table exists and get structure
    const { data: tableInfo, error: infoError } = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notes' 
      ORDER BY ordinal_position
    `)
    
    if (infoError) {
      console.error('❌ Error getting table info:', infoError)
      return NextResponse.json({ error: 'Failed to get table info', details: infoError }, { status: 500 })
    }
    
    console.log('✅ Database initialized successfully')
    console.log('📋 Table structure:', tableInfo)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully',
      tableStructure: tableInfo
    })
    
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    return NextResponse.json({ error: 'Database initialization failed', details: error }, { status: 500 })
  }
}